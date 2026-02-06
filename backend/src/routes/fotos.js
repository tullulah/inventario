import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organizar por fecha
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const destPath = path.join(uploadsDir, yearMonth);
    
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Use JPEG, PNG, WebP o HEIC.'));
    }
  }
});

// Subir foto para un item
router.post('/upload/:itemId', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
    }

    const itemId = req.params.itemId;
    const esPrincipal = req.body.es_principal === 'true' ? 1 : 0;

    // Verificar que el item existe
    const item = db.prepare('SELECT id FROM items WHERE id = ?').get(itemId);
    if (!item) {
      // Eliminar el archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Si es principal, desmarcar las demás
    if (esPrincipal) {
      db.prepare('UPDATE fotos SET es_principal = 0 WHERE item_id = ?').run(itemId);
    }

    // Calcular la ruta relativa para servir
    const relativePath = path.relative(uploadsDir, req.file.path);
    const filepath = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Guardar en base de datos
    const result = db.prepare(`
      INSERT INTO fotos (item_id, filename, filepath, es_principal)
      VALUES (?, ?, ?, ?)
    `).run(itemId, req.file.filename, filepath, esPrincipal);

    res.status(201).json({
      id: result.lastInsertRowid,
      item_id: parseInt(itemId),
      filename: req.file.filename,
      filepath,
      es_principal: esPrincipal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Función para clasificar con YOLO
async function classifyWithYolo(imagePath) {
  const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:8000';
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('file', blob, path.basename(imagePath));

    const response = await fetch(`${YOLO_SERVICE_URL}/classify`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.log('YOLO respuesta error:', response.status);
    }
  } catch (error) {
    console.log('YOLO no disponible:', error.message);
  }
  return null;
}

// Subir foto y crear item automáticamente
router.post('/captura', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
    }

    const { caja_id } = req.body;
    let { categoria_yolo, confianza_yolo } = req.body;

    if (!caja_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Se requiere caja_id' });
    }

    // Verificar que la caja existe
    const caja = db.prepare('SELECT id FROM cajas WHERE id = ?').get(caja_id);
    if (!caja) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Intentar clasificar con YOLO automáticamente si no viene ya clasificado
    if (!categoria_yolo) {
      const yoloResult = await classifyWithYolo(req.file.path);
      if (yoloResult && yoloResult.success && yoloResult.primary_class) {
        categoria_yolo = yoloResult.primary_class;
        confianza_yolo = yoloResult.primary_confidence;
        console.log(`✅ YOLO detectó: ${categoria_yolo} (${Math.round(confianza_yolo * 100)}%)`);
      }
    }

    // Crear el item
    const itemResult = db.prepare(`
      INSERT INTO items (caja_id, categoria_yolo, confianza_yolo)
      VALUES (?, ?, ?)
    `).run(caja_id, categoria_yolo || null, confianza_yolo ? parseFloat(confianza_yolo) : null);

    const itemId = itemResult.lastInsertRowid;

    // Guardar la foto
    const relativePath = path.relative(uploadsDir, req.file.path);
    const filepath = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    const fotoResult = db.prepare(`
      INSERT INTO fotos (item_id, filename, filepath, es_principal)
      VALUES (?, ?, ?, 1)
    `).run(itemId, req.file.filename, filepath);

    res.status(201).json({
      item: {
        id: itemId,
        caja_id: parseInt(caja_id),
        categoria_yolo,
        confianza_yolo: confianza_yolo ? parseFloat(confianza_yolo) : null,
        revisado: 0
      },
      foto: {
        id: fotoResult.lastInsertRowid,
        item_id: itemId,
        filename: req.file.filename,
        filepath,
        es_principal: 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener fotos de un item
router.get('/item/:itemId', (req, res) => {
  try {
    const fotos = db.prepare(
      'SELECT * FROM fotos WHERE item_id = ? ORDER BY es_principal DESC, created_at ASC'
    ).all(req.params.itemId);
    res.json(fotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Establecer foto principal
router.patch('/:id/principal', (req, res) => {
  try {
    const foto = db.prepare('SELECT * FROM fotos WHERE id = ?').get(req.params.id);
    if (!foto) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    // Desmarcar todas las del mismo item
    db.prepare('UPDATE fotos SET es_principal = 0 WHERE item_id = ?').run(foto.item_id);
    
    // Marcar esta como principal
    db.prepare('UPDATE fotos SET es_principal = 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar foto
router.delete('/:id', (req, res) => {
  try {
    const foto = db.prepare('SELECT * FROM fotos WHERE id = ?').get(req.params.id);
    if (!foto) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    // Eliminar archivo físico
    const fullPath = path.join(uploadsDir, '..', foto.filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Eliminar de base de datos
    db.prepare('DELETE FROM fotos WHERE id = ?').run(req.params.id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Re-detectar item con YOLO
router.post('/redetectar/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    
    // Obtener la foto principal del item
    const foto = db.prepare(`
      SELECT * FROM fotos WHERE item_id = ? AND es_principal = 1 LIMIT 1
    `).get(itemId);
    
    if (!foto) {
      return res.status(404).json({ error: 'No hay foto para este item' });
    }

    // Ruta completa de la imagen
    const imagePath = path.join(uploadsDir, '..', foto.filepath);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Archivo de imagen no encontrado' });
    }

    // Clasificar con YOLO
    const yoloResult = await classifyWithYolo(imagePath);
    
    if (yoloResult && yoloResult.success) {
      // Actualizar el item con la clasificación
      if (yoloResult.primary_class) {
        db.prepare(`
          UPDATE items 
          SET categoria_yolo = ?, confianza_yolo = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(yoloResult.primary_class, yoloResult.primary_confidence, itemId);
      }

      res.json({
        success: true,
        categoria: yoloResult.primary_class,
        confianza: yoloResult.primary_confidence,
        detecciones: yoloResult.detections || []
      });
    } else {
      res.json({
        success: false,
        error: 'YOLO no pudo clasificar la imagen',
        detecciones: []
      });
    }
  } catch (error) {
    console.error('Error en redetectar:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
