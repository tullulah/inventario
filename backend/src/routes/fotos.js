import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { put, del } from '@vercel/blob';
import pool from '../database.js';

const router = express.Router();

// Multer con memoria (sin disco) para Vercel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB (límite de Vercel serverless)
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Use JPEG, PNG, WebP o HEIC.'));
    }
  }
});

function buildBlobPath(originalname) {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const ext = path.extname(originalname);
  const filename = `${uuidv4()}${ext}`;
  return { pathname: `uploads/${yearMonth}/${filename}`, filename };
}

// Clasificar con YOLO (acepta Buffer o URL)
async function classifyWithYolo(imageSource) {
  const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:8000';
  try {
    let imageBlob;
    if (Buffer.isBuffer(imageSource)) {
      imageBlob = new Blob([imageSource], { type: 'image/jpeg' });
    } else {
      const resp = await fetch(imageSource);
      imageBlob = new Blob([await resp.arrayBuffer()], { type: 'image/jpeg' });
    }

    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    const response = await fetch(`${YOLO_SERVICE_URL}/classify`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) return await response.json();
    console.log('YOLO respuesta error:', response.status);
  } catch (error) {
    console.log('YOLO no disponible:', error.message);
  }
  return null;
}

// Subir foto para un item existente
router.post('/upload/:itemId', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });

    const itemId = req.params.itemId;
    const esPrincipal = req.body.es_principal === 'true' ? 1 : 0;

    const { rows: [item] } = await pool.query('SELECT id FROM items WHERE id = $1', [itemId]);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    if (esPrincipal) {
      await pool.query('UPDATE fotos SET es_principal = 0 WHERE item_id = $1', [itemId]);
    }

    const { pathname, filename } = buildBlobPath(req.file.originalname);
    const blob = await put(pathname, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype
    });

    const { rows: [row] } = await pool.query(
      'INSERT INTO fotos (item_id, filename, filepath, es_principal) VALUES ($1, $2, $3, $4) RETURNING id',
      [itemId, filename, blob.url, esPrincipal]
    );

    res.status(201).json({
      id: row.id,
      item_id: parseInt(itemId),
      filename,
      filepath: blob.url,
      es_principal: esPrincipal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Capturar foto y crear item automáticamente
router.post('/captura', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });

    const { caja_id } = req.body;
    let { categoria_yolo, confianza_yolo } = req.body;

    if (!caja_id) return res.status(400).json({ error: 'Se requiere caja_id' });

    const { rows: [caja] } = await pool.query('SELECT id FROM cajas WHERE id = $1', [caja_id]);
    if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });

    // Clasificar con YOLO usando el buffer en memoria
    if (!categoria_yolo) {
      const yoloResult = await classifyWithYolo(req.file.buffer);
      if (yoloResult?.success && yoloResult.primary_class) {
        categoria_yolo = yoloResult.primary_class;
        confianza_yolo = yoloResult.primary_confidence;
        console.log(`✅ YOLO detectó: ${categoria_yolo} (${Math.round(confianza_yolo * 100)}%)`);
      }
    }

    // Subir imagen a Vercel Blob
    const { pathname, filename } = buildBlobPath(req.file.originalname);
    const blob = await put(pathname, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype
    });

    // Crear item
    const { rows: [itemRow] } = await pool.query(
      'INSERT INTO items (caja_id, categoria_yolo, confianza_yolo) VALUES ($1, $2, $3) RETURNING id',
      [caja_id, categoria_yolo || null, confianza_yolo ? parseFloat(confianza_yolo) : null]
    );
    const itemId = itemRow.id;

    // Guardar foto
    const { rows: [fotoRow] } = await pool.query(
      'INSERT INTO fotos (item_id, filename, filepath, es_principal) VALUES ($1, $2, $3, 1) RETURNING id',
      [itemId, filename, blob.url]
    );

    res.status(201).json({
      item: {
        id: itemId,
        caja_id: parseInt(caja_id),
        categoria_yolo,
        confianza_yolo: confianza_yolo ? parseFloat(confianza_yolo) : null,
        revisado: 0
      },
      foto: {
        id: fotoRow.id,
        item_id: itemId,
        filename,
        filepath: blob.url,
        es_principal: 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener fotos de un item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM fotos WHERE item_id = $1 ORDER BY es_principal DESC, created_at ASC',
      [req.params.itemId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Establecer foto principal
router.patch('/:id/principal', async (req, res) => {
  try {
    const { rows: [foto] } = await pool.query('SELECT * FROM fotos WHERE id = $1', [req.params.id]);
    if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

    await pool.query('UPDATE fotos SET es_principal = 0 WHERE item_id = $1', [foto.item_id]);
    await pool.query('UPDATE fotos SET es_principal = 1 WHERE id = $1', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar foto
router.delete('/:id', async (req, res) => {
  try {
    const { rows: [foto] } = await pool.query('SELECT * FROM fotos WHERE id = $1', [req.params.id]);
    if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

    // Eliminar de Vercel Blob
    await del(foto.filepath);

    await pool.query('DELETE FROM fotos WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Re-detectar con YOLO usando la foto principal
router.post('/redetectar/:itemId', async (req, res) => {
  try {
    const { rows: [foto] } = await pool.query(
      'SELECT * FROM fotos WHERE item_id = $1 AND es_principal = 1 LIMIT 1',
      [req.params.itemId]
    );
    if (!foto) return res.status(404).json({ error: 'No hay foto para este item' });

    // La foto está en Vercel Blob — se accede por URL
    const yoloResult = await classifyWithYolo(foto.filepath);

    if (yoloResult?.success) {
      if (yoloResult.primary_class) {
        await pool.query(
          'UPDATE items SET categoria_yolo = $1, confianza_yolo = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [yoloResult.primary_class, yoloResult.primary_confidence, req.params.itemId]
        );
      }
      res.json({
        success: true,
        categoria: yoloResult.primary_class,
        confianza: yoloResult.primary_confidence,
        detecciones: yoloResult.detections || []
      });
    } else {
      res.json({ success: false, error: 'YOLO no pudo clasificar la imagen', detecciones: [] });
    }
  } catch (error) {
    console.error('Error en redetectar:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
