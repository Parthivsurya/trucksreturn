import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware.js';
import {
  createBooking, updateBookingStatus, getBookingById,
  addTrackingUpdate, rateBooking, getShipperBookings,
} from '../controllers/booking.controller.js';

const router = Router();

router.post('/', authenticate, authorizeRole('driver'), createBooking);
router.get('/shipper', authenticate, authorizeRole('shipper'), getShipperBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/status', authenticate, updateBookingStatus);
router.post('/:id/track', authenticate, authorizeRole('driver'), addTrackingUpdate);
router.post('/:id/rate', authenticate, rateBooking);

export default router;
