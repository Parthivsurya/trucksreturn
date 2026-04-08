import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // OFF during migrations, re-enabled after

export function initializeDatabase() {
  // Run base schema (CREATE TABLE IF NOT EXISTS — safe to re-run)
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  runMigrations();

  db.pragma('foreign_keys = ON');
  console.log('✅ Database schema initialized');
}

function runMigrations() {
  // Migration 1: add is_active column
  const cols = db.pragma('table_info(users)');
  if (!cols.some(c => c.name === 'is_active')) {
    db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
    console.log('✅ Migration: added is_active column');
  }

  // Migration 2: expand role CHECK to include 'admin'
  const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql || '';
  if (!tableSql.includes("'admin'")) {
    console.log('✅ Migration: recreating users table to add admin role…');
    db.exec(`
      BEGIN;
      ALTER TABLE users RENAME TO users_old;

      CREATE TABLE users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        phone         TEXT,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('driver', 'shipper', 'admin')),
        avatar_url    TEXT,
        avg_rating    REAL    DEFAULT 0,
        total_ratings INTEGER DEFAULT 0,
        is_active     INTEGER DEFAULT 1,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO users SELECT id, name, email, phone, password_hash, role, avatar_url, avg_rating, total_ratings,
        COALESCE(is_active, 1), created_at FROM users_old;

      DROP TABLE users_old;
      COMMIT;
    `);
    console.log('✅ Migration: users table updated with admin role');
  }

  // Migration 3: create settings table with defaults
  const hasSttings = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
  if (!hasSttings) {
    db.exec(`
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO settings VALUES ('site_name',     'ReturnLoad');
      INSERT INTO settings VALUES ('logo_url',      '');
      INSERT INTO settings VALUES ('primary_color', '#0B2545');
      INSERT INTO settings VALUES ('theme_preset',  'navy');
    `);
    console.log('✅ Migration: settings table created');
  }

  // Migration 4: fix child tables whose FK references were auto-renamed to users_old
  const loadsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='loads'").get()?.sql || '';
  if (loadsSql.includes('"users_old"')) {
    console.log('✅ Migration: fixing FK references in child tables…');
    db.exec(`
      BEGIN;

      CREATE TABLE trucks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        truck_type TEXT NOT NULL,
        capacity_tons REAL NOT NULL,
        permit_number TEXT,
        home_state TEXT,
        registration_number TEXT,
        insurance_expiry DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO trucks_new SELECT * FROM trucks;
      DROP TABLE trucks;
      ALTER TABLE trucks_new RENAME TO trucks;

      CREATE TABLE documents_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doc_type TEXT NOT NULL CHECK (doc_type IN ('RC', 'permit', 'insurance', 'PUC', 'licence')),
        file_url TEXT NOT NULL,
        verified INTEGER DEFAULT 0,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO documents_new SELECT * FROM documents;
      DROP TABLE documents;
      ALTER TABLE documents_new RENAME TO documents;

      CREATE TABLE driver_availability_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_lat REAL NOT NULL,
        current_lng REAL NOT NULL,
        dest_lat REAL NOT NULL,
        dest_lng REAL NOT NULL,
        current_city TEXT NOT NULL,
        destination_city TEXT NOT NULL,
        available_from DATETIME DEFAULT CURRENT_TIMESTAMP,
        available_until DATETIME,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO driver_availability_new SELECT * FROM driver_availability;
      DROP TABLE driver_availability;
      ALTER TABLE driver_availability_new RENAME TO driver_availability;

      CREATE TABLE loads_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pickup_lat REAL NOT NULL,
        pickup_lng REAL NOT NULL,
        delivery_lat REAL NOT NULL,
        delivery_lng REAL NOT NULL,
        pickup_city TEXT NOT NULL,
        delivery_city TEXT NOT NULL,
        cargo_type TEXT NOT NULL,
        weight_tons REAL NOT NULL,
        description TEXT,
        handling_instructions TEXT,
        offered_price REAL NOT NULL,
        timeline TEXT,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'booked', 'in_transit', 'delivered', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO loads_new SELECT * FROM loads;
      DROP TABLE loads;
      ALTER TABLE loads_new RENAME TO loads;

      COMMIT;
    `);
    console.log('✅ Migration: child table FK references fixed');
  }
}

export function seedDatabase() {
  const seedPath = path.join(__dirname, 'seed.sql');
  if (fs.existsSync(seedPath)) {
    db.pragma('foreign_keys = OFF');
    db.exec(fs.readFileSync(seedPath, 'utf8'));
    db.pragma('foreign_keys = ON');
    console.log('✅ Database seeded with demo data');
  }
}

export default db;
