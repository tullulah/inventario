/**
 * Script de migración: crea las tablas en Neon Postgres.
 * Ejecutar una sola vez: node backend/src/migrate.js
 *
 * Requiere DATABASE_URL en el entorno (o en .env).
 */

import 'dotenv/config';
import pool from './database.js';

const sql = `
  CREATE TABLE IF NOT EXISTS estanterias (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS baldas (
    id SERIAL PRIMARY KEY,
    estanteria_id INTEGER NOT NULL REFERENCES estanterias(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estanteria_id, numero)
  );

  CREATE TABLE IF NOT EXISTS cajas (
    id SERIAL PRIMARY KEY,
    balda_id INTEGER NOT NULL REFERENCES baldas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    etiqueta TEXT,
    descripcion TEXT,
    categoria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(balda_id, numero)
  );

  CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    caja_id INTEGER NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
    nombre TEXT,
    descripcion TEXT,
    cantidad INTEGER DEFAULT 1,
    categoria_yolo TEXT,
    categoria_manual TEXT,
    confianza_yolo REAL,
    revisado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fotos (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    es_principal INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function migrate() {
  console.log('🔄 Ejecutando migraciones...');
  await pool.query(sql);
  console.log('✅ Tablas creadas correctamente.');

  // Insertar estanterías de ejemplo si no existen
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM estanterias');
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO estanterias (nombre, descripcion) VALUES
        ('Estantería A', 'Estantería principal izquierda'),
        ('Estantería B', 'Estantería principal derecha'),
        ('Estantería C', 'Estantería del fondo')
    `);
    console.log('✅ Estanterías de ejemplo insertadas.');
  }

  await pool.end();
  console.log('🏁 Migración completada.');
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
