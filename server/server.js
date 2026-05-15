import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, seedDatabase, pool } from './db/db.js';
import authRoutes     from './routes/auth.routes.js';
import driverRoutes   from './routes/driver.routes.js';
import loadRoutes     from './routes/load.routes.js';
import bookingRoutes  from './routes/booking.routes.js';
import uploadRoutes   from './routes/upload.routes.js';
import adminRoutes    from './routes/admin.routes.js';
import settingsRoutes      from './routes/settings.routes.js';
import notificationRoutes  from './routes/notification.routes.js';

// ── Environment validation (fail-fast on misconfiguration) ───────────────────
const PLACEHOLDER_SECRETS = new Set([
  'smartreturnload_jwt_secret_change_me',
  'your_jwt_secret_here',
  'change_me',
  'changeme',
]);
const WEAK_PASSWORDS = new Set(['123456', 'password', 'admin', 'admin123', 'changeme']);

if (!process.env.NODE_ENV) {
  throw new Error('FATAL: NODE_ENV is not set. Set NODE_ENV=production or NODE_ENV=development.');
}
if (PLACEHOLDER_SECRETS.has(process.env.JWT_SECRET)) {
  throw new Error('FATAL: JWT_SECRET is a known placeholder. Generate one with: openssl rand -hex 32');
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters.');
}
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_PASSWORD || WEAK_PASSWORDS.has(process.env.ADMIN_PASSWORD) || process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error('FATAL: ADMIN_PASSWORD must be set, ≥12 chars, and not a known weak value in production.');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const clientDistPath  = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild  = fs.existsSync(clientIndexPath);
const logsDir         = path.join(__dirname, 'logs');

const app    = express();
const PORT   = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Logging setup ─────────────────────────────────────────────────────────────

// Ensure logs/ directory exists
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// access.log — every HTTP request, rotating daily by appending date to filename
function accessLogStream() {
  const date     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = path.join(logsDir, `access-${date}.log`);
  return fs.createWriteStream(filename, { flags: 'a' });
}

// error.log — single file, append forever (errors only, so it stays small)
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Structured log writer used by the error handler below
function writeErrorLog(entry) {
  const line = JSON.stringify(entry) + '\n';
  errorLogStream.write(line);
}

// ── App setup ─────────────────────────────────────────────────────────────────

// Trust nginx/Cloudflare so rate limiters and HTTPS checks see real client IPs
app.set('trust proxy', 1);

// Enforce HTTPS in production
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !(req.headers['cf-visitor'] || '').includes('"https"')) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Security & utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,           // allow /uploads images cross-origin
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc:         ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org', 'https://cdnjs.cloudflare.com'],
      connectSrc:     ["'self'", 'https://router.project-osrm.org'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  } : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));
const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
];
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);           // curl / server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (localhostRegex.test(origin)) return cb(null, true);  // any localhost port (dev)
    return cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

// In dev: pretty colours in terminal. In prod: combined format to both terminal AND file.
if (isProd) {
  app.use(morgan('combined', { stream: accessLogStream() })); // file
  app.use(morgan('combined'));                                  // terminal
} else {
  app.use(morgan('dev'));                                       // terminal only
}

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiter — 200 requests per 15 min per IP across all API routes
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
}));

// Stricter limiter for write operations (post load, book, track)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment.' },
});
app.use('/api/loads',           writeLimiter);
app.use('/api/bookings',        writeLimiter);
app.use('/api/drivers/availability', writeLimiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/loads',     loadRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/documents', uploadRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/settings',       settingsRoutes);
app.use('/api/notifications',  notificationRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Serve frontend in production
if (hasClientBuild) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    return res.sendFile(clientIndexPath);
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Always log 5xx errors to error.log
  if (status >= 500) {
    const entry = {
      timestamp: new Date().toISOString(),
      method:    req.method,
      url:       req.originalUrl,
      status,
      message:   err.message,
      stack:     isProd ? undefined : err.stack,
    };
    console.error('[error]', entry);
    writeErrorLog(entry);
  }

  res.status(status).json({
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const server = await (async () => {
  await initializeDatabase();
  await seedDatabase();
  const httpServer = app.listen(PORT, () => {
    console.log(`🚛 TrucksReturn server running on http://localhost:${PORT}`);
    if (isProd) console.log(`📝 Logs → ${logsDir}`);
    if (hasClientBuild) {
      console.log(`🌐 Serving frontend from ${clientDistPath}`);
    } else {
      console.log('ℹ️  Run "cd ../client && npm run build" to serve the frontend from Express.');
    }
  });
  httpServer.setTimeout(30_000); // 30 s request timeout — kills hung connections
  return httpServer;
})();

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    try {
      await pool.end();
      errorLogStream.end();
      console.log('✅ DB pool closed. Goodbye.');
    } catch (err) {
      console.error('Error during shutdown:', err.message);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
