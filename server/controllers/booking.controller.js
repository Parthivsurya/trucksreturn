import pool from '../db/db.js';
import {
  sendBookingCreatedToShipper,
  sendBookingCreatedToDriver,
  sendBookingStatusUpdate,
} from '../services/email.service.js';

export async function createBooking(req, res) {
  try {
    const { load_id, agreed_price } = req.body;

    if (!load_id || !agreed_price) {
      return res.status(400).json({ error: 'Load ID and agreed price are required.' });
    }

    const { rows: [load] } = await pool.query("SELECT * FROM loads WHERE id = $1 AND status = 'open'", [load_id]);
    if (!load) return res.status(404).json({ error: 'Load not found or no longer available.' });

    const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.user.id]);
    if (!truck) return res.status(400).json({ error: 'Register your truck before accepting loads.' });

    if (truck.capacity_tons < load.weight_tons) {
      return res.status(400).json({ error: 'Your truck capacity is insufficient for this load.' });
    }

    const { rows: [newBooking] } = await pool.query(
      'INSERT INTO bookings (load_id, driver_id, shipper_id, agreed_price) VALUES ($1,$2,$3,$4) RETURNING *',
      [load_id, req.user.id, load.user_id, agreed_price]
    );

    await pool.query("UPDATE loads SET status = 'booked' WHERE id = $1", [load_id]);
    await pool.query("UPDATE driver_availability SET status = 'matched' WHERE user_id = $1 AND status = 'active'", [req.user.id]);

    const { rows: [booking] } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons
      FROM bookings b JOIN loads l ON b.load_id = l.id WHERE b.id = $1
    `, [newBooking.id]);

    res.status(201).json({ booking });

    // Fire-and-forget emails
    const { rows: [driver] }   = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    const { rows: [fullLoad] } = await pool.query('SELECT * FROM loads WHERE id = $1', [load_id]);
    Promise.all([
      sendBookingCreatedToShipper({ booking: newBooking, load: fullLoad, driver, truck }),
      sendBookingCreatedToDriver({ booking: newBooking, load: fullLoad, driver }),
    ]).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const { rows: [booking] } = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const picked_up_at = status === 'picked_up' ? new Date().toISOString() : null;
    const delivered_at = status === 'delivered' ? new Date().toISOString() : null;

    await pool.query(
      `UPDATE bookings SET status=$1, picked_up_at=COALESCE($2,picked_up_at), delivered_at=COALESCE($3,delivered_at) WHERE id=$4`,
      [status, picked_up_at, delivered_at, req.params.id]
    );

    const loadStatus = status === 'delivered' ? 'delivered' : status === 'cancelled' ? 'open' : 'in_transit';
    await pool.query('UPDATE loads SET status = $1 WHERE id = $2', [loadStatus, booking.load_id]);

    const { rows: [updated] } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons, l.pickup_lat, l.pickup_lng, l.delivery_lat, l.delivery_lng
      FROM bookings b JOIN loads l ON b.load_id = l.id WHERE b.id = $1
    `, [req.params.id]);

    res.json({ booking: updated });

    // Fire-and-forget emails
    const { rows: [fullLoad] } = await pool.query('SELECT * FROM loads WHERE id = $1', [booking.load_id]);
    const { rows: [driver] }   = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [booking.driver_id]);
    const { rows: [shipper] }  = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [booking.shipper_id]);
    Promise.all([
      sendBookingStatusUpdate({ booking, load: fullLoad, newStatus: status, toUser: driver,  role: 'driver'  }),
      sendBookingStatusUpdate({ booking, load: fullLoad, newStatus: status, toUser: shipper, role: 'shipper' }),
    ]).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBookingById(req, res) {
  try {
    const { rows: [booking] } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons, l.description,
             l.pickup_lat, l.pickup_lng, l.delivery_lat, l.delivery_lng,
             d.name as driver_name, d.avg_rating as driver_rating, d.phone as driver_phone,
             s.name as shipper_name, s.avg_rating as shipper_rating, s.phone as shipper_phone,
             t.truck_type, t.capacity_tons, t.registration_number
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users d ON b.driver_id = d.id
      JOIN users s ON b.shipper_id = s.id
      LEFT JOIN trucks t ON t.user_id = b.driver_id
      WHERE b.id = $1
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const { rows: tracking } = await pool.query(
      'SELECT * FROM tracking_updates WHERE booking_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ booking, tracking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addTrackingUpdate(req, res) {
  try {
    const { lat, lng, status_message } = req.body;
    const { rows: [booking] } = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND driver_id = $2',
      [req.params.id, req.user.id]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    await pool.query(
      'INSERT INTO tracking_updates (booking_id, lat, lng, status_message) VALUES ($1,$2,$3,$4)',
      [req.params.id, lat, lng, status_message || null]
    );
    res.status(201).json({ message: 'Tracking update recorded.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function rateBooking(req, res) {
  try {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5.' });
    }

    const { rows: [booking] } = await pool.query(
      "SELECT * FROM bookings WHERE id = $1 AND status = 'delivered'",
      [req.params.id]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found or not delivered.' });

    const to_user_id = req.user.id === booking.driver_id ? booking.shipper_id : booking.driver_id;

    const { rows: [existing] } = await pool.query(
      'SELECT id FROM ratings WHERE booking_id = $1 AND from_user_id = $2',
      [req.params.id, req.user.id]
    );
    if (existing) return res.status(409).json({ error: 'Already rated this booking.' });

    await pool.query(
      'INSERT INTO ratings (booking_id, from_user_id, to_user_id, score, comment) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, req.user.id, to_user_id, score, comment || null]
    );

    const { rows: [{ avg, cnt }] } = await pool.query(
      'SELECT AVG(score) as avg, COUNT(*) as cnt FROM ratings WHERE to_user_id = $1',
      [to_user_id]
    );
    await pool.query(
      'UPDATE users SET avg_rating = $1, total_ratings = $2 WHERE id = $3',
      [Math.round(parseFloat(avg) * 10) / 10, parseInt(cnt), to_user_id]
    );

    res.status(201).json({ message: 'Rating submitted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getShipperBookings(req, res) {
  try {
    const { rows: bookings } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons,
             u.name as driver_name, u.avg_rating as driver_rating,
             t.truck_type, t.registration_number
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users u ON b.driver_id = u.id
      LEFT JOIN trucks t ON t.user_id = b.driver_id
      WHERE b.shipper_id = $1
      ORDER BY b.booked_at DESC
    `, [req.user.id]);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
