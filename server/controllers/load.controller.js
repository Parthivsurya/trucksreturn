import pool from '../db/db.js';
import { sendDriverConnectRequest } from '../services/email.service.js';
import { serverError } from '../utils/errors.js';

export async function createLoad(req, res) {
  try {
    const {
      pickup_lat, pickup_lng, delivery_lat, delivery_lng,
      pickup_city, delivery_city, cargo_type, weight_tons,
      description, handling_instructions, offered_price, timeline,
      pickup_address, delivery_address,
    } = req.body;

    if (!pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng ||
        !pickup_city || !delivery_city || !cargo_type || !weight_tons || !offered_price || !pickup_address) {
      return res.status(400).json({ error: 'Missing required fields. Pickup address is required.' });
    }

    const weightNum = parseFloat(weight_tons);
    const priceNum  = parseFloat(offered_price);
    if (isNaN(weightNum) || weightNum <= 0) return res.status(400).json({ error: 'Invalid weight.' });
    if (isNaN(priceNum)  || priceNum  <= 0) return res.status(400).json({ error: 'Invalid price.' });

    const { rows: [load] } = await pool.query(
      `INSERT INTO loads
         (user_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng,
          pickup_city, delivery_city, cargo_type, weight_tons,
          description, handling_instructions, offered_price, timeline,
          pickup_address, delivery_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        req.user.id,
        parseFloat(pickup_lat), parseFloat(pickup_lng),
        parseFloat(delivery_lat), parseFloat(delivery_lng),
        pickup_city.trim(), delivery_city.trim(),
        cargo_type.trim(), weightNum,
        description?.trim() || null,
        handling_instructions?.trim() || null,
        priceNum,
        timeline?.trim() || null,
        pickup_address?.trim() || null,
        delivery_address?.trim() || null,
      ]
    );
    res.status(201).json({ load });
  } catch (err) {
    return serverError(res, err, 'load:create');
  }
}

export async function getLoads(req, res) {
  try {
    const { status, cargo_type, min_weight, max_weight, min_price, max_price, pickup_city } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let query = `
      SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating
      FROM loads l JOIN users u ON l.user_id = u.id
      WHERE 1=1`;
    const params = [];
    let i = 1;

    if (status)      { query += ` AND l.status = $${i++}`;          params.push(status); }
    else             { query += " AND l.status = 'open'"; }
    if (cargo_type)  { query += ` AND l.cargo_type = $${i++}`;      params.push(cargo_type); }
    if (min_weight)  { query += ` AND l.weight_tons >= $${i++}`;    params.push(parseFloat(min_weight)); }
    if (max_weight)  { query += ` AND l.weight_tons <= $${i++}`;    params.push(parseFloat(max_weight)); }
    if (min_price)   { query += ` AND l.offered_price >= $${i++}`;  params.push(parseFloat(min_price)); }
    if (max_price)   { query += ` AND l.offered_price <= $${i++}`;  params.push(parseFloat(max_price)); }
    if (pickup_city) { query += ` AND l.pickup_city ILIKE $${i++}`; params.push(`%${pickup_city}%`); }

    query += ` ORDER BY l.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(limit, offset);

    const { rows: loads } = await pool.query(query, params);
    res.json({ loads, page, limit });
  } catch (err) {
    return serverError(res, err, 'load:getAll');
  }
}

export async function getLoadById(req, res) {
  try {
    const { rows: [load] } = await pool.query(`
      SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating, u.phone as shipper_phone
      FROM loads l JOIN users u ON l.user_id = u.id
      WHERE l.uuid = $1
    `, [req.params.uuid]);

    if (!load) return res.status(404).json({ error: 'Load not found.' });
    res.json({ load });
  } catch (err) {
    return serverError(res, err, 'load:getById');
  }
}

export async function updateLoad(req, res) {
  try {
    const { rows: [load] } = await pool.query(
      'SELECT * FROM loads WHERE uuid = $1 AND user_id = $2',
      [req.params.uuid, req.user.id]
    );
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });
    if (load.status !== 'open') return res.status(400).json({ error: 'Can only edit open loads.' });

    const { cargo_type, weight_tons, description, handling_instructions, offered_price, timeline } = req.body;

    await pool.query(
      `UPDATE loads SET
        cargo_type            = COALESCE($1, cargo_type),
        weight_tons           = COALESCE($2, weight_tons),
        description           = COALESCE($3, description),
        handling_instructions = COALESCE($4, handling_instructions),
        offered_price         = COALESCE($5, offered_price),
        timeline              = COALESCE($6, timeline)
       WHERE id = $7`,
      [
        cargo_type?.trim()                    || null,
        weight_tons ? parseFloat(weight_tons) : null,
        description?.trim()                   || null,
        handling_instructions?.trim()         || null,
        offered_price ? parseFloat(offered_price) : null,
        timeline?.trim()                      || null,
        load.id,
      ]
    );

    const { rows: [updated] } = await pool.query('SELECT * FROM loads WHERE id = $1', [load.id]);
    res.json({ load: updated });
  } catch (err) {
    return serverError(res, err, 'load:update');
  }
}

export async function deleteLoad(req, res) {
  try {
    const { rows: [load] } = await pool.query(
      'SELECT * FROM loads WHERE uuid = $1 AND user_id = $2',
      [req.params.uuid, req.user.id]
    );
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });

    await pool.query("UPDATE loads SET status = 'cancelled' WHERE id = $1", [load.id]);
    res.json({ message: 'Load cancelled.' });
  } catch (err) {
    return serverError(res, err, 'load:delete');
  }
}

export async function getMyLoads(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows: loads } = await pool.query(`
      SELECT l.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.load_id = l.id) as booking_count,
        (SELECT b.uuid FROM bookings b WHERE b.load_id = l.id AND b.status NOT IN ('cancelled') ORDER BY b.booked_at DESC LIMIT 1) as booking_uuid
      FROM loads l
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    res.json({ loads, page, limit });
  } catch (err) {
    return serverError(res, err, 'load:getMine');
  }
}

export async function getLoadMatches(req, res) {
  try {
    const { rows: [load] } = await pool.query(
      'SELECT * FROM loads WHERE uuid = $1 AND user_id = $2',
      [req.params.uuid, req.user.id]
    );
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    const radiusKm     = 50;
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
    return serverError(res, err, 'load:getMatches');
  }
}

export async function connectDriver(req, res) {
  try {
    const { driver_id } = req.body;
    if (!driver_id) return res.status(400).json({ error: 'driver_id is required.' });

    const { rows: [load] } = await pool.query(
      'SELECT * FROM loads WHERE uuid = $1 AND user_id = $2',
      [req.params.uuid, req.user.id]
    );
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });
    if (load.status !== 'open') return res.status(400).json({ error: 'Load is no longer open.' });

    const { rows: [driver] } = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
      [driver_id, 'driver']
    );
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    const { rows: [shipper] } = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE id = $1',
      [req.user.id]
    );

    // Save in-app notification for the driver
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, load_id)
       VALUES ($1, 'connect_request', $2, $3, $4)`,
      [
        driver.id,
        `Load request from ${shipper.name}`,
        `${shipper.name} wants you to take a load: ${load.cargo_type} from ${load.pickup_city} to ${load.delivery_city} — ₹${Number(load.offered_price).toLocaleString('en-IN')}`,
        load.id,
      ]
    );

    sendDriverConnectRequest({ driver, shipper, load }).catch(() => {});
    res.json({ message: `Request sent to ${driver.name}.` });
  } catch (err) {
    return serverError(res, err, 'load:connectDriver');
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
    return serverError(res, err, 'load:shipperStats');
  }
}
