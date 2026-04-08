import db from '../db/db.js';

const ALLOWED_KEYS = ['site_name', 'logo_url', 'primary_color', 'theme_preset'];

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
