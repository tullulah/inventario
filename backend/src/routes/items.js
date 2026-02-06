import express from 'express';
import db from '../database.js';

const router = express.Router();

// Obtener todos los items (con filtros opcionales)
router.get('/', (req, res) => {
  try {
    const { caja_id, revisado, categoria, buscar } = req.query;
    
    let query = `
      SELECT i.*, 
        c.numero as caja_numero,
        c.etiqueta as caja_etiqueta,
        b.numero as balda_numero,
        e.nombre as estanteria_nombre,
        (SELECT filepath FROM fotos WHERE item_id = i.id AND es_principal = 1 LIMIT 1) as foto_principal
      FROM items i
      JOIN cajas c ON i.caja_id = c.id
      JOIN baldas b ON c.balda_id = b.id
      JOIN estanterias e ON b.estanteria_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (caja_id) {
      query += ' AND i.caja_id = ?';
      params.push(caja_id);
    }

    if (revisado !== undefined) {
      query += ' AND i.revisado = ?';
      params.push(revisado === 'true' ? 1 : 0);
    }

    if (categoria) {
      query += ' AND (i.categoria_manual = ? OR i.categoria_yolo = ?)';
      params.push(categoria, categoria);
    }

    if (buscar) {
      query += ' AND (i.nombre LIKE ? OR i.descripcion LIKE ?)';
      params.push(`%${buscar}%`, `%${buscar}%`);
    }

    query += ' ORDER BY i.created_at DESC';

    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener items pendientes de revisión
router.get('/pendientes', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT i.*, 
        c.numero as caja_numero,
        c.etiqueta as caja_etiqueta,
        b.numero as balda_numero,
        e.nombre as estanteria_nombre,
        (SELECT filepath FROM fotos WHERE item_id = i.id AND es_principal = 1 LIMIT 1) as foto_principal
      FROM items i
      JOIN cajas c ON i.caja_id = c.id
      JOIN baldas b ON c.balda_id = b.id
      JOIN estanterias e ON b.estanteria_id = e.id
      WHERE i.revisado = 0
      ORDER BY i.created_at ASC
    `).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un item por ID
router.get('/:id', (req, res) => {
  try {
    const item = db.prepare(`
      SELECT i.*, 
        c.numero as caja_numero,
        c.etiqueta as caja_etiqueta,
        b.numero as balda_numero,
        b.id as balda_id,
        e.nombre as estanteria_nombre,
        e.id as estanteria_id
      FROM items i
      JOIN cajas c ON i.caja_id = c.id
      JOIN baldas b ON c.balda_id = b.id
      JOIN estanterias e ON b.estanteria_id = e.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Obtener fotos del item
    const fotos = db.prepare(
      'SELECT * FROM fotos WHERE item_id = ? ORDER BY es_principal DESC, created_at ASC'
    ).all(req.params.id);

    res.json({ ...item, fotos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo item
router.post('/', (req, res) => {
  try {
    const { caja_id, nombre, descripcion, cantidad, categoria_yolo, confianza_yolo } = req.body;
    
    const result = db.prepare(`
      INSERT INTO items (caja_id, nombre, descripcion, cantidad, categoria_yolo, confianza_yolo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      caja_id,
      nombre || null,
      descripcion || null,
      cantidad || 1,
      categoria_yolo || null,
      confianza_yolo || null
    );

    res.status(201).json({ 
      id: result.lastInsertRowid,
      caja_id,
      nombre,
      descripcion,
      cantidad: cantidad || 1,
      categoria_yolo,
      confianza_yolo,
      revisado: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar un item
router.put('/:id', (req, res) => {
  try {
    const { nombre, descripcion, cantidad, categoria_manual, revisado, caja_id } = req.body;
    
    db.prepare(`
      UPDATE items 
      SET nombre = ?, descripcion = ?, cantidad = ?, categoria_manual = ?, revisado = ?, caja_id = COALESCE(?, caja_id), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nombre,
      descripcion,
      cantidad,
      categoria_manual,
      revisado ? 1 : 0,
      caja_id,
      req.params.id
    );

    res.json({ id: req.params.id, nombre, descripcion, cantidad, categoria_manual, revisado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar como revisado
router.patch('/:id/revisar', (req, res) => {
  try {
    const { categoria_manual, nombre, descripcion } = req.body;
    
    db.prepare(`
      UPDATE items 
      SET revisado = 1, 
          categoria_manual = COALESCE(?, categoria_manual),
          nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(categoria_manual, nombre, descripcion, req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un item
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
