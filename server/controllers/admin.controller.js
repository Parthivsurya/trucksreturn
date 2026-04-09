import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/db.js';
import { sendLoadStatusUpdate, testEmail as sendTestEmail } from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartreturnload_dev_secret';

// ── Auth ──────────────────────────────────────────────────────────────────────

export function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'").get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function getDashboard(req, res) {
  try {
    const totalUsers    = db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'admin'").get().c;
    const totalDrivers  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'driver'").get().c;
    const totalShippers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'shipper'").get().c;
    const suspendedUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_active = 0 AND role != 'admin'").get().c;

    const totalLoads     = db.prepare("SELECT COUNT(*) as c FROM loads").get().c;
    const openLoads      = db.prepare("SELECT COUNT(*) as c FROM loads WHERE status = 'open'").get().c;
    const inTransitLoads = db.prepare("SELECT COUNT(*) as c FROM loads WHERE status IN ('booked','in_transit','picked_up')").get().c;
    const deliveredLoads = db.prepare("SELECT COUNT(*) as c FROM loads WHERE status = 'delivered'").get().c;

    const totalBookings  = db.prepare("SELECT COUNT(*) as c FROM bookings").get().c;
    const activeBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status IN ('confirmed','picked_up','in_transit')").get().c;
    const platformRevenue = db.prepare("SELECT COALESCE(SUM(agreed_price),0) as total FROM bookings WHERE status = 'delivered'").get().total;

    const recentUsers = db.prepare(
      "SELECT id, name, email, role, avg_rating, is_active, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5"
    ).all();

    const recentBookings = db.prepare(`
      SELECT b.id, b.agreed_price, b.status, b.booked_at,
             l.cargo_type, l.pickup_city, l.delivery_city,
             d.name as driver_name, s.name as shipper_name
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users d ON b.driver_id = d.id
      JOIN users s ON b.shipper_id = s.id
      ORDER BY b.booked_at DESC LIMIT 5
    `).all();

    res.json({
      users:    { total: totalUsers, drivers: totalDrivers, shippers: totalShippers, suspended: suspendedUsers },
      loads:    { total: totalLoads, open: openLoads, inTransit: inTransitLoads, delivered: deliveredLoads },
      bookings: { total: totalBookings, active: activeBookings },
      platformRevenue,
      recentUsers,
      recentBookings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function getUsers(req, res) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.avg_rating, u.total_ratings, u.is_active, u.created_at,
             t.truck_type, t.capacity_tons, t.registration_number
      FROM users u LEFT JOIN trucks t ON t.user_id = u.id
      WHERE u.role != 'admin'
    `;
    const params = [];

    if (role)   { query += " AND u.role = ?";            params.push(role); }
    if (search) { query += " AND (u.name LIKE ? OR u.email LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

    // Total count
    const countQuery = query.replace(
      /SELECT[\s\S]+?FROM/,
      'SELECT COUNT(*) as total FROM'
    ).replace(/LEFT JOIN[\s\S]+?WHERE/, 'WHERE');
    // Simple count without join
    let countQ = "SELECT COUNT(*) as total FROM users u WHERE u.role != 'admin'";
    const countParams = [];
    if (role)   { countQ += " AND u.role = ?";            countParams.push(role); }
    if (search) { countQ += " AND (u.name LIKE ? OR u.email LIKE ?)"; countParams.push(`%${search}%`, `%${search}%`); }

    const { total } = db.prepare(countQ).get(...countParams);

    query += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const users = db.prepare(query).all(...params);
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateUserStatus(req, res) {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active is required.' });

    const user = db.prepare("SELECT id, role FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend admin accounts.' });

    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
    res.json({ message: is_active ? 'User activated.' : 'User suspended.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function batchDeleteUsers(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required.' });
    }

    db.transaction(() => {
      for (const id of ids) {
        const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
        if (!user || user.role === 'admin') continue;

        const bookingIds = db.prepare(
          'SELECT id FROM bookings WHERE driver_id = ? OR shipper_id = ?'
        ).all(id, id).map(b => b.id);

        const loadIds = db.prepare('SELECT id FROM loads WHERE user_id = ?').all(id).map(l => l.id);
        const loadBookingIds = loadIds.length
          ? db.prepare(`SELECT id FROM bookings WHERE load_id IN (${loadIds.map(() => '?').join(',')})`).all(...loadIds).map(b => b.id)
          : [];

        const allBookingIds = [...new Set([...bookingIds, ...loadBookingIds])];
        if (allBookingIds.length) {
          const ph = allBookingIds.map(() => '?').join(',');
          db.prepare(`DELETE FROM ratings WHERE booking_id IN (${ph})`).run(...allBookingIds);
          db.prepare(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`).run(...allBookingIds);
          db.prepare(`DELETE FROM bookings WHERE id IN (${ph})`).run(...allBookingIds);
        }
        if (loadIds.length) {
          db.prepare(`DELETE FROM loads WHERE id IN (${loadIds.map(() => '?').join(',')})`).run(...loadIds);
        }
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
      }
    })();

    res.json({ message: `${ids.length} user(s) deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function createUser(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required.' });
    }
    if (!['driver', 'shipper'].includes(role)) {
      return res.status(400).json({ error: 'Role must be driver or shipper.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, password_hash, role);

    const user = db.prepare('SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function deleteUser(req, res) {
  try {
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin accounts.' });

    const id = req.params.id;
    db.transaction(() => {
      // bookings where this user is driver or shipper
      const bookingIds = db.prepare(
        'SELECT id FROM bookings WHERE driver_id = ? OR shipper_id = ?'
      ).all(id, id).map(b => b.id);

      // bookings tied to loads posted by this shipper
      const loadIds = db.prepare('SELECT id FROM loads WHERE user_id = ?').all(id).map(l => l.id);
      const loadBookingIds = loadIds.length
        ? db.prepare(`SELECT id FROM bookings WHERE load_id IN (${loadIds.map(() => '?').join(',')})`).all(...loadIds).map(b => b.id)
        : [];

      const allBookingIds = [...new Set([...bookingIds, ...loadBookingIds])];

      if (allBookingIds.length) {
        const ph = allBookingIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM ratings WHERE booking_id IN (${ph})`).run(...allBookingIds);
        db.prepare(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`).run(...allBookingIds);
        db.prepare(`DELETE FROM bookings WHERE id IN (${ph})`).run(...allBookingIds);
      }

      // delete loads posted by this user (as shipper)
      if (loadIds.length) {
        db.prepare(`DELETE FROM loads WHERE id IN (${loadIds.map(() => '?').join(',')})`).run(...loadIds);
      }

      // ON DELETE CASCADE handles trucks, documents, driver_availability
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();

    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Loads ─────────────────────────────────────────────────────────────────────

export function getLoads(req, res) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND l.status = ?';             params.push(status); }
    if (search) { where += ' AND (l.cargo_type LIKE ? OR l.pickup_city LIKE ? OR l.delivery_city LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const countQ = `SELECT COUNT(*) as total FROM loads l ${where}`;
    const { total } = db.prepare(countQ).get(...params);

    const query = `
      SELECT l.*, u.name as shipper_name,
             (SELECT COUNT(*) FROM bookings b WHERE b.load_id = l.id) as booking_count
      FROM loads l JOIN users u ON l.user_id = u.id
      ${where}
      ORDER BY l.created_at DESC LIMIT ? OFFSET ?
    `;

    const loads = db.prepare(query).all(...params, parseInt(limit), offset);
    res.json({ loads, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateLoadStatus(req, res) {
  try {
    const { status } = req.body;
    const valid = ['open', 'booked', 'in_transit', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const load = db.prepare('SELECT id FROM loads WHERE id = ?').get(req.params.id);
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    db.prepare('UPDATE loads SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: `Load status updated to ${status}.` });

    const fullLoad  = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id);
    const shipper   = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(fullLoad.user_id);
    if (shipper) sendLoadStatusUpdate({ load: fullLoad, newStatus: status, shipper }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export function getBookings(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const { total } = db.prepare(`SELECT COUNT(*) as total FROM bookings b ${where}`).get(...params);

    const query = `
      SELECT b.id, b.agreed_price, b.status, b.booked_at, b.picked_up_at, b.delivered_at,
             l.cargo_type, l.pickup_city, l.delivery_city, l.weight_tons,
             d.name as driver_name, d.avg_rating as driver_rating,
             s.name as shipper_name, s.avg_rating as shipper_rating,
             t.truck_type, t.registration_number
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users d ON b.driver_id = d.id
      JOIN users s ON b.shipper_id = s.id
      LEFT JOIN trucks t ON t.user_id = b.driver_id
      ${where}
      ORDER BY b.booked_at DESC LIMIT ? OFFSET ?
    `;

    const bookings = db.prepare(query).all(...params, parseInt(limit), offset);
    res.json({ bookings, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Load CRUD ─────────────────────────────────────────────────────────────────

export function batchDeleteLoads(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required.' });
    }

    db.transaction(() => {
      for (const id of ids) {
        const bookingIds = db.prepare('SELECT id FROM bookings WHERE load_id = ?').all(id).map(b => b.id);
        if (bookingIds.length) {
          const ph = bookingIds.map(() => '?').join(',');
          db.prepare(`DELETE FROM ratings WHERE booking_id IN (${ph})`).run(...bookingIds);
          db.prepare(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`).run(...bookingIds);
          db.prepare(`DELETE FROM bookings WHERE id IN (${ph})`).run(...bookingIds);
        }
        db.prepare('DELETE FROM loads WHERE id = ?').run(id);
      }
    })();

    res.json({ message: `${ids.length} load(s) deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function createLoad(req, res) {
  try {
    const {
      shipper_id, pickup_city, delivery_city,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      cargo_type, weight_tons, description, offered_price, timeline,
    } = req.body;

    if (!shipper_id || !pickup_city || !delivery_city || !cargo_type || !weight_tons || !offered_price) {
      return res.status(400).json({ error: 'shipper_id, cities, cargo_type, weight_tons and offered_price are required.' });
    }

    const shipper = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'shipper'").get(shipper_id);
    if (!shipper) return res.status(400).json({ error: 'Invalid shipper.' });

    const result = db.prepare(`
      INSERT INTO loads (user_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng,
        pickup_city, delivery_city, cargo_type, weight_tons, description, offered_price, timeline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(
      shipper_id,
      parseFloat(pickup_lat) || 0, parseFloat(pickup_lng) || 0,
      parseFloat(delivery_lat) || 0, parseFloat(delivery_lng) || 0,
      pickup_city, delivery_city, cargo_type,
      parseFloat(weight_tons), description || null,
      parseFloat(offered_price), timeline || null,
    );

    const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(load);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function deleteLoad(req, res) {
  try {
    const load = db.prepare('SELECT id FROM loads WHERE id = ?').get(req.params.id);
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    db.transaction(() => {
      const bookingIds = db.prepare('SELECT id FROM bookings WHERE load_id = ?').all(req.params.id).map(b => b.id);
      if (bookingIds.length) {
        const ph = bookingIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM ratings WHERE booking_id IN (${ph})`).run(...bookingIds);
        db.prepare(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`).run(...bookingIds);
        db.prepare(`DELETE FROM bookings WHERE id IN (${ph})`).run(...bookingIds);
      }
      db.prepare('DELETE FROM loads WHERE id = ?').run(req.params.id);
    })();

    res.json({ message: 'Load deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getShippers(req, res) {
  try {
    const shippers = db.prepare("SELECT id, name, email FROM users WHERE role = 'shipper' AND is_active = 1 ORDER BY name").all();
    res.json(shippers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
