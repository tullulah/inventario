import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';

import pool from './database.js';
import { authenticateToken, login, changePassword } from './auth.js';
import ubicacionesRouter from './routes/ubicaciones.js';
import itemsRouter from './routes/items.js';
import fotosRouter from './routes/fotos.js';
import categoriasRouter from './routes/categorias.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Rutas públicas ──────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await changePassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── Rutas protegidas ────────────────────────────────────────────────────────

app.use('/api/ubicaciones', authenticateToken, ubicacionesRouter);
app.use('/api/items', authenticateToken, itemsRouter);
app.use('/api/fotos', authenticateToken, fotosRouter);
app.use('/api/categorias', authenticateToken, categoriasRouter);

app.get('/api/stats', authenticateToken, async (_req, res) => {
  try {
    const [estanterias, baldas, cajas, items, revisados, pendientes, fotos] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM estanterias'),
      pool.query('SELECT COUNT(*) as count FROM baldas'),
      pool.query('SELECT COUNT(*) as count FROM cajas'),
      pool.query('SELECT COUNT(*) as count FROM items'),
      pool.query('SELECT COUNT(*) as count FROM items WHERE revisado = 1'),
      pool.query('SELECT COUNT(*) as count FROM items WHERE revisado = 0'),
      pool.query('SELECT COUNT(*) as count FROM fotos'),
    ]);
    res.json({
      estanterias: parseInt(estanterias.rows[0].count),
      baldas: parseInt(baldas.rows[0].count),
      cajas: parseInt(cajas.rows[0].count),
      items: parseInt(items.rows[0].count),
      itemsRevisados: parseInt(revisados.rows[0].count),
      itemsPendientes: parseInt(pendientes.rows[0].count),
      fotos: parseInt(fotos.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Arranque local ──────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
