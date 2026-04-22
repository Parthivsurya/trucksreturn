import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { register, login, getMe, sendOtp, refresh, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { PgRateLimitStore } from '../stores/rateLimitStore.js';

const router = Router();

// Persistent rate limiters backed by PostgreSQL
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new PgRateLimitStore(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Try again in 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new PgRateLimitStore(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: new PgRateLimitStore(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registrations from this IP. Try again later.' },
});

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

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }).withMessage('Name too long.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').isIn(['driver', 'shipper']).withMessage('Role must be driver or shipper.'),
  body('otp').notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number too long.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/send-otp', otpLimiter, otpRules, validate, sendOtp);
router.post('/register', registerLimiter, registerRules, validate, register);
router.post('/login', loginLimiter, loginRules, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
