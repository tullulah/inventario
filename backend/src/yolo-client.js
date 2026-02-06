/**
 * Cliente para el servicio de clasificación YOLO
 * Permite enviar imágenes al servicio Python y obtener clasificaciones
 */

const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:8000';

/**
 * Clasifica una imagen usando el servicio YOLO
 * @param {string} imagePath - Ruta al archivo de imagen
 * @returns {Promise<{success: boolean, primary_class?: string, primary_confidence?: number, error?: string}>}
 */
export async function classifyImage(imagePath) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Leer el archivo
    const imageBuffer = fs.readFileSync(imagePath);
    const filename = path.basename(imagePath);
    
    // Crear FormData
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename,
      contentType: 'image/jpeg'
    });

    // Enviar al servicio YOLO
    const response = await fetch(`${YOLO_SERVICE_URL}/classify`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clasificando imagen:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica si el servicio YOLO está disponible
 * @returns {Promise<boolean>}
 */
export async function isYoloServiceAvailable() {
  try {
    const response = await fetch(`${YOLO_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Obtiene las clases disponibles del modelo YOLO
 * @returns {Promise<string[]>}
 */
export async function getAvailableClasses() {
  try {
    const response = await fetch(`${YOLO_SERVICE_URL}/classes`);
    const data = await response.json();
    return data.classes || [];
  } catch {
    return [];
  }
}

export default {
  classifyImage,
  isYoloServiceAvailable,
  getAvailableClasses
};
