import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, seedDatabase } from './db/db.js';
import authRoutes from './routes/auth.routes.js';
import driverRoutes from './routes/driver.routes.js';
import loadRoutes from './routes/load.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/documents', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize
initializeDatabase();
seedDatabase();

app.listen(PORT, () => {
  console.log(`🚛 Smart Return Load API running on http://localhost:${PORT}`);
});
