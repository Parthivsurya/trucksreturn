import db from '../db/db.js';

export function createLoad(req, res) {
  try {
    const { pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city,
            cargo_type, weight_tons, description, handling_instructions, offered_price, timeline } = req.body;

    if (!pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng || !pickup_city || !delivery_city || !cargo_type || !weight_tons || !offered_price) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const result = db.prepare(`INSERT INTO loads (user_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city, cargo_type, weight_tons, description, handling_instructions, offered_price, timeline) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(req.user.id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city, cargo_type, weight_tons, description||null, handling_instructions||null, offered_price, timeline||null);

    const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ load });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getLoads(req, res) {
  try {
    const { status, cargo_type, min_weight, max_weight, min_price, max_price, pickup_city, limit } = req.query;
    let query = "SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating FROM loads l JOIN users u ON l.user_id = u.id WHERE 1=1";
    const params = [];

    if (status) { query += " AND l.status = ?"; params.push(status); }
    else { query += " AND l.status = 'open'"; }
    if (cargo_type) { query += " AND l.cargo_type = ?"; params.push(cargo_type); }
    if (min_weight) { query += " AND l.weight_tons >= ?"; params.push(parseFloat(min_weight)); }
    if (max_weight) { query += " AND l.weight_tons <= ?"; params.push(parseFloat(max_weight)); }
    if (min_price) { query += " AND l.offered_price >= ?"; params.push(parseFloat(min_price)); }
    if (max_price) { query += " AND l.offered_price <= ?"; params.push(parseFloat(max_price)); }
    if (pickup_city) { query += " AND l.pickup_city LIKE ?"; params.push(`%${pickup_city}%`); }

    query += " ORDER BY l.created_at DESC LIMIT ?";
    params.push(parseInt(limit) || 50);

    const loads = db.prepare(query).all(...params);
    res.json({ loads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getLoadById(req, res) {
  try {
    const load = db.prepare(`
      SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating, u.phone as shipper_phone
      FROM loads l JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!load) return res.status(404).json({ error: 'Load not found.' });
    res.json({ load });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateLoad(req, res) {
  try {
    const load = db.prepare('SELECT * FROM loads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });
    if (load.status !== 'open') return res.status(400).json({ error: 'Can only edit open loads.' });

    const { cargo_type, weight_tons, description, handling_instructions, offered_price, timeline } = req.body;

    db.prepare(`UPDATE loads SET cargo_type=COALESCE(?,cargo_type), weight_tons=COALESCE(?,weight_tons), description=COALESCE(?,description), handling_instructions=COALESCE(?,handling_instructions), offered_price=COALESCE(?,offered_price), timeline=COALESCE(?,timeline) WHERE id=?`)
      .run(cargo_type||null, weight_tons||null, description||null, handling_instructions||null, offered_price||null, timeline||null, req.params.id);

    const updated = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id);
    res.json({ load: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function deleteLoad(req, res) {
  try {
    const load = db.prepare('SELECT * FROM loads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!load) return res.status(404).json({ error: 'Load not found or unauthorized.' });

    db.prepare("UPDATE loads SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Load cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getMyLoads(req, res) {
  try {
    const loads = db.prepare(`
      SELECT l.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.load_id = l.id) as booking_count
      FROM loads l WHERE l.user_id = ? ORDER BY l.created_at DESC
    `).all(req.user.id);
    res.json({ loads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getLoadMatches(req, res) {
  try {
    const load = db.prepare('SELECT * FROM loads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!load) return res.status(404).json({ error: 'Load not found.' });

    // Find active drivers whose route passes near this load's pickup
    const radiusKm = 50;
    const degreeApprox = radiusKm / 111; // rough km-to-degree conversion

    const drivers = db.prepare(`
      SELECT da.*, u.name as driver_name, u.avg_rating, u.total_ratings,
             t.truck_type, t.capacity_tons, t.registration_number
      FROM driver_availability da
      JOIN users u ON da.user_id = u.id
      LEFT JOIN trucks t ON t.user_id = da.user_id
      WHERE da.status = 'active'
        AND ABS(da.current_lat - ?) < ?
        AND ABS(da.current_lng - ?) < ?
        AND (t.capacity_tons IS NULL OR t.capacity_tons >= ?)
    `).all(load.pickup_lat, degreeApprox, load.pickup_lng, degreeApprox, load.weight_tons);

    res.json({ drivers, load });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getShipperStats(req, res) {
  try {
    const totalLoads = db.prepare("SELECT COUNT(*) as count FROM loads WHERE user_id = ?").get(req.user.id);
    const activeLoads = db.prepare("SELECT COUNT(*) as count FROM loads WHERE user_id = ? AND status = 'open'").get(req.user.id);
    const totalBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE shipper_id = ?").get(req.user.id);
    const totalSpent = db.prepare("SELECT COALESCE(SUM(agreed_price), 0) as total FROM bookings WHERE shipper_id = ? AND status = 'delivered'").get(req.user.id);

    res.json({
      stats: {
        totalLoads: totalLoads.count,
        activeLoads: activeLoads.count,
        totalBookings: totalBookings.count,
        totalSpent: totalSpent.total,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
