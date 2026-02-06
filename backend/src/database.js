import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'inventario.db');

const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear tablas
db.exec(`
  -- Ubicaciones (estanterías)
  CREATE TABLE IF NOT EXISTS estanterias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Baldas dentro de cada estantería
  CREATE TABLE IF NOT EXISTS baldas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estanteria_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estanteria_id) REFERENCES estanterias(id) ON DELETE CASCADE,
    UNIQUE(estanteria_id, numero)
  );

  -- Cajas en cada balda
  CREATE TABLE IF NOT EXISTS cajas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balda_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    etiqueta TEXT,
    descripcion TEXT,
    categoria TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (balda_id) REFERENCES baldas(id) ON DELETE CASCADE,
    UNIQUE(balda_id, numero)
  );

  -- Items (productos/objetos)
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caja_id INTEGER NOT NULL,
    nombre TEXT,
    descripcion TEXT,
    cantidad INTEGER DEFAULT 1,
    categoria_yolo TEXT,
    categoria_manual TEXT,
    confianza_yolo REAL,
    revisado INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE
  );

  -- Fotos de cada item
  CREATE TABLE IF NOT EXISTS fotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    es_principal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  -- Categorías personalizadas
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categorias(id) ON DELETE SET NULL
  );
`);

// Insertar algunas estanterías de ejemplo si no existen
const countEstanterias = db.prepare('SELECT COUNT(*) as count FROM estanterias').get();
if (countEstanterias.count === 0) {
  const insertEstanteria = db.prepare('INSERT INTO estanterias (nombre, descripcion) VALUES (?, ?)');
  insertEstanteria.run('Estantería A', 'Estantería principal izquierda');
  insertEstanteria.run('Estantería B', 'Estantería principal derecha');
  insertEstanteria.run('Estantería C', 'Estantería del fondo');
}

export default db;
