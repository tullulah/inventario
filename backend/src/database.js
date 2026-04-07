import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Necesario en Node.js (local y Vercel runtime). En edge/browser usa WebSocket nativo.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default pool;
