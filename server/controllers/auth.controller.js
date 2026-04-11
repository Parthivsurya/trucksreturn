import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db.js';
import { sendLoginEmail, sendOtpEmail } from '../services/email.service.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

function internalError(res, err, ctx) {
  console.error(`[auth] ${ctx}:`, err);
  return res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
}

export async function sendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await pool.query(
      'INSERT INTO otp_tokens (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at',
      [email, otp, expiresAt]
    );

    await sendOtpEmail({ email, otp });
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    return internalError(res, err, 'sendOtp');
  }
}

export async function register(req, res) {
  try {
    const { name, email, phone, password, role, otp } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }
    if (!['driver', 'shipper'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "driver" or "shipper".' });
    }
    if (!otp) return res.status(400).json({ error: 'OTP is required.' });

    // Verify OTP
    const { rows: [token] } = await pool.query(
      'SELECT * FROM otp_tokens WHERE email = $1',
      [email]
    );
    if (!token) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (new Date() > new Date(token.expires_at)) {
      await pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (token.otp !== String(otp)) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    // OTP valid — clean up and create user
    await pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]);

    const { rows: existingRows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows.length > 0) return res.status(409).json({ error: 'Email already registered.' });

    const password_hash = bcrypt.hashSync(password, 10);
    const { rows: [inserted] } = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone || null, password_hash, role]
    );

    const { rows: [user] } = await pool.query(
      'SELECT id, name, email, phone, role, avg_rating, created_at FROM users WHERE id = $1',
      [inserted.id]
    );
    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token: jwtToken, user });
  } catch (err) {
    return internalError(res, err, 'register');
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows: [user] } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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

    // Fire-and-forget login notification
    sendLoginEmail(user).catch(() => {});
  } catch (err) {
    return internalError(res, err, 'login');
  }
}

export async function getMe(req, res) {
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id, name, email, phone, role, avatar_url, avg_rating, total_ratings, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Attach truck info if driver
    if (user.role === 'driver') {
      const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [user.id]);
      user.truck = truck || null;
    }

    res.json({ user });
  } catch (err) {
    return internalError(res, err, 'getMe');
  }
}
