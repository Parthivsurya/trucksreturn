import pool from '../db/db.js';
import {
  sendBookingCreatedToShipper,
  sendBookingCreatedToDriver,
  sendBookingStatusUpdate,
} from '../services/email.service.js';
import { serverError } from '../utils/errors.js';

export async function createBooking(req, res) {
  try {
    const { load_id, agreed_price } = req.body;

    if (!load_id || !agreed_price) {
      return res.status(400).json({ error: 'Load ID and agreed price are required.' });
    }
    const priceNum = parseFloat(agreed_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'Invalid agreed price.' });
    }

    const { rows: [load] } = await pool.query("SELECT * FROM loads WHERE id = $1 AND status = 'open'", [load_id]);
    if (!load) return res.status(404).json({ error: 'Load not found or no longer available.' });

    const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [req.user.id]);
    if (!truck) return res.status(400).json({ error: 'Register your truck before accepting loads.' });

    // Fetch active availability to check declared free space (LTL support)
    const { rows: [activeAvail] } = await pool.query(
      "SELECT * FROM driver_availability WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );
    const effectiveCapacity = activeAvail?.available_capacity_tons ?? truck.capacity_tons;
    if (effectiveCapacity < load.weight_tons) {
      return res.status(400).json({ error: `Insufficient available space. You have ${effectiveCapacity} tons free; this load needs ${load.weight_tons} tons.` });
    }

    const { rows: [newBooking] } = await pool.query(
      'INSERT INTO bookings (load_id, driver_id, shipper_id, agreed_price) VALUES ($1,$2,$3,$4) RETURNING *',
      [load_id, req.user.id, load.user_id, priceNum]
    );

    await pool.query("UPDATE loads SET status = 'booked' WHERE id = $1", [load_id]);

    // LTL: if driver declared partial capacity, deduct and keep active if space remains.
    // Otherwise (full truck), mark matched immediately.
    if (activeAvail?.available_capacity_tons !== null && activeAvail?.available_capacity_tons !== undefined) {
      await pool.query(
        `UPDATE driver_availability
         SET available_capacity_tons = GREATEST(0, available_capacity_tons - $1),
             status = CASE WHEN available_capacity_tons - $1 <= 0 THEN 'matched' ELSE 'active' END
         WHERE user_id = $2 AND status = 'active'`,
        [load.weight_tons, req.user.id]
      );
    } else {
      await pool.query(
        "UPDATE driver_availability SET status = 'matched' WHERE user_id = $1 AND status = 'active'",
        [req.user.id]
      );
    }

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
    return serverError(res, err, 'booking:create');
  }
}

export async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const { rows: [booking] } = await pool.query('SELECT * FROM bookings WHERE uuid = $1', [req.params.uuid]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const picked_up_at = status === 'picked_up' ? new Date().toISOString() : null;
    const delivered_at = status === 'delivered' ? new Date().toISOString() : null;

    await pool.query(
      'UPDATE bookings SET status=$1, picked_up_at=COALESCE($2,picked_up_at), delivered_at=COALESCE($3,delivered_at) WHERE id=$4',
      [status, picked_up_at, delivered_at, booking.id]
    );

    const loadStatus = status === 'delivered' ? 'delivered' : status === 'cancelled' ? 'open' : 'in_transit';
    await pool.query('UPDATE loads SET status = $1 WHERE id = $2', [loadStatus, booking.load_id]);

    // If driver cancels, free up their availability so they can take other loads
    if (status === 'cancelled') {
      await pool.query(
        "UPDATE driver_availability SET status = 'active' WHERE user_id = $1 AND status = 'matched'",
        [booking.driver_id]
      );
    }

    const { rows: [updated] } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons,
             l.pickup_lat, l.pickup_lng, l.delivery_lat, l.delivery_lng
      FROM bookings b JOIN loads l ON b.load_id = l.id WHERE b.id = $1
    `, [booking.id]);

    res.json({ booking: updated });

    // In-app notification for shipper + fire-and-forget emails
    const { rows: [fullLoad] } = await pool.query('SELECT * FROM loads WHERE id = $1', [booking.load_id]);
    const { rows: [driver] }   = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [booking.driver_id]);
    const { rows: [shipper] }  = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [booking.shipper_id]);

    const shipperNotifications = {
      picked_up:  { title: 'Load Picked Up', message: `${driver.name} has picked up your load: ${updated.cargo_type} (${updated.pickup_city} → ${updated.delivery_city}). It is on its way!` },
      in_transit: { title: 'Load In Transit', message: `Your load ${updated.cargo_type} (${updated.pickup_city} → ${updated.delivery_city}) is now in transit with ${driver.name}.` },
      delivered:  { title: '✅ Load Delivered!', message: `${driver.name} has successfully delivered your load: ${updated.cargo_type} to ${updated.delivery_city}. Please rate your experience.` },
      cancelled:  { title: 'Driver Dropped the Load', message: `${driver.name} had to drop your load: ${updated.cargo_type} (${updated.pickup_city} → ${updated.delivery_city}). It is now available for other drivers.` },
    };

    const notif = shipperNotifications[status];
    if (notif) {
      pool.query(
        `INSERT INTO notifications (user_id, type, title, message, load_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking.shipper_id, `delivery_${status}`, notif.title, notif.message, booking.load_id]
      ).catch(() => {});
    }

    Promise.all([
      sendBookingStatusUpdate({ booking, load: fullLoad, newStatus: status, toUser: driver,  role: 'driver'  }),
      sendBookingStatusUpdate({ booking, load: fullLoad, newStatus: status, toUser: shipper, role: 'shipper' }),
    ]).catch(() => {});
  } catch (err) {
    return serverError(res, err, 'booking:updateStatus');
  }
}

