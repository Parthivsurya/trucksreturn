-- Smart Return Load Platform — Database Schema
-- Using SQLite with lat/lng columns for spatial queries

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('driver', 'shipper', 'admin')),
  avatar_url TEXT,
  avg_rating REAL DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trucks (
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

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('RC', 'permit', 'insurance', 'PUC', 'licence')),
  file_url TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_availability (
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

CREATE TABLE IF NOT EXISTS loads (
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

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  load_id INTEGER NOT NULL REFERENCES loads(id),
  driver_id INTEGER NOT NULL REFERENCES users(id),
  shipper_id INTEGER NOT NULL REFERENCES users(id),
  agreed_price REAL NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'picked_up', 'in_transit', 'delivered', 'disputed', 'cancelled')),
  booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  picked_up_at DATETIME,
  delivered_at DATETIME
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  rated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracking_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loads_status       ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_pickup        ON loads(pickup_lat, pickup_lng);
CREATE INDEX IF NOT EXISTS idx_availability_status ON driver_availability(status);
CREATE INDEX IF NOT EXISTS idx_availability_location ON driver_availability(current_lat, current_lng);
CREATE INDEX IF NOT EXISTS idx_bookings_driver     ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_shipper    ON bookings(shipper_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users(role);
