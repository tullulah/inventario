import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';

import pool from './database.js';
import ubicacionesRouter from './routes/ubicaciones.js';
import itemsRouter from './routes/items.js';
import fotosRouter from './routes/fotos.js';
import categoriasRouter from './routes/categorias.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/ubicaciones', ubicacionesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/fotos', fotosRouter);
app.use('/api/categorias', categoriasRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Estadísticas generales
app.get('/api/stats', async (req, res) => {
  try {
    const [estanterias, baldas, cajas, items, itemsRevisados, itemsPendientes, fotos] = await Promise.all([
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
      itemsRevisados: parseInt(itemsRevisados.rows[0].count),
      itemsPendientes: parseInt(itemsPendientes.rows[0].count),
      fotos: parseInt(fotos.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Arrancar servidor solo cuando se ejecuta directamente (no en Vercel)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
