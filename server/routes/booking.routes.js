import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware.js';
import {
  createBooking, updateBookingStatus, getBookingById,
  addTrackingUpdate, rateBooking, getShipperBookings,
} from '../controllers/booking.controller.js';

const router = Router();

router.post('/', authenticate, authorizeRole('driver'), createBooking);
router.get('/shipper', authenticate, authorizeRole('shipper'), getShipperBookings);
router.get('/:uuid', authenticate, getBookingById);
router.put('/:uuid/status', authenticate, updateBookingStatus);
router.post('/:uuid/track', authenticate, authorizeRole('driver'), addTrackingUpdate);
router.post('/:uuid/rate', authenticate, rateBooking);

export default router;
