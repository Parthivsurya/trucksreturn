import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware.js';
import {
  adminLogin,
  getDashboard,
  getUsers, updateUserStatus, createUser, deleteUser,
  getLoads, updateLoadStatus, createLoad, deleteLoad, getShippers,
  getBookings,
} from '../controllers/admin.controller.js';
import { updateSettings } from '../controllers/settings.controller.js';

const router = Router();

// Public: admin login
router.post('/login', adminLogin);

// All routes below require a valid admin JWT
router.use(authenticate);
router.use(authorizeRole('admin'));

router.get('/dashboard',         getDashboard);
router.get('/users',             getUsers);
router.post('/users',            createUser);
router.put('/users/:id/status',  updateUserStatus);
router.delete('/users/:id',      deleteUser);
router.get('/loads',             getLoads);
router.post('/loads',            createLoad);
router.put('/loads/:id/status',  updateLoadStatus);
router.delete('/loads/:id',      deleteLoad);
router.get('/shippers',          getShippers);
router.get('/bookings',          getBookings);
router.put('/settings',          updateSettings);

export default router;
