"""
Servicio de clasificación de imágenes con YOLO
Este servicio recibe imágenes y devuelve las clasificaciones detectadas.
"""

import os
import io
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
import torch

# Intentar importar ultralytics
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("⚠️  ultralytics no está instalado. El servicio funcionará en modo simulado.")

app = FastAPI(
    title="YOLO Classification Service",
    description="Servicio de clasificación de imágenes para inventario",
    version="1.0.0"
)

# CORS para permitir llamadas desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo YOLO (se carga una sola vez al iniciar)
model = None
MODEL_PATH = os.environ.get("YOLO_MODEL", "yolov8n.pt")  # Modelo por defecto: nano (más rápido)


class Detection(BaseModel):
    """Representa una detección individual"""
    class_name: str
    confidence: float
    bbox: Optional[List[float]] = None  # [x1, y1, x2, y2]


class ClassificationResult(BaseModel):
    """Resultado de la clasificación"""
    success: bool
    detections: List[Detection]
    primary_class: Optional[str] = None
    primary_confidence: Optional[float] = None
    error: Optional[str] = None


def load_model():
    """Carga el modelo YOLO si está disponible"""
    global model
    if not YOLO_AVAILABLE:
        return False
    
    try:
        print(f"🔄 Cargando modelo YOLO: {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        print(f"✅ Modelo cargado correctamente")
        return True
    except Exception as e:
        print(f"❌ Error cargando modelo: {e}")
        return False


@app.on_event("startup")
async def startup_event():
    """Se ejecuta al iniciar el servidor"""
    load_model()


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "yolo_available": YOLO_AVAILABLE,
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "device": str(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")
    }


@app.get("/health")
async def health():
    """Health check para monitoreo"""
    return {"status": "healthy", "model_ready": model is not None}


@app.post("/classify", response_model=ClassificationResult)
async def classify_image(file: UploadFile = File(...)):
    """
    Clasifica una imagen usando YOLO.
    
    - **file**: Archivo de imagen (JPEG, PNG, WebP)
    
    Retorna las detecciones encontradas en la imagen.
    """
    # Validar tipo de archivo
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    try:
        # Leer imagen
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convertir a RGB si es necesario
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Si no hay modelo, retornar clasificación simulada
        if model is None:
            return ClassificationResult(
                success=True,
                detections=[
                    Detection(
                        class_name="objeto",
                        confidence=0.5,
                        bbox=None
                    )
                ],
                primary_class="objeto",
                primary_confidence=0.5,
                error="Modelo no disponible - clasificación simulada"
            )
        
        # Ejecutar inferencia
        results = model(image, verbose=False)
        
        # Procesar resultados
        detections = []
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    confidence = float(box.conf[0])
                    bbox = box.xyxy[0].tolist() if box.xyxy is not None else None
                    
                    detections.append(Detection(
                        class_name=class_name,
                        confidence=confidence,
                        bbox=bbox
                    ))
        
        # Ordenar por confianza
        detections.sort(key=lambda x: x.confidence, reverse=True)
        
        # Determinar clase principal
        primary_class = None
        primary_confidence = None
        if detections:
            primary_class = detections[0].class_name
            primary_confidence = detections[0].confidence
        
        return ClassificationResult(
            success=True,
            detections=detections,
            primary_class=primary_class,
            primary_confidence=primary_confidence
        )
        
    except Exception as e:
        return ClassificationResult(
            success=False,
            detections=[],
            error=str(e)
        )


@app.post("/classify-batch")
async def classify_batch(files: List[UploadFile] = File(...)):
    """
    Clasifica múltiples imágenes en batch.
    
    Útil para procesar muchas imágenes de forma más eficiente.
    """
    results = []
    for file in files:
        result = await classify_image(file)
        results.append({
            "filename": file.filename,
            "result": result
        })
    
    return {"results": results}


@app.get("/classes")
async def get_available_classes():
    """
    Retorna la lista de clases que el modelo puede detectar.
    """
    if model is None:
        return {
            "available": False,
            "message": "Modelo no cargado",
            "classes": []
        }
    
    return {
        "available": True,
        "num_classes": len(model.names),
        "classes": list(model.names.values())
    }


# Para ejecutar con: python main.py
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Iniciando servidor YOLO en http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
