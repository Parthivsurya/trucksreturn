// Required environment variable:
// DATABASE_URL=postgresql://user:password@host:5432/dbname

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set. Refusing to start.');
  process.exit(1);
}

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

export async function initializeDatabase() {
  // Verify the connection is actually reachable before doing anything
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('FATAL: Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  await runMigrations();
  console.log('✅ Database schema initialized');
}

async function runMigrations() {
  // Settings table seed — insert defaults if missing
  const defaultSettings = [
    ['site_name',                'ReturnLoad'],
    ['logo_url',                 ''],
    ['favicon_url',              ''],
    ['primary_color',            '#0f172a'],
    ['accent_color',             '#f59e0b'],
    ['theme_preset',             'freight'],
    ['smtp_enabled',             '0'],
    ['smtp_host',                ''],
    ['smtp_port',                '587'],
    ['smtp_secure',              '0'],
    ['smtp_user',                ''],
    ['smtp_pass',                ''],
    ['smtp_from_name',           ''],
    ['smtp_from_email',          ''],
    ['email_on_login',           '1'],
    ['email_on_booking_shipper', '1'],
    ['email_on_booking_driver',  '1'],
    ['email_on_status_change',   '1'],
    ['email_on_load_status',     '1'],
    ['security_rate_limit',      '1'],
    ['security_otp_required',    '1'],
    ['footer_color',             '#1e293b'],
  ];
  // Add address columns to loads if not present
  await pool.query('ALTER TABLE loads ADD COLUMN IF NOT EXISTS pickup_address TEXT');
  await pool.query('ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivery_address TEXT');
  // Partial load / LTL support — available_capacity_tons on driver availability
  // NULL means full truck available; a number means the driver has declared partial free space
  await pool.query('ALTER TABLE driver_availability ADD COLUMN IF NOT EXISTS available_capacity_tons DOUBLE PRECISION');
  // Expand documents doc_type check constraint to include vehicle photos
  await pool.query('ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_doc_type_check');
  await pool.query(`ALTER TABLE documents ADD CONSTRAINT documents_doc_type_check CHECK (doc_type IN ('RC','permit','insurance','PUC','licence','vehicle_front','vehicle_left','vehicle_right'))`);
  // Driver verification — admin must verify truck documents before driver can accept loads
  // 0 = pending, 1 = verified, 2 = rejected
  await pool.query('ALTER TABLE trucks ADD COLUMN IF NOT EXISTS is_verified INTEGER NOT NULL DEFAULT 0');
  await pool.query('ALTER TABLE trucks ADD COLUMN IF NOT EXISTS verification_note TEXT');
  // Verification history — every rejection is recorded so admin can see past attempts
  await pool.query(`
    CREATE TABLE IF NOT EXISTS verification_history (
      id          SERIAL PRIMARY KEY,
      driver_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action      TEXT NOT NULL CHECK (action IN ('rejected', 'resubmitted')),
      note        TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_verif_history_driver ON verification_history(driver_id, created_at DESC)');
  // Add uuid to bookings for non-guessable public URLs
  await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid()');
  await pool.query("UPDATE bookings SET uuid = gen_random_uuid() WHERE uuid IS NULL");
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_uuid ON bookings(uuid)');
  // Add uuid to loads for non-guessable public URLs
  await pool.query('ALTER TABLE loads ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid()');
  await pool.query("UPDATE loads SET uuid = gen_random_uuid() WHERE uuid IS NULL");
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_loads_uuid ON loads(uuid)');

  for (const [key, value] of defaultSettings) {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value]
    );
  }
  console.log('✅ Default settings ensured');

  // Create/update admin user from environment variables
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Admin', $1, $2, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
      [adminEmail, hash]
    );
    console.log(`✅ Admin user ensured: ${adminEmail}`);
  } else {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set — admin user not created/updated.');
  }
}

export async function seedDatabase() {
  const seedPath = path.join(__dirname, 'seed.sql');
  if (!fs.existsSync(seedPath)) return;

  const sql = fs.readFileSync(seedPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Database seeded with demo data');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
