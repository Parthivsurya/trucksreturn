import pool from '../db/db.js';
import { sendDriverConnectRequest } from '../services/email.service.js';

export async function createLoad(req, res) {
  try {
    const { pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city,
            cargo_type, weight_tons, description, handling_instructions, offered_price, timeline } = req.body;

    if (!pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng || !pickup_city || !delivery_city || !cargo_type || !weight_tons || !offered_price) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const { rows: [load] } = await pool.query(
      `INSERT INTO loads (user_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city, cargo_type, weight_tons, description, handling_instructions, offered_price, timeline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city,
       cargo_type, weight_tons, description || null, handling_instructions || null, offered_price, timeline || null]
    );
    res.status(201).json({ load });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getLoads(req, res) {
  try {
    const { status, cargo_type, min_weight, max_weight, min_price, max_price, pickup_city, limit } = req.query;
    let query = "SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating FROM loads l JOIN users u ON l.user_id = u.id WHERE 1=1";
    const params = [];
    let i = 1;

    if (status)      { query += ` AND l.status = $${i++}`;            params.push(status); }
    else             { query += " AND l.status = 'open'"; }
    if (cargo_type)  { query += ` AND l.cargo_type = $${i++}`;        params.push(cargo_type); }
    if (min_weight)  { query += ` AND l.weight_tons >= $${i++}`;      params.push(parseFloat(min_weight)); }
    if (max_weight)  { query += ` AND l.weight_tons <= $${i++}`;      params.push(parseFloat(max_weight)); }
    if (min_price)   { query += ` AND l.offered_price >= $${i++}`;    params.push(parseFloat(min_price)); }
    if (max_price)   { query += ` AND l.offered_price <= $${i++}`;    params.push(parseFloat(max_price)); }
    if (pickup_city) { query += ` AND l.pickup_city ILIKE $${i++}`;   params.push(`%${pickup_city}%`); }

    query += ` ORDER BY l.created_at DESC LIMIT $${i}`;
    params.push(parseInt(limit) || 50);

    const { rows: loads } = await pool.query(query, params);
    res.json({ loads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getLoadById(req, res) {
  try {
    const { rows: [load] } = await pool.query(`
      SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating, u.phone as shipper_phone
      FROM loads l JOIN users u ON l.user_id = u.id
      WHERE l.id = $1
    `, [req.params.id]);

    if (!load) return res.status(404).json({ error: 'Load not found.' });
    res.json({ load });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateLoad(req, res) {
  try {
    const { rows: [load] } = await pool.query('SELECT * FROM loads WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });
    if (load.status !== 'open') return res.status(400).json({ error: 'Can only edit open loads.' });

    const { cargo_type, weight_tons, description, handling_instructions, offered_price, timeline } = req.body;

    await pool.query(
      `UPDATE loads SET
        cargo_type=COALESCE($1,cargo_type),
        weight_tons=COALESCE($2,weight_tons),
        description=COALESCE($3,description),
        handling_instructions=COALESCE($4,handling_instructions),
        offered_price=COALESCE($5,offered_price),
        timeline=COALESCE($6,timeline)
       WHERE id=$7`,
      [cargo_type || null, weight_tons || null, description || null, handling_instructions || null, offered_price || null, timeline || null, req.params.id]
    );

    const { rows: [updated] } = await pool.query('SELECT * FROM loads WHERE id = $1', [req.params.id]);
    res.json({ load: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteLoad(req, res) {
  try {
    const { rows: [load] } = await pool.query('SELECT * FROM loads WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });

    await pool.query("UPDATE loads SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Load cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMyLoads(req, res) {
  try {
    const { rows: loads } = await pool.query(`
      SELECT l.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.load_id = l.id) as booking_count
      FROM loads l WHERE l.user_id = $1 ORDER BY l.created_at DESC
    `, [req.user.id]);
    res.json({ loads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getLoadMatches(req, res) {
  try {
    const { rows: [load] } = await pool.query('SELECT * FROM loads WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    const radiusKm    = 50;
    const degreeApprox = radiusKm / 111;

    const { rows: drivers } = await pool.query(`
      SELECT da.*, u.name as driver_name, u.avg_rating, u.total_ratings,
             t.truck_type, t.capacity_tons, t.registration_number
      FROM driver_availability da
      JOIN users u ON da.user_id = u.id
      LEFT JOIN trucks t ON t.user_id = da.user_id
      WHERE da.status = 'active'
        AND ABS(da.current_lat - $1) < $2
        AND ABS(da.current_lng - $3) < $4
        AND (t.capacity_tons IS NULL OR t.capacity_tons >= $5)
    `, [load.pickup_lat, degreeApprox, load.pickup_lng, degreeApprox, load.weight_tons]);

    res.json({ drivers, load });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function connectDriver(req, res) {
  try {
    const { driver_id } = req.body;
    if (!driver_id) return res.status(400).json({ error: 'driver_id is required.' });

    const { rows: [load] } = await pool.query(
      'SELECT * FROM loads WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });
    if (load.status !== 'open') return res.status(400).json({ error: 'Load is no longer open.' });

    const { rows: [driver] }  = await pool.query('SELECT id, name, email FROM users WHERE id = $1 AND role = $2', [driver_id, 'driver']);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    const { rows: [shipper] } = await pool.query('SELECT id, name, email, phone FROM users WHERE id = $1', [req.user.id]);

    await sendDriverConnectRequest({ driver, shipper, load });

    res.json({ message: `Request sent to ${driver.name}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getShipperStats(req, res) {
  try {
    const { rows: [{ count: totalLoads }] }    = await pool.query("SELECT COUNT(*) as count FROM loads WHERE user_id = $1", [req.user.id]);
    const { rows: [{ count: activeLoads }] }   = await pool.query("SELECT COUNT(*) as count FROM loads WHERE user_id = $1 AND status = 'open'", [req.user.id]);
    const { rows: [{ count: totalBookings }] } = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE shipper_id = $1", [req.user.id]);
    const { rows: [{ total: totalSpent }] }    = await pool.query("SELECT COALESCE(SUM(agreed_price), 0) as total FROM bookings WHERE shipper_id = $1 AND status = 'delivered'", [req.user.id]);

    res.json({
      stats: {
        totalLoads:    parseInt(totalLoads),
        activeLoads:   parseInt(activeLoads),
        totalBookings: parseInt(totalBookings),
        totalSpent:    parseFloat(totalSpent),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
