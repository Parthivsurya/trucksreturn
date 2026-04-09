import db from '../db/db.js';
import {
  sendBookingCreatedToShipper,
  sendBookingCreatedToDriver,
  sendBookingStatusUpdate,
} from '../services/email.service.js';

export function createBooking(req, res) {
  try {
    const { load_id, agreed_price } = req.body;

    if (!load_id || !agreed_price) {
      return res.status(400).json({ error: 'Load ID and agreed price are required.' });
    }

    const load = db.prepare("SELECT * FROM loads WHERE id = ? AND status = 'open'").get(load_id);
    if (!load) return res.status(404).json({ error: 'Load not found or no longer available.' });

    // Check that the driver has a truck
    const truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(req.user.id);
    if (!truck) return res.status(400).json({ error: 'Register your truck before accepting loads.' });

    if (truck.capacity_tons < load.weight_tons) {
      return res.status(400).json({ error: 'Your truck capacity is insufficient for this load.' });
    }

    const result = db.prepare('INSERT INTO bookings (load_id, driver_id, shipper_id, agreed_price) VALUES (?,?,?,?)')
      .run(load_id, req.user.id, load.user_id, agreed_price);

    // Update load status
    db.prepare("UPDATE loads SET status = 'booked' WHERE id = ?").run(load_id);

    // Update driver availability
    db.prepare("UPDATE driver_availability SET status = 'matched' WHERE user_id = ? AND status = 'active'").run(req.user.id);

    const booking = db.prepare(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons
      FROM bookings b JOIN loads l ON b.load_id = l.id WHERE b.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ booking });

    // Fire-and-forget emails
    const driver = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.id);
    const fullLoad = db.prepare('SELECT * FROM loads WHERE id = ?').get(load_id);
    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
    Promise.all([
      sendBookingCreatedToShipper({ booking: newBooking, load: fullLoad, driver, truck }),
      sendBookingCreatedToDriver({ booking: newBooking, load: fullLoad, driver }),
    ]).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function updateBookingStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    // Only driver or shipper can update
    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const updates = { status };
    if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    db.prepare(`UPDATE bookings SET status = ?, picked_up_at = COALESCE(?, picked_up_at), delivered_at = COALESCE(?, delivered_at) WHERE id = ?`)
      .run(status, updates.picked_up_at || null, updates.delivered_at || null, req.params.id);

    // Update load status
    const loadStatus = status === 'delivered' ? 'delivered' : status === 'cancelled' ? 'open' : 'in_transit';
    db.prepare('UPDATE loads SET status = ? WHERE id = ?').run(loadStatus, booking.load_id);

    const updated = db.prepare(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons, l.pickup_lat, l.pickup_lng, l.delivery_lat, l.delivery_lng
      FROM bookings b JOIN loads l ON b.load_id = l.id WHERE b.id = ?
    `).get(req.params.id);

    res.json({ booking: updated });

    // Notify both driver and shipper about the status change
    const fullLoad = db.prepare('SELECT * FROM loads WHERE id = ?').get(booking.load_id);
    const driver   = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(booking.driver_id);
    const shipper  = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(booking.shipper_id);
    Promise.all([
      sendBookingStatusUpdate({ booking, load: fullLoad, newStatus: status, toUser: driver,  role: 'driver'  }),
      sendBookingStatusUpdate({ booking, load: fullLoad, newStatus: status, toUser: shipper, role: 'shipper' }),
    ]).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getBookingById(req, res) {
  try {
    const booking = db.prepare(`
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
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    // Get tracking updates
    const tracking = db.prepare('SELECT * FROM tracking_updates WHERE booking_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ booking, tracking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function addTrackingUpdate(req, res) {
  try {
    const { lat, lng, status_message } = req.body;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    db.prepare('INSERT INTO tracking_updates (booking_id, lat, lng, status_message) VALUES (?,?,?,?)')
      .run(req.params.id, lat, lng, status_message||null);

    res.status(201).json({ message: 'Tracking update recorded.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function rateBooking(req, res) {
  try {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5.' });
    }

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND status = 'delivered'").get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found or not delivered.' });

    // Determine who is being rated
    const to_user_id = req.user.id === booking.driver_id ? booking.shipper_id : booking.driver_id;

    // Check if already rated
    const existing = db.prepare('SELECT id FROM ratings WHERE booking_id = ? AND from_user_id = ?').get(req.params.id, req.user.id);
    if (existing) return res.status(409).json({ error: 'Already rated this booking.' });

    db.prepare('INSERT INTO ratings (booking_id, from_user_id, to_user_id, score, comment) VALUES (?,?,?,?,?)')
      .run(req.params.id, req.user.id, to_user_id, score, comment||null);

    // Update user's average rating
    const avgResult = db.prepare('SELECT AVG(score) as avg, COUNT(*) as cnt FROM ratings WHERE to_user_id = ?').get(to_user_id);
    db.prepare('UPDATE users SET avg_rating = ?, total_ratings = ? WHERE id = ?')
      .run(Math.round(avgResult.avg * 10) / 10, avgResult.cnt, to_user_id);

    res.status(201).json({ message: 'Rating submitted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getShipperBookings(req, res) {
  try {
    const bookings = db.prepare(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons,
             u.name as driver_name, u.avg_rating as driver_rating,
             t.truck_type, t.registration_number
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users u ON b.driver_id = u.id
      LEFT JOIN trucks t ON t.user_id = b.driver_id
      WHERE b.shipper_id = ?
      ORDER BY b.booked_at DESC
    `).all(req.user.id);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
