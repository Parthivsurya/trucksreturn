import pool from '../db/db.js';
import { serverError } from '../utils/errors.js';

export async function getNotifications(req, res) {
  try {
    const { rows: notifications } = await pool.query(
      `SELECT n.*, l.pickup_city, l.delivery_city, l.cargo_type, l.offered_price, l.uuid as load_uuid
       FROM notifications n
       LEFT JOIN loads l ON n.load_id = l.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    res.json({ notifications, unread_count: parseInt(count) });
  } catch (err) {
    return serverError(res, err, 'notification:getAll');
  }
}

export async function markRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    return serverError(res, err, 'notification:markRead');
  }
}

export async function markAllRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return serverError(res, err, 'notification:markAllRead');
  }
}
