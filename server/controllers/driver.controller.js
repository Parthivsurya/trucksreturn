import db from '../db/db.js';
import { findMatchingLoads } from '../services/matching.service.js';

export function registerTruck(req, res) {
  try {
    const { truck_type, capacity_tons, permit_number, home_state, registration_number, insurance_expiry } = req.body;

    if (!truck_type || !capacity_tons) {
      return res.status(400).json({ error: 'Truck type and capacity are required.' });
    }

    const existing = db.prepare('SELECT id FROM trucks WHERE user_id = ?').get(req.user.id);
    if (existing) {
      // Update existing
      db.prepare(`UPDATE trucks SET truck_type=?, capacity_tons=?, permit_number=?, home_state=?, registration_number=?, insurance_expiry=? WHERE user_id=?`)
        .run(truck_type, capacity_tons, permit_number||null, home_state||null, registration_number||null, insurance_expiry||null, req.user.id);
      const truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(req.user.id);
      return res.json({ truck });
    }

    db.prepare('INSERT INTO trucks (user_id, truck_type, capacity_tons, permit_number, home_state, registration_number, insurance_expiry) VALUES (?,?,?,?,?,?,?)')
      .run(req.user.id, truck_type, capacity_tons, permit_number||null, home_state||null, registration_number||null, insurance_expiry||null);

    const truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(req.user.id);
    res.status(201).json({ truck });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getTruck(req, res) {
  try {
    const truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(req.user.id);
    res.json({ truck: truck || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function broadcastAvailability(req, res) {
  try {
    const { current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, available_until } = req.body;

    if (!current_lat || !current_lng || !dest_lat || !dest_lng || !current_city || !destination_city) {
      return res.status(400).json({ error: 'Current and destination locations are required.' });
    }

    // Cancel any existing active availability
    db.prepare("UPDATE driver_availability SET status = 'cancelled' WHERE user_id = ? AND status = 'active'").run(req.user.id);

    const result = db.prepare(
      'INSERT INTO driver_availability (user_id, current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, available_until) VALUES (?,?,?,?,?,?,?,?)'
    ).run(req.user.id, current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, available_until||null);

    const availability = db.prepare('SELECT * FROM driver_availability WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getAvailability(req, res) {
  try {
    const availability = db.prepare("SELECT * FROM driver_availability WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function cancelAvailability(req, res) {
  try {
    db.prepare("UPDATE driver_availability SET status = 'cancelled' WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: 'Availability cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getMatches(req, res) {
  try {
    // Get active availability for this driver
    const availability = db.prepare("SELECT * FROM driver_availability WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").get(req.user.id);

    if (!availability) {
      return res.json({ matches: [], message: 'No active availability. Set your return route first.' });
    }

    const truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(req.user.id);
    const radiusKm = parseFloat(req.query.radius) || 50;

    const matches = findMatchingLoads(availability, truck, radiusKm);
    res.json({ matches, availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getDriverBookings(req, res) {
  try {
    const bookings = db.prepare(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons, l.description,
             u.name as shipper_name, u.avg_rating as shipper_rating
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users u ON b.shipper_id = u.id
      WHERE b.driver_id = ?
      ORDER BY b.booked_at DESC
    `).all(req.user.id);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getDriverProfile(req, res) {
  try {
    const user = db.prepare('SELECT id, name, phone, role, avg_rating, total_ratings, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Driver not found.' });

    const truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(req.params.id);
    const docs = db.prepare('SELECT id, doc_type, verified, uploaded_at FROM documents WHERE user_id = ?').all(req.params.id);
    const recentRatings = db.prepare(`
      SELECT r.score, r.comment, r.rated_at, u.name as from_name
      FROM ratings r JOIN users u ON r.from_user_id = u.id
      WHERE r.to_user_id = ? ORDER BY r.rated_at DESC LIMIT 10
    `).all(req.params.id);

    const completedTrips = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE driver_id = ? AND status = 'delivered'").get(req.params.id);

    res.json({ user, truck, documents: docs, ratings: recentRatings, completedTrips: completedTrips.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getDriverStats(req, res) {
  try {
    const totalTrips = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE driver_id = ? AND status = 'delivered'").get(req.user.id);
    const totalEarnings = db.prepare("SELECT COALESCE(SUM(agreed_price), 0) as total FROM bookings WHERE driver_id = ? AND status = 'delivered'").get(req.user.id);
    const activeBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE driver_id = ? AND status IN ('confirmed', 'picked_up', 'in_transit')").get(req.user.id);
    const user = db.prepare('SELECT avg_rating, total_ratings FROM users WHERE id = ?').get(req.user.id);

    res.json({
      stats: {
        totalTrips: totalTrips.count,
        totalEarnings: totalEarnings.total,
        activeBookings: activeBookings.count,
        avgRating: user.avg_rating,
        totalRatings: user.total_ratings,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
