import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartreturnload_dev_secret';

export function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }
    if (!['driver', 'shipper'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "driver" or "shipper".' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, password_hash, role);

    const user = db.prepare('SELECT id, name, email, phone, role, avg_rating, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getMe(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, avatar_url, avg_rating, total_ratings, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Attach truck info if driver
    if (user.role === 'driver') {
      user.truck = db.prepare('SELECT * FROM trucks WHERE user_id = ?').get(user.id) || null;
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
