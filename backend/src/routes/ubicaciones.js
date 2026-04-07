import express from 'express';
import pool from '../database.js';

const router = express.Router();

// === ESTANTERÍAS ===

router.get('/estanterias', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM baldas WHERE estanteria_id = e.id) as num_baldas
      FROM estanterias e
      ORDER BY e.nombre
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/estanterias', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const { rows: [row] } = await pool.query(
      'INSERT INTO estanterias (nombre, descripcion) VALUES ($1, $2) RETURNING id',
      [nombre, descripcion || null]
    );
    res.status(201).json({ id: row.id, nombre, descripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/estanterias/:id', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    await pool.query(
      'UPDATE estanterias SET nombre = $1, descripcion = $2 WHERE id = $3',
      [nombre, descripcion, req.params.id]
    );
    res.json({ id: req.params.id, nombre, descripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/estanterias/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM estanterias WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === BALDAS ===

router.get('/estanterias/:estanteriaId/baldas', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*,
        (SELECT COUNT(*) FROM cajas WHERE balda_id = b.id) as num_cajas
      FROM baldas b
      WHERE b.estanteria_id = $1
      ORDER BY b.numero
    `, [req.params.estanteriaId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/estanterias/:estanteriaId/baldas', async (req, res) => {
  try {
    const { numero, descripcion } = req.body;
    const { rows: [row] } = await pool.query(
      'INSERT INTO baldas (estanteria_id, numero, descripcion) VALUES ($1, $2, $3) RETURNING id',
      [req.params.estanteriaId, numero, descripcion || null]
    );
    res.status(201).json({
      id: row.id,
      estanteria_id: parseInt(req.params.estanteriaId),
      numero,
      descripcion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/baldas/:id', async (req, res) => {
  try {
    const { numero, descripcion } = req.body;
    await pool.query(
      'UPDATE baldas SET numero = $1, descripcion = $2 WHERE id = $3',
      [numero, descripcion, req.params.id]
    );
    res.json({ id: req.params.id, numero, descripcion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/baldas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM baldas WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === CAJAS ===

router.get('/baldas/:baldaId/cajas', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM items WHERE caja_id = c.id) as num_items
      FROM cajas c
      WHERE c.balda_id = $1
      ORDER BY c.numero
    `, [req.params.baldaId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/baldas/:baldaId/cajas', async (req, res) => {
  try {
    const { numero, etiqueta, descripcion, categoria } = req.body;
    const { rows: [row] } = await pool.query(
      'INSERT INTO cajas (balda_id, numero, etiqueta, descripcion, categoria) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.params.baldaId, numero, etiqueta || null, descripcion || null, categoria || null]
    );
    res.status(201).json({
      id: row.id,
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

router.put('/cajas/:id', async (req, res) => {
  try {
    const { numero, etiqueta, descripcion, categoria } = req.body;
    await pool.query(
      'UPDATE cajas SET numero = $1, etiqueta = $2, descripcion = $3, categoria = $4 WHERE id = $5',
      [numero, etiqueta, descripcion, categoria, req.params.id]
    );
    res.json({ id: req.params.id, numero, etiqueta, descripcion, categoria });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cajas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cajas WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Árbol completo de ubicaciones
router.get('/arbol', async (_req, res) => {
  try {
    const [{ rows: estanterias }, { rows: baldas }, { rows: cajas }] = await Promise.all([
      pool.query('SELECT * FROM estanterias ORDER BY nombre'),
      pool.query('SELECT * FROM baldas ORDER BY numero'),
      pool.query(`
        SELECT c.*, (SELECT COUNT(*) FROM items WHERE caja_id = c.id) as num_items
        FROM cajas c ORDER BY c.numero
      `),
    ]);

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
