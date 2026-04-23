import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
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
import settingsRoutes from './routes/settings.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const clientDistPath  = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild  = fs.existsSync(clientIndexPath);

const app    = express();
const PORT   = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Trust nginx/Cloudflare so rate limiters and HTTPS checks see real client IPs
app.set('trust proxy', 1);

// Enforce HTTPS in production
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Security & utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth',      authRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/loads',     loadRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/documents', uploadRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/settings',  settingsRoutes);

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

// Global error handler — never leak internals in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
  });
});

// Start
const server = await (async () => {
  await initializeDatabase();
  await seedDatabase();
  return app.listen(PORT, () => {
    console.log(`🚛 ReturnLoad server running on http://localhost:${PORT}`);
    if (hasClientBuild) {
      console.log(`🌐 Serving frontend from ${clientDistPath}`);
    } else {
      console.log('ℹ️  Run "cd ../client && npm run build" to serve the frontend from Express.');
    }
  });
})();

// Graceful shutdown — close DB pool and HTTP server cleanly
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('✅ DB pool closed. Goodbye.');
    } catch (err) {
      console.error('Error closing DB pool:', err.message);
    }
    process.exit(0);
  });

  // Force exit after 10 seconds if something hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