export async function getBookingById(req, res) {
  try {
    const { rows: [booking] } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons, l.description,
             l.pickup_lat, l.pickup_lng, l.delivery_lat, l.delivery_lng,
             l.pickup_address, l.delivery_address, l.handling_instructions, l.offered_price,
             d.name as driver_name, d.avg_rating as driver_rating, d.phone as driver_phone,
             s.name as shipper_name, s.avg_rating as shipper_rating, s.phone as shipper_phone,
             t.truck_type, t.capacity_tons, t.registration_number,
             EXISTS(SELECT 1 FROM ratings r WHERE r.booking_id = b.id AND r.from_user_id = $2) as has_rated
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users d ON b.driver_id = d.id
      JOIN users s ON b.shipper_id = s.id
      LEFT JOIN trucks t ON t.user_id = b.driver_id
      WHERE b.uuid = $1
    `, [req.params.uuid, req.user.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const { rows: tracking } = await pool.query(
      'SELECT * FROM tracking_updates WHERE booking_id = $1 ORDER BY created_at DESC',
      [booking.id]
    );

    res.json({ booking, tracking });
  } catch (err) {
    return serverError(res, err, 'booking:getById');
  }
}

export async function addTrackingUpdate(req, res) {
  try {
    const { lat, lng, status_message } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return res.status(400).json({ error: 'Invalid coordinates.' });

    const { rows: [booking] } = await pool.query(
      'SELECT * FROM bookings WHERE uuid = $1 AND driver_id = $2',
      [req.params.uuid, req.user.id]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    await pool.query(
      'INSERT INTO tracking_updates (booking_id, lat, lng, status_message) VALUES ($1,$2,$3,$4)',
      [booking.id, latNum, lngNum, status_message?.trim() || null]
    );
    res.status(201).json({ message: 'Tracking update recorded.' });
  } catch (err) {
    return serverError(res, err, 'booking:addTracking');
  }
}

export async function rateBooking(req, res) {
  try {
    const { score, comment } = req.body;
    const scoreNum = parseInt(score);
    if (!scoreNum || scoreNum < 1 || scoreNum > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5.' });
    }

    const { rows: [booking] } = await pool.query(
      "SELECT * FROM bookings WHERE uuid = $1 AND status = 'delivered'",
      [req.params.uuid]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found or not delivered.' });

    if (booking.driver_id !== req.user.id && booking.shipper_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const to_user_id = req.user.id === booking.driver_id ? booking.shipper_id : booking.driver_id;

    const { rows: [existing] } = await pool.query(
      'SELECT id FROM ratings WHERE booking_id = $1 AND from_user_id = $2',
      [booking.id, req.user.id]
    );
    if (existing) return res.status(409).json({ error: 'Already rated this booking.' });

    await pool.query(
      'INSERT INTO ratings (booking_id, from_user_id, to_user_id, score, comment) VALUES ($1,$2,$3,$4,$5)',
      [booking.id, req.user.id, to_user_id, scoreNum, comment?.trim() || null]
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
    return serverError(res, err, 'booking:rate');
  }
}

export async function getShipperBookings(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows: bookings } = await pool.query(`
      SELECT b.*, l.pickup_city, l.delivery_city, l.cargo_type, l.weight_tons,
             u.name as driver_name, u.avg_rating as driver_rating,
             t.truck_type, t.registration_number,
             EXISTS(SELECT 1 FROM ratings r WHERE r.booking_id = b.id AND r.from_user_id = $1) as has_rated
      FROM bookings b
      JOIN loads l ON b.load_id = l.id
      JOIN users u ON b.driver_id = u.id
      LEFT JOIN trucks t ON t.user_id = b.driver_id
      WHERE b.shipper_id = $1
      ORDER BY b.booked_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    res.json({ bookings, page, limit });
  } catch (err) {
    return serverError(res, err, 'booking:getShipperBookings');
  }
}
