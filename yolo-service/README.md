# Servicio de Clasificación YOLO

Este servicio proporciona una API REST para clasificar imágenes usando modelos YOLO.

## Instalación

```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Ejecución

```bash
# Ejecutar servidor
python main.py

# O con uvicorn directamente
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Uso

### Clasificar una imagen

```bash
curl -X POST "http://localhost:8000/classify" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@imagen.jpg"
```

### Respuesta

```json
{
  "success": true,
  "detections": [
    {
      "class_name": "bottle",
      "confidence": 0.92,
      "bbox": [100, 200, 300, 400]
    }
  ],
  "primary_class": "bottle",
  "primary_confidence": 0.92
}
```

## Modelos disponibles

Por defecto se usa `yolov8n.pt` (nano, más rápido). Puedes cambiar el modelo con la variable de entorno:

```bash
YOLO_MODEL=yolov8s.pt python main.py  # Small
YOLO_MODEL=yolov8m.pt python main.py  # Medium
YOLO_MODEL=yolov8l.pt python main.py  # Large
```

## Documentación API

Una vez ejecutando, accede a:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
