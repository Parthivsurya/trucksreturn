import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db.js';
import { sendLoadStatusUpdate } from '../services/email.service.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

function internalError(res, err, ctx) {
  console.error(`[admin] ${ctx}:`, err);
  return res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows: [user] } = await pool.query("SELECT * FROM users WHERE email = $1 AND role = 'admin'", [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    return internalError(res, err, 'adminLogin');
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboard(req, res) {
  try {
    const [
      { rows: [{ c: totalUsers }] },
      { rows: [{ c: totalDrivers }] },
      { rows: [{ c: totalShippers }] },
      { rows: [{ c: suspendedUsers }] },
      { rows: [{ c: totalLoads }] },
      { rows: [{ c: openLoads }] },
      { rows: [{ c: inTransitLoads }] },
      { rows: [{ c: deliveredLoads }] },
      { rows: [{ c: totalBookings }] },
      { rows: [{ c: activeBookings }] },
      { rows: [{ total: platformRevenue }] },
      { rows: recentUsers },
      { rows: recentBookings },
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as c FROM users WHERE role != 'admin'"),
      pool.query("SELECT COUNT(*) as c FROM users WHERE role = 'driver'"),
      pool.query("SELECT COUNT(*) as c FROM users WHERE role = 'shipper'"),
      pool.query("SELECT COUNT(*) as c FROM users WHERE is_active = 0 AND role != 'admin'"),
      pool.query("SELECT COUNT(*) as c FROM loads"),
      pool.query("SELECT COUNT(*) as c FROM loads WHERE status = 'open'"),
      pool.query("SELECT COUNT(*) as c FROM loads WHERE status IN ('booked','in_transit','picked_up')"),
      pool.query("SELECT COUNT(*) as c FROM loads WHERE status = 'delivered'"),
      pool.query("SELECT COUNT(*) as c FROM bookings"),
      pool.query("SELECT COUNT(*) as c FROM bookings WHERE status IN ('confirmed','picked_up','in_transit')"),
      pool.query("SELECT COALESCE(SUM(agreed_price),0) as total FROM bookings WHERE status = 'delivered'"),
      pool.query("SELECT id, name, email, role, avg_rating, is_active, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5"),
      pool.query(`
        SELECT b.id, b.agreed_price, b.status, b.booked_at,
               l.cargo_type, l.pickup_city, l.delivery_city,
               d.name as driver_name, s.name as shipper_name
        FROM bookings b
        JOIN loads l ON b.load_id = l.id
        JOIN users d ON b.driver_id = d.id
        JOIN users s ON b.shipper_id = s.id
        ORDER BY b.booked_at DESC LIMIT 5
      `),
    ]);

    res.json({
      users:    { total: parseInt(totalUsers), drivers: parseInt(totalDrivers), shippers: parseInt(totalShippers), suspended: parseInt(suspendedUsers) },
      loads:    { total: parseInt(totalLoads), open: parseInt(openLoads), inTransit: parseInt(inTransitLoads), delivered: parseInt(deliveredLoads) },
      bookings: { total: parseInt(totalBookings), active: parseInt(activeBookings) },
      platformRevenue: parseFloat(platformRevenue),
      recentUsers,
      recentBookings,
    });
  } catch (err) {
    return internalError(res, err, 'getDashboard');
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUsers(req, res) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = "WHERE u.role != 'admin'";
    const params = [];
    let i = 1;

    if (role)   { where += ` AND u.role = $${i++}`;                                              params.push(role); }
    if (search) { where += ` AND (u.name ILIKE $${i++} OR u.email ILIKE $${i++})`;               params.push(`%${search}%`, `%${search}%`); }

    const { rows: [{ total }] } = await pool.query(`SELECT COUNT(*) as total FROM users u ${where}`, params);

    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.avg_rating, u.total_ratings, u.is_active, u.created_at,
             t.truck_type, t.capacity_tons, t.registration_number
      FROM users u LEFT JOIN trucks t ON t.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC LIMIT $${i++} OFFSET $${i}
    `;
    const { rows: users } = await pool.query(query, [...params, parseInt(limit), offset]);

    res.json({ users, total: parseInt(total), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return internalError(res, err, 'getUsers');
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active is required.' });

    const { rows: [user] } = await pool.query("SELECT id, role FROM users WHERE id = $1", [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend admin accounts.' });

    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active ? 1 : 0, req.params.id]);
    res.json({ message: is_active ? 'User activated.' : 'User suspended.' });
  } catch (err) {
    return internalError(res, err, 'updateUserStatus');
  }
}

export async function batchDeleteUsers(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const id of ids) {
      const { rows: [user] } = await client.query('SELECT id, role FROM users WHERE id = $1', [id]);
      if (!user || user.role === 'admin') continue;

      const { rows: bookingRows } = await client.query('SELECT id FROM bookings WHERE driver_id = $1 OR shipper_id = $1', [id]);
      const { rows: loadRows }    = await client.query('SELECT id FROM loads WHERE user_id = $1', [id]);
      const loadIds = loadRows.map(l => l.id);

      let loadBookingIds = [];
      if (loadIds.length) {
        const ph = loadIds.map((_, k) => `$${k + 1}`).join(',');
        const { rows } = await client.query(`SELECT id FROM bookings WHERE load_id IN (${ph})`, loadIds);
        loadBookingIds = rows.map(b => b.id);
      }

      const allBookingIds = [...new Set([...bookingRows.map(b => b.id), ...loadBookingIds])];
      if (allBookingIds.length) {
        const ph = allBookingIds.map((_, k) => `$${k + 1}`).join(',');
        await client.query(`DELETE FROM ratings WHERE booking_id IN (${ph})`, allBookingIds);
        await client.query(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`, allBookingIds);
        await client.query(`DELETE FROM bookings WHERE id IN (${ph})`, allBookingIds);
      }
      if (loadIds.length) {
        const ph = loadIds.map((_, k) => `$${k + 1}`).join(',');
        await client.query(`DELETE FROM loads WHERE id IN (${ph})`, loadIds);
      }
      await client.query('DELETE FROM users WHERE id = $1', [id]);
    }
    await client.query('COMMIT');
    res.json({ message: `${ids.length} user(s) deleted.` });
  } catch (err) {
    await client.query('ROLLBACK');
    return internalError(res, err, 'batchDeleteUsers');
  } finally {
    client.release();
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required.' });
    }
    if (!['driver', 'shipper'].includes(role)) {
      return res.status(400).json({ error: 'Role must be driver or shipper.' });
    }
    const { rows: [existing] } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const password_hash = bcrypt.hashSync(password, 10);
    const { rows: [user] } = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, phone, role, is_active, created_at',
      [name, email, phone || null, password_hash, role]
    );
    res.status(201).json(user);
  } catch (err) {
    return internalError(res, err, 'createUser');
  }
}

