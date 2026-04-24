import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { register, login, getMe, sendOtp, refresh, logout, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { PgRateLimitStore } from '../stores/rateLimitStore.js';
import pool from '../db/db.js';

const router = Router();

// Check DB setting — if security_rate_limit === '0', skip the limiter
async function isRateLimitEnabled() {
  try {
    const { rows: [row] } = await pool.query("SELECT value FROM settings WHERE key = 'security_rate_limit'");
    return row?.value !== '0';
  } catch { return true; }
}

function conditionalLimit(limiter) {
  return async (req, res, next) => {
    if (!(await isRateLimitEnabled())) return next();
    return limiter(req, res, next);
  };
}

// Persistent rate limiters backed by PostgreSQL
const otpLimiter = conditionalLimit(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new PgRateLimitStore(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Try again in 15 minutes.' },
}));

const loginLimiter = conditionalLimit(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new PgRateLimitStore(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
}));

const registerLimiter = conditionalLimit(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: new PgRateLimitStore(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registrations from this IP. Try again later.' },
}));

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

const otpRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
];

const passwordRule = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter.')
  .matches(/[0-9]/).withMessage('Password must contain at least one number.');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }).withMessage('Name too long.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  passwordRule,
  body('role').isIn(['driver', 'shipper']).withMessage('Role must be driver or shipper.'),
  body('otp').notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number too long.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const resetPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('otp').notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  passwordRule,
];

router.post('/send-otp',       otpLimiter,      otpRules,      validate, sendOtp);
router.post('/register',       registerLimiter, registerRules, validate, register);
router.post('/login',          loginLimiter,    loginRules,    validate, login);
router.post('/forgot-password', otpLimiter,     otpRules,           validate, forgotPassword);
router.post('/reset-password', otpLimiter,     resetPasswordRules, validate, resetPassword);
router.post('/refresh',        refresh);
router.post('/logout',         logout);
router.get('/me',              authenticate, getMe);

export default router;
