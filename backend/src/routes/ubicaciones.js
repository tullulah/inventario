import express from 'express';
import db from '../database.js';

const router = express.Router();

// === ESTANTERÍAS ===

// Obtener todas las estanterías
router.get('/estanterias', (req, res) => {
  try {
    const estanterias = db.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM baldas WHERE estanteria_id = e.id) as num_baldas
      FROM estanterias e
      ORDER BY e.nombre
    `).all();
    res.json(estanterias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear estantería
router.post('/estanterias', (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const result = db.prepare(
      'INSERT INTO estanterias (nombre, descripcion) VALUES (?, ?)'
    ).run(nombre, descripcion || null);
    res.status(201).json({ id: result.lastInsertRowid, nombre, descripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estantería
router.put('/estanterias/:id', (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    db.prepare(
      'UPDATE estanterias SET nombre = ?, descripcion = ? WHERE id = ?'
    ).run(nombre, descripcion, req.params.id);
    res.json({ id: req.params.id, nombre, descripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar estantería
router.delete('/estanterias/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM estanterias WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === BALDAS ===

// Obtener baldas de una estantería
router.get('/estanterias/:estanteriaId/baldas', (req, res) => {
  try {
    const baldas = db.prepare(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM cajas WHERE balda_id = b.id) as num_cajas
      FROM baldas b
      WHERE b.estanteria_id = ?
      ORDER BY b.numero
    `).all(req.params.estanteriaId);
    res.json(baldas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear balda
router.post('/estanterias/:estanteriaId/baldas', (req, res) => {
  try {
    const { numero, descripcion } = req.body;
    const result = db.prepare(
      'INSERT INTO baldas (estanteria_id, numero, descripcion) VALUES (?, ?, ?)'
    ).run(req.params.estanteriaId, numero, descripcion || null);
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      estanteria_id: parseInt(req.params.estanteriaId),
      numero, 
      descripcion 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar balda
router.put('/baldas/:id', (req, res) => {
  try {
    const { numero, descripcion } = req.body;
    db.prepare(
      'UPDATE baldas SET numero = ?, descripcion = ? WHERE id = ?'
    ).run(numero, descripcion, req.params.id);
    res.json({ id: req.params.id, numero, descripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar balda
router.delete('/baldas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM baldas WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === CAJAS ===

// Obtener cajas de una balda
router.get('/baldas/:baldaId/cajas', (req, res) => {
  try {
    const cajas = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM items WHERE caja_id = c.id) as num_items
      FROM cajas c
      WHERE c.balda_id = ?
      ORDER BY c.numero
    `).all(req.params.baldaId);
    res.json(cajas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear caja
router.post('/baldas/:baldaId/cajas', (req, res) => {
  try {
    const { numero, etiqueta, descripcion, categoria } = req.body;
    const result = db.prepare(
      'INSERT INTO cajas (balda_id, numero, etiqueta, descripcion, categoria) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.baldaId, numero, etiqueta || null, descripcion || null, categoria || null);
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      balda_id: parseInt(req.params.baldaId),
      numero, 
      etiqueta,
      descripcion,
      categoria
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar caja
router.put('/cajas/:id', (req, res) => {
  try {
    const { numero, etiqueta, descripcion, categoria } = req.body;
    db.prepare(
      'UPDATE cajas SET numero = ?, etiqueta = ?, descripcion = ?, categoria = ? WHERE id = ?'
    ).run(numero, etiqueta, descripcion, categoria, req.params.id);
    res.json({ id: req.params.id, numero, etiqueta, descripcion, categoria });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar caja
router.delete('/cajas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cajas WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener árbol completo de ubicaciones
router.get('/arbol', (req, res) => {
  try {
    const estanterias = db.prepare('SELECT * FROM estanterias ORDER BY nombre').all();
    const baldas = db.prepare('SELECT * FROM baldas ORDER BY numero').all();
    const cajas = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM items WHERE caja_id = c.id) as num_items
      FROM cajas c
      ORDER BY c.numero
    `).all();

    const arbol = estanterias.map(e => ({
      ...e,
      baldas: baldas
        .filter(b => b.estanteria_id === e.id)
        .map(b => ({
          ...b,
          cajas: cajas.filter(c => c.balda_id === b.id)
        }))
    }));

    res.json(arbol);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
