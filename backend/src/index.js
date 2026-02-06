import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

import db from './database.js';
import ubicacionesRouter from './routes/ubicaciones.js';
import itemsRouter from './routes/items.js';
import fotosRouter from './routes/fotos.js';
import categoriasRouter from './routes/categorias.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '..', 'uploads');
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/ubicaciones', ubicacionesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/fotos', fotosRouter);
app.use('/api/categorias', categoriasRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Estadísticas generales
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      estanterias: db.prepare('SELECT COUNT(*) as count FROM estanterias').get().count,
      baldas: db.prepare('SELECT COUNT(*) as count FROM baldas').get().count,
      cajas: db.prepare('SELECT COUNT(*) as count FROM cajas').get().count,
      items: db.prepare('SELECT COUNT(*) as count FROM items').get().count,
      itemsRevisados: db.prepare('SELECT COUNT(*) as count FROM items WHERE revisado = 1').get().count,
      itemsPendientes: db.prepare('SELECT COUNT(*) as count FROM items WHERE revisado = 0').get().count,
      fotos: db.prepare('SELECT COUNT(*) as count FROM fotos').get().count,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP corriendo en http://localhost:${PORT}`);
  console.log(`📁 Uploads en: ${uploadsDir}`);
  console.log(`🗄️  Base de datos en: ${dataDir}`);
});

// Servidor HTTPS
const certPath = path.join(__dirname, '..', 'localhost+3.pem');
const keyPath = path.join(__dirname, '..', 'localhost+3-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`🔒 Servidor HTTPS corriendo en https://localhost:${HTTPS_PORT}`);
    console.log(`🔒 También disponible en https://192.168.1.128:${HTTPS_PORT}`);
  });
} else {
  console.log('⚠️  Certificados SSL no encontrados. Solo HTTP disponible.');
  console.log('   Ejecuta: mkcert localhost 127.0.0.1 192.168.1.128 ::1');
}
