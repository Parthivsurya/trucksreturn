import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware.js';
import {
  registerTruck, getTruck, broadcastAvailability, getAvailability,
  cancelAvailability, getMatches, getDriverBookings, getDriverProfile, getDriverStats,
  submitVerification,
} from '../controllers/driver.controller.js';

const router = Router();

router.post('/truck', authenticate, authorizeRole('driver'), registerTruck);
router.get('/truck', authenticate, authorizeRole('driver'), getTruck);
router.post('/availability', authenticate, authorizeRole('driver'), broadcastAvailability);
router.get('/availability', authenticate, authorizeRole('driver'), getAvailability);
router.put('/availability/:id/cancel', authenticate, authorizeRole('driver'), cancelAvailability);
router.get('/matches', authenticate, authorizeRole('driver'), getMatches);
router.get('/bookings', authenticate, authorizeRole('driver'), getDriverBookings);
router.get('/stats', authenticate, authorizeRole('driver'), getDriverStats);
router.post('/submit-verification', authenticate, authorizeRole('driver'), submitVerification);
router.get('/profile/:id', authenticate, getDriverProfile);

export default router;
