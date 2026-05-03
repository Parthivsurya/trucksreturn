import jwt from 'jsonwebtoken';
import pool from '../db/db.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.access_token) {
    // EventSource cannot set custom headers — accept JWT via query param for SSE.
    // Tradeoff: token may appear in access logs. JWT lifetime is 15m so blast radius is small.
    token = req.query.access_token;
  } else {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows: [user] } = await pool.query('SELECT is_active FROM users WHERE id = $1', [decoded.id]);
    if (!user || user.is_active === 0) {
      return res.status(403).json({ error: 'Account suspended. Contact admin.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}