export async function deleteUser(req, res) {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    const { rows: [user] } = await client.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin accounts.' });

    await client.query('BEGIN');

    const { rows: bookingRows } = await client.query('SELECT id FROM bookings WHERE driver_id = $1 OR shipper_id = $1', [id]);
    const { rows: loadRows }    = await client.query('SELECT id FROM loads WHERE user_id = $1', [id]);
    const loadIds = loadRows.map(l => l.id);

    let loadBookingIds = [];
    if (loadIds.length) {
      const ph = loadIds.map((_, k) => `$${k + 1}`).join(',');
      const { rows } = await client.query(`SELECT id FROM bookings WHERE load_id IN (${ph})`, loadIds);
      loadBookingIds = rows.map(b => b.id);
    }

    const allBookingIds = [...new Set([...bookingRows.map(b => b.id), ...loadBookingIds])];
    if (allBookingIds.length) {
      const ph = allBookingIds.map((_, k) => `$${k + 1}`).join(',');
      await client.query(`DELETE FROM ratings WHERE booking_id IN (${ph})`, allBookingIds);
      await client.query(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`, allBookingIds);
      await client.query(`DELETE FROM bookings WHERE id IN (${ph})`, allBookingIds);
    }
    if (loadIds.length) {
      const ph = loadIds.map((_, k) => `$${k + 1}`).join(',');
      await client.query(`DELETE FROM loads WHERE id IN (${ph})`, loadIds);
    }
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'User deleted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    return internalError(res, err, 'deleteUser');
  } finally {
    client.release();
  }
}

// ── Loads ─────────────────────────────────────────────────────────────────────

export async function getLoads(req, res) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;

    if (status) { where += ` AND l.status = $${i++}`;                                                                      params.push(status); }
    if (search) { where += ` AND (l.cargo_type ILIKE $${i++} OR l.pickup_city ILIKE $${i++} OR l.delivery_city ILIKE $${i++})`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const { rows: [{ total }] } = await pool.query(`SELECT COUNT(*) as total FROM loads l ${where}`, params);

    const { rows: loads } = await pool.query(`
      SELECT l.*, u.name as shipper_name,
             (SELECT COUNT(*) FROM bookings b WHERE b.load_id = l.id) as booking_count
      FROM loads l JOIN users u ON l.user_id = u.id
      ${where}
      ORDER BY l.created_at DESC LIMIT $${i++} OFFSET $${i}
    `, [...params, parseInt(limit), offset]);

    res.json({ loads, total: parseInt(total), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return internalError(res, err, 'getLoads');
  }
}

export async function updateLoadStatus(req, res) {
  try {
    const { status } = req.body;
    const valid = ['open', 'booked', 'in_transit', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const { rows: [load] } = await pool.query('SELECT id FROM loads WHERE id = $1', [req.params.id]);
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    await pool.query('UPDATE loads SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: `Load status updated to ${status}.` });

    // Fire-and-forget email
    const { rows: [fullLoad] } = await pool.query('SELECT * FROM loads WHERE id = $1', [req.params.id]);
    const { rows: [shipper] }  = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [fullLoad.user_id]);
    if (shipper) sendLoadStatusUpdate({ load: fullLoad, newStatus: status, shipper }).catch(() => {});
  } catch (err) {
    return internalError(res, err, 'updateLoadStatus');
  }
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function getBookings(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { where += ` AND b.status = $${i++}`; params.push(status); }

    const { rows: [{ total }] } = await pool.query(`SELECT COUNT(*) as total FROM bookings b ${where}`, params);

    const { rows: bookings } = await pool.query(`
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
      ORDER BY b.booked_at DESC LIMIT $${i++} OFFSET $${i}
    `, [...params, parseInt(limit), offset]);

    res.json({ bookings, total: parseInt(total), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return internalError(res, err, 'getBookings');
  }
}

// ── Load CRUD ─────────────────────────────────────────────────────────────────

export async function batchDeleteLoads(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const id of ids) {
      const { rows: bookingRows } = await client.query('SELECT id FROM bookings WHERE load_id = $1', [id]);
      const bookingIds = bookingRows.map(b => b.id);
      if (bookingIds.length) {
        const ph = bookingIds.map((_, k) => `$${k + 1}`).join(',');
        await client.query(`DELETE FROM ratings WHERE booking_id IN (${ph})`, bookingIds);
        await client.query(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`, bookingIds);
        await client.query(`DELETE FROM bookings WHERE id IN (${ph})`, bookingIds);
      }
      await client.query('DELETE FROM loads WHERE id = $1', [id]);
    }
    await client.query('COMMIT');
    res.json({ message: `${ids.length} load(s) deleted.` });
  } catch (err) {
    await client.query('ROLLBACK');
    return internalError(res, err, 'batchDeleteLoads');
  } finally {
    client.release();
  }
}

