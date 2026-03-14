import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('✅ Database schema initialized');
}

export function seedDatabase() {
  const seedPath = path.join(__dirname, 'seed.sql');
  if (fs.existsSync(seedPath)) {
    const seed = fs.readFileSync(seedPath, 'utf8');
    db.exec(seed);
    console.log('✅ Database seeded with demo data');
  }
}

export default db;
