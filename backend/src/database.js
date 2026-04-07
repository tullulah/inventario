import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Necesario en Node.js (local y Vercel runtime). En edge/browser usa WebSocket nativo.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || process.env.inventario_DATABASE_URL;
const pool = new Pool({ connectionString });

export default pool;