export async function createLoad(req, res) {
  try {
    const {
      shipper_id, pickup_city, delivery_city,
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      cargo_type, weight_tons, description, offered_price, timeline,
    } = req.body;

    if (!shipper_id || !pickup_city || !delivery_city || !cargo_type || !weight_tons || !offered_price) {
      return res.status(400).json({ error: 'shipper_id, cities, cargo_type, weight_tons and offered_price are required.' });
    }

    const { rows: [shipper] } = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'shipper'", [shipper_id]);
    if (!shipper) return res.status(400).json({ error: 'Invalid shipper.' });

    const { rows: [load] } = await pool.query(`
      INSERT INTO loads (user_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng,
        pickup_city, delivery_city, cargo_type, weight_tons, description, offered_price, timeline, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'open') RETURNING *
    `, [
      shipper_id,
      parseFloat(pickup_lat) || 0, parseFloat(pickup_lng) || 0,
      parseFloat(delivery_lat) || 0, parseFloat(delivery_lng) || 0,
      pickup_city, delivery_city, cargo_type,
      parseFloat(weight_tons), description || null,
      parseFloat(offered_price), timeline || null,
    ]);

    res.status(201).json(load);
  } catch (err) {
    return internalError(res, err, 'createLoad');
  }
}

export async function deleteLoad(req, res) {
  const client = await pool.connect();
  try {
    const { rows: [load] } = await client.query('SELECT id FROM loads WHERE id = $1', [req.params.id]);
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    await client.query('BEGIN');
    const { rows: bookingRows } = await client.query('SELECT id FROM bookings WHERE load_id = $1', [req.params.id]);
    const bookingIds = bookingRows.map(b => b.id);
    if (bookingIds.length) {
      const ph = bookingIds.map((_, k) => `$${k + 1}`).join(',');
      await client.query(`DELETE FROM ratings WHERE booking_id IN (${ph})`, bookingIds);
      await client.query(`DELETE FROM tracking_updates WHERE booking_id IN (${ph})`, bookingIds);
      await client.query(`DELETE FROM bookings WHERE id IN (${ph})`, bookingIds);
    }
    await client.query('DELETE FROM loads WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ message: 'Load deleted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    return internalError(res, err, 'deleteLoad');
  } finally {
    client.release();
  }
}

export async function getShippers(req, res) {
  try {
    const { rows: shippers } = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'shipper' AND is_active = 1 ORDER BY name"
    );
    res.json(shippers);
  } catch (err) {
    return internalError(res, err, 'getShippers');
  }
}

