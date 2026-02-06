/**
 * Script para procesar imágenes pendientes con YOLO
 * Ejecutar con: node scripts/process-yolo.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'inventario.db');
const uploadsDir = path.join(__dirname, '..', 'uploads');

const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:8000';

async function checkYoloService() {
  try {
    const response = await fetch(`${YOLO_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json();
    return data.status === 'healthy' && data.model_ready;
  } catch {
    return false;
  }
}

async function classifyImage(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: path.basename(imagePath),
      contentType: 'image/jpeg'
    });

    const response = await fetch(`${YOLO_SERVICE_URL}/classify`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Procesador de imágenes con YOLO\n');

  // Verificar servicio YOLO
  console.log('Verificando servicio YOLO...');
  const yoloAvailable = await checkYoloService();
  
  if (!yoloAvailable) {
    console.error('❌ El servicio YOLO no está disponible.');
    console.log('   Asegúrate de que esté ejecutándose en', YOLO_SERVICE_URL);
    console.log('\n   Para iniciarlo:');
    console.log('   cd yolo-service && python main.py');
    process.exit(1);
  }
  
  console.log('✅ Servicio YOLO disponible\n');

  // Conectar a la base de datos
  const db = new Database(dbPath);

  // Obtener items sin clasificar
  const items = db.prepare(`
    SELECT i.id, i.nombre, f.filepath
    FROM items i
    JOIN fotos f ON f.item_id = i.id AND f.es_principal = 1
    WHERE i.categoria_yolo IS NULL
    ORDER BY i.created_at ASC
  `).all();

  if (items.length === 0) {
    console.log('✨ No hay items pendientes de clasificar.');
    process.exit(0);
  }

  console.log(`📦 ${items.length} items pendientes de clasificar\n`);

  let processed = 0;
  let classified = 0;

  for (const item of items) {
    processed++;
    const imagePath = path.join(uploadsDir, '..', item.filepath);
    
    process.stdout.write(`[${processed}/${items.length}] Item #${item.id}... `);

    if (!fs.existsSync(imagePath)) {
      console.log('⚠️  Imagen no encontrada');
      continue;
    }

    const result = await classifyImage(imagePath);

    if (result && result.success && result.primary_class) {
      db.prepare(`
        UPDATE items 
        SET categoria_yolo = ?, confianza_yolo = ?
        WHERE id = ?
      `).run(result.primary_class, result.primary_confidence, item.id);

      console.log(`✅ ${result.primary_class} (${Math.round(result.primary_confidence * 100)}%)`);
      classified++;
    } else {
      console.log('⚠️  Sin detecciones');
    }

    // Pequeña pausa para no saturar el servicio
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Procesados: ${processed}`);
  console.log(`   Clasificados: ${classified}`);
  console.log(`   Sin detectar: ${processed - classified}`);

  db.close();
}

main().catch(console.error);
