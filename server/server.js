import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, seedDatabase } from './db/db.js';
import authRoutes from './routes/auth.routes.js';
import driverRoutes from './routes/driver.routes.js';
import loadRoutes from './routes/load.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Trust nginx + Cloudflare so rate limiters see real client IPs
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/documents', uploadRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }

    return res.sendFile(clientIndexPath);
  });
}

// Error handler — never leak internals to clients in production
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
  });
});

// Initialize — must be sequential: schema first, then seed
(async () => {
  await initializeDatabase();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚛 Smart Return Load server running on http://localhost:${PORT}`);
    if (hasClientBuild) {
      console.log(`🌐 Serving frontend from ${clientDistPath}`);
    } else {
      console.log('ℹ️ Frontend build not found. Run "cd ../client && npm run build" to serve the web app from Express.');
    }
  });
})();
