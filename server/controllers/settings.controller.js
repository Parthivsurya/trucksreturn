import pool from '../db/db.js';
import { testEmail as sendTestEmail } from '../services/email.service.js';

// Keys safe to expose to any logged-in or anonymous user (UI only)
const PUBLIC_KEYS = [
  'site_name', 'logo_url', 'favicon_url', 'primary_color', 'accent_color', 'footer_color', 'theme_preset',
];

// All keys that admin can read/write
const ALLOWED_KEYS = [
  ...PUBLIC_KEYS,
  'smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_secure',
  'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email',
  'email_on_login', 'email_on_booking_shipper', 'email_on_booking_driver',
  'email_on_status_change', 'email_on_load_status',
  'security_rate_limit', 'security_otp_required',
];

// Public endpoint — returns only safe UI settings (no credentials)
export async function getSettings(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM settings WHERE key = ANY($1)',
      [PUBLIC_KEYS]
    );
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin-only endpoint — returns all settings including credentials
export async function getAdminSettings(req, res) {
  try {
    const { rows } = await pool.query('SELECT key, value FROM settings');
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const updates = req.body;
    const entries = Object.entries(updates).filter(([key]) => ALLOWED_KEYS.includes(key));

    for (const [key, value] of entries) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [key, String(value)]
      );
    }

    const { rows } = await pool.query('SELECT key, value FROM settings');
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function testEmailEndpoint(req, res) {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email address is required.' });
  try {
    await sendTestEmail(to);
    res.json({ message: `Test email sent to ${to}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
