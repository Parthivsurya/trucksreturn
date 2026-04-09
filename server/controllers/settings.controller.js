import db from '../db/db.js';
import { testEmail as sendTestEmail } from '../services/email.service.js';

const ALLOWED_KEYS = [
  'site_name', 'logo_url', 'primary_color', 'accent_color', 'theme_preset',
  'smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_secure',
  'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email',
  'email_on_login', 'email_on_booking_shipper', 'email_on_booking_driver',
  'email_on_status_change', 'email_on_load_status',
];

export function getSettings(req, res) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
}

export function updateSettings(req, res) {
  const updates = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const run = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_KEYS.includes(key)) stmt.run(key, String(value));
    }
  });
  run();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
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
