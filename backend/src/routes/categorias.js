import express from 'express';
import pool from '../database.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT nombre FROM categorias WHERE id = c.parent_id) as parent_nombre
      FROM categorias c
      ORDER BY c.nombre
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/arbol', async (_req, res) => {
  try {
    const { rows: categorias } = await pool.query('SELECT * FROM categorias ORDER BY nombre');

    const buildTree = (parentId = null) => {
      return categorias
        .filter(c => c.parent_id === parentId)
        .map(c => ({ ...c, children: buildTree(c.id) }));
    };

    res.json(buildTree());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, parent_id } = req.body;
    const { rows: [row] } = await pool.query(
      'INSERT INTO categorias (nombre, parent_id) VALUES ($1, $2) RETURNING id',
      [nombre, parent_id || null]
    );
    res.status(201).json({ id: row.id, nombre, parent_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, parent_id } = req.body;
    await pool.query(
      'UPDATE categorias SET nombre = $1, parent_id = $2 WHERE id = $3',
      [nombre, parent_id, req.params.id]
    );
    res.json({ id: req.params.id, nombre, parent_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(categoria_manual, categoria_yolo, 'Sin categoría') as categoria,
        COUNT(*) as count
      FROM items
      GROUP BY COALESCE(categoria_manual, categoria_yolo, 'Sin categoría')
      ORDER BY count DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