// ── Driver Verification ───────────────────────────────────────────────────────

export async function getDriversForVerification(req, res) {
  try {
    const { status = 'all', search = '' } = req.query;

    let verifiedFilter = '';
    if (status === 'pending')  verifiedFilter = 'AND t.is_verified = 0';
    if (status === 'verified') verifiedFilter = 'AND t.is_verified = 1';
    if (status === 'rejected') verifiedFilter = 'AND t.is_verified = 2';

    const params = [];
    let searchFilter = '';
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      searchFilter = `AND (u.name ILIKE $1 OR u.email ILIKE $1 OR t.registration_number ILIKE $1)`;
    }

    const { rows: drivers } = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.phone, u.created_at, u.is_active,
        t.id as truck_id, t.truck_type, t.capacity_tons, t.registration_number,
        t.permit_number, t.home_state, t.insurance_expiry,
        t.is_verified, t.verification_note,
        (SELECT COUNT(*) FROM documents d WHERE d.user_id = u.id) as doc_count,
        (SELECT COUNT(*) FROM verification_history vh WHERE vh.driver_id = u.id AND vh.action = 'rejected') as rejection_count
      FROM users u
      JOIN trucks t ON t.user_id = u.id
      WHERE u.role = 'driver'
      ${verifiedFilter}
      ${searchFilter}
      ORDER BY
        CASE t.is_verified WHEN 0 THEN 0 WHEN 2 THEN 1 ELSE 2 END,
        u.created_at DESC
    `, params);

    res.json({ drivers });
  } catch (err) {
    return internalError(res, err, 'getDriversForVerification');
  }
}

export async function verifyDriver(req, res) {
  try {
    const { is_verified, verification_note } = req.body;
    // 1 = verified, 2 = rejected
    if (![1, 2].includes(Number(is_verified))) {
      return res.status(400).json({ error: 'is_verified must be 1 (verify) or 2 (reject).' });
    }
    if (Number(is_verified) === 2 && !verification_note?.trim()) {
      return res.status(400).json({ error: 'A rejection reason is required.' });
    }

    const { rows: [truck] } = await pool.query(
      'SELECT t.id, t.user_id FROM trucks t JOIN users u ON u.id = t.user_id WHERE t.user_id = $1 AND u.role = $2',
      [req.params.driverId, 'driver']
    );
    if (!truck) return res.status(404).json({ error: 'Driver or truck not found.' });

    await pool.query(
      'UPDATE trucks SET is_verified = $1, verification_note = $2 WHERE user_id = $3',
      [Number(is_verified), verification_note?.trim() || null, req.params.driverId]
    );

    // Record rejection in history
    if (Number(is_verified) === 2) {
      await pool.query(
        "INSERT INTO verification_history (driver_id, action, note) VALUES ($1, 'rejected', $2)",
        [req.params.driverId, verification_note?.trim() || null]
      );
    }

    const label = Number(is_verified) === 1 ? 'verified' : 'rejected';
    res.json({ message: `Driver ${label} successfully.` });
  } catch (err) {
    return internalError(res, err, 'verifyDriver');
  }
}

export async function getVerificationHistory(req, res) {
  try {
    const { rows: history } = await pool.query(
      'SELECT * FROM verification_history WHERE driver_id = $1 ORDER BY created_at DESC',
      [req.params.driverId]
    );
    res.json({ history });
  } catch (err) {
    return internalError(res, err, 'getVerificationHistory');
  }
}
