import express from 'express';
import db from '../database.js';

const router = express.Router();

// Obtener todas las categorías
router.get('/', (req, res) => {
  try {
    const categorias = db.prepare(`
      SELECT c.*, 
        (SELECT nombre FROM categorias WHERE id = c.parent_id) as parent_nombre
      FROM categorias c
      ORDER BY c.nombre
    `).all();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener categorías en árbol
router.get('/arbol', (req, res) => {
  try {
    const categorias = db.prepare('SELECT * FROM categorias ORDER BY nombre').all();
    
    const buildTree = (parentId = null) => {
      return categorias
        .filter(c => c.parent_id === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };

    res.json(buildTree());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear categoría
router.post('/', (req, res) => {
  try {
    const { nombre, parent_id } = req.body;
    const result = db.prepare(
      'INSERT INTO categorias (nombre, parent_id) VALUES (?, ?)'
    ).run(nombre, parent_id || null);
    res.status(201).json({ id: result.lastInsertRowid, nombre, parent_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar categoría
router.put('/:id', (req, res) => {
  try {
    const { nombre, parent_id } = req.body;
    db.prepare(
      'UPDATE categorias SET nombre = ?, parent_id = ? WHERE id = ?'
    ).run(nombre, parent_id, req.params.id);
    res.json({ id: req.params.id, nombre, parent_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar categoría
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas por categoría
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COALESCE(categoria_manual, categoria_yolo, 'Sin categoría') as categoria,
        COUNT(*) as count
      FROM items
      GROUP BY COALESCE(categoria_manual, categoria_yolo, 'Sin categoría')
      ORDER BY count DESC
    `).all();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
