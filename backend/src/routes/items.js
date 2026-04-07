import express from 'express';
import pool from '../database.js';

const router = express.Router();

router.get('/', async (req, res) => {
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
    let p = 0;

    if (caja_id) {
      query += ` AND i.caja_id = $${++p}`;
      params.push(caja_id);
    }
    if (revisado !== undefined) {
      query += ` AND i.revisado = $${++p}`;
      params.push(revisado === 'true' ? 1 : 0);
    }
    if (categoria) {
      query += ` AND (i.categoria_manual = $${++p} OR i.categoria_yolo = $${p})`;
      params.push(categoria);
    }
    if (buscar) {
      query += ` AND (i.nombre ILIKE $${++p} OR i.descripcion ILIKE $${p})`;
      params.push(`%${buscar}%`);
    }

    query += ' ORDER BY i.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pendientes', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
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
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(`
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
      WHERE i.id = $1
    `, [req.params.id]);

    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    const { rows: fotos } = await pool.query(
      'SELECT * FROM fotos WHERE item_id = $1 ORDER BY es_principal DESC, created_at ASC',
      [req.params.id]
    );

    res.json({ ...item, fotos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { caja_id, nombre, descripcion, cantidad, categoria_yolo, confianza_yolo } = req.body;

    const { rows: [row] } = await pool.query(`
      INSERT INTO items (caja_id, nombre, descripcion, cantidad, categoria_yolo, confianza_yolo)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [caja_id, nombre || null, descripcion || null, cantidad || 1, categoria_yolo || null, confianza_yolo || null]);

    res.status(201).json({
      id: row.id,
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

router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, cantidad, categoria_manual, revisado, caja_id } = req.body;

    await pool.query(`
      UPDATE items
      SET nombre = $1, descripcion = $2, cantidad = $3, categoria_manual = $4,
          revisado = $5, caja_id = COALESCE($6, caja_id), updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [nombre, descripcion, cantidad, categoria_manual, revisado ? 1 : 0, caja_id, req.params.id]);

    res.json({ id: req.params.id, nombre, descripcion, cantidad, categoria_manual, revisado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/revisar', async (req, res) => {
  try {
    const { categoria_manual, nombre, descripcion } = req.body;

    await pool.query(`
      UPDATE items
      SET revisado = 1,
          categoria_manual = COALESCE($1, categoria_manual),
          nombre = COALESCE($2, nombre),
          descripcion = COALESCE($3, descripcion),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [categoria_manual, nombre, descripcion, req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
