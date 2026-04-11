import pool from '../db/db.js';
import { findMatchingLoads } from '../services/matching.service.js';

export async function registerTruck(req, res) {
  try {
    const { truck_type, capacity_tons, permit_number, home_state, registration_number, insurance_expiry } = req.body;

    if (!truck_type || !capacity_tons) {
      return res.status(400).json({ error: 'Truck type and capacity are required.' });
    }

    const { rows: [existing] } = await pool.query('SELECT id FROM trucks WHERE user_id = $1', [req.user.id]);
    if (existing) {
      await pool.query(
        'UPDATE trucks SET truck_type=$1, capacity_tons=$2, permit_number=$3, home_state=$4, registration_number=$5, insurance_expiry=$6 WHERE user_id=$7',
        [truck_type, capacity_tons, permit_number || null, home_state || null, registration_number || null, insurance_expiry || null, req.user.id]
      );
      const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.user.id]);
      return res.json({ truck });
    }

    await pool.query(
      'INSERT INTO trucks (user_id, truck_type, capacity_tons, permit_number, home_state, registration_number, insurance_expiry) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.id, truck_type, capacity_tons, permit_number || null, home_state || null, registration_number || null, insurance_expiry || null]
    );
    const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.user.id]);
    res.status(201).json({ truck });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTruck(req, res) {
  try {
    const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.user.id]);
    res.json({ truck: truck || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function broadcastAvailability(req, res) {
  try {
    const { current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, available_until } = req.body;

    if (!current_lat || !current_lng || !dest_lat || !dest_lng || !current_city || !destination_city) {
      return res.status(400).json({ error: 'Current and destination locations are required.' });
    }

    await pool.query(
      "UPDATE driver_availability SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
      [req.user.id]
    );

    const { rows: [availability] } = await pool.query(
      'INSERT INTO driver_availability (user_id, current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, available_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.id, current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, available_until || null]
    );
    res.status(201).json({ availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAvailability(req, res) {
  try {
    const { rows: availability } = await pool.query(
      'SELECT * FROM driver_availability WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function cancelAvailability(req, res) {
  try {
    await pool.query(
      "UPDATE driver_availability SET status = 'cancelled' WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Availability cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMatches(req, res) {
  try {
    const { rows: [availability] } = await pool.query(
      "SELECT * FROM driver_availability WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );

    if (!availability) {
      return res.json({ matches: [], message: 'No active availability. Set your return route first.' });
    }

    const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.user.id]);
    const radiusKm = parseFloat(req.query.radius) || 50;

    const matches = await findMatchingLoads(availability, truck, radiusKm);
    res.json({ matches, availability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDriverBookings(req, res) {
  try {
    const { rows: bookings } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons, l.description,
             u.name as shipper_name, u.avg_rating as shipper_rating
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users u ON b.shipper_id = u.id
      WHERE b.driver_id = $1
      ORDER BY b.booked_at DESC
    `, [req.user.id]);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDriverProfile(req, res) {
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id, name, phone, role, avg_rating, total_ratings, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'Driver not found.' });

    const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.params.id]);
    const { rows: docs }    = await pool.query('SELECT id, doc_type, verified, uploaded_at FROM documents WHERE user_id = $1', [req.params.id]);
    const { rows: recentRatings } = await pool.query(`
      SELECT r.score, r.comment, r.rated_at, u.name as from_name
      FROM ratings r JOIN users u ON r.from_user_id = u.id
      WHERE r.to_user_id = $1 ORDER BY r.rated_at DESC LIMIT 10
    `, [req.params.id]);
    const { rows: [{ count }] } = await pool.query(
      "SELECT COUNT(*) as count FROM bookings WHERE driver_id = $1 AND status = 'delivered'",
      [req.params.id]
    );

    res.json({ user, truck, documents: docs, ratings: recentRatings, completedTrips: parseInt(count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDriverStats(req, res) {
  try {
    const { rows: [{ count: trips }] }    = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE driver_id = $1 AND status = 'delivered'", [req.user.id]);
    const { rows: [{ total: earnings }] } = await pool.query("SELECT COALESCE(SUM(agreed_price), 0) as total FROM bookings WHERE driver_id = $1 AND status = 'delivered'", [req.user.id]);
    const { rows: [{ count: active }] }   = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE driver_id = $1 AND status IN ('confirmed', 'picked_up', 'in_transit')", [req.user.id]);
    const { rows: [user] }                = await pool.query('SELECT avg_rating, total_ratings FROM users WHERE id = $1', [req.user.id]);

    res.json({
      stats: {
        totalTrips:    parseInt(trips),
        totalEarnings: parseFloat(earnings),
        activeBookings: parseInt(active),
        avgRating:     user.avg_rating,
        totalRatings:  user.total_ratings,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
