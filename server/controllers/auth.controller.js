import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/db.js';
import { sendLoginEmail, sendOtpEmail } from '../services/email.service.js';

async function getSecuritySettings() {
  const { rows } = await pool.query("SELECT key, value FROM settings WHERE key LIKE 'security_%'");
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function internalError(res, err, ctx) {
  console.error(`[auth] ${ctx}:`, err);
  return res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
}

function issueAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
}

async function issueRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
  return token;
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/auth',
  });
}

export async function sendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const { rows: [existing] } = await pool.query('SELECT role FROM users WHERE email = $1', [email]);
    if (existing) {
      const roleLabel = existing.role === 'driver' ? 'Truck Driver' : 'Shipper';
      return res.status(409).json({ error: `Email already registered as a ${roleLabel}.` });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await pool.query(
      'INSERT INTO otp_tokens (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at',
      [email, otp, expiresAt]
    );

    const sec = await getSecuritySettings();
    if (sec.security_otp_required !== '0') {
      try {
        await sendOtpEmail({ email, otp });
      } catch (emailErr) {
        await pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]);
        console.error('[auth] sendOtp:email:', emailErr);
        return res.status(503).json({ error: emailErr.message });
      }
      return res.json({ message: 'OTP sent to your email.' });
    }

    // OTP enforcement disabled (testing mode) — return OTP directly
    console.warn(`[auth] OTP enforcement OFF — dev_otp exposed for ${email}`);
    res.json({ message: 'OTP enforcement disabled (testing mode).', dev_otp: otp });
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

    const { rows: [token] } = await pool.query('SELECT * FROM otp_tokens WHERE email = $1', [email]);
    if (!token) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (new Date() > new Date(token.expires_at)) {
      await pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (token.otp !== String(otp)) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

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

    const accessToken = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ token: accessToken, user });
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
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const accessToken = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    const { password_hash, ...safeUser } = user;
    res.json({ token: accessToken, user: safeUser });

    sendLoginEmail(user).catch(() => {});
  } catch (err) {
    return internalError(res, err, 'login');
  }
}

export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token.' });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { rows: [stored] } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );

    if (!stored || new Date() > new Date(stored.expires_at)) {
      res.clearCookie('refresh_token', { path: '/api/auth' });
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }

    const { rows: [user] } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = 1',
      [stored.user_id]
    );
    if (!user) {
      res.clearCookie('refresh_token', { path: '/api/auth' });
      return res.status(401).json({ error: 'Account not found or suspended.' });
    }

    // Rotate refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    const newRefreshToken = await issueRefreshToken(user.id);
    setRefreshCookie(res, newRefreshToken);

    const accessToken = issueAccessToken(user);
    res.json({ token: accessToken });
  } catch (err) {
    return internalError(res, err, 'refresh');
  }
}

export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    return internalError(res, err, 'logout');
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const { rows: [user] } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Don't reveal whether email exists — always respond the same way
    if (!user) return res.json({ message: 'If this email is registered, an OTP has been sent.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_tokens (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at',
      [email, otp, expiresAt]
    );

    const sec = await getSecuritySettings();
    if (sec.security_otp_required !== '0') {
      try {
        await sendOtpEmail({ email, otp });
      } catch (emailErr) {
        await pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]);
        console.error('[auth] forgotPassword:email:', emailErr);
        return res.status(503).json({ error: emailErr.message });
      }
      return res.json({ message: 'OTP sent to your email.' });
    }

    console.warn(`[auth] OTP enforcement OFF — dev_otp exposed for ${email}`);
    res.json({ message: 'OTP enforcement disabled (testing mode).', dev_otp: otp });
  } catch (err) {
    return internalError(res, err, 'forgotPassword');
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const { rows: [token] } = await pool.query('SELECT * FROM otp_tokens WHERE email = $1', [email]);
    if (!token) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (new Date() > new Date(token.expires_at)) {
      await pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (token.otp !== String(otp)) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    const { rows: [user] } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const password_hash = bcrypt.hashSync(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user.id]);

    // Clean up OTP and invalidate all existing sessions
    await Promise.all([
      pool.query('DELETE FROM otp_tokens WHERE email = $1', [email]),
      pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]),
    ]);

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    return internalError(res, err, 'resetPassword');
  }
}

export async function getMe(req, res) {
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id, name, email, phone, role, avatar_url, avg_rating, total_ratings, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.role === 'driver') {
      const { rows: [truck] } = await pool.query('SELECT * FROM trucks WHERE user_id = $1', [user.id]);
      user.truck = truck || null;
    }

    res.json({ user });
  } catch (err) {
    return internalError(res, err, 'getMe');
  }
}
