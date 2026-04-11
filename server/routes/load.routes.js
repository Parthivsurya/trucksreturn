import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware.js';
import {
  createLoad, getLoads, getLoadById, updateLoad, deleteLoad,
  getMyLoads, getLoadMatches, getShipperStats, connectDriver,
} from '../controllers/load.controller.js';

const router = Router();

router.post('/', authenticate, authorizeRole('shipper'), createLoad);
router.get('/', authenticate, getLoads);
router.get('/mine', authenticate, authorizeRole('shipper'), getMyLoads);
router.get('/shipper-stats', authenticate, authorizeRole('shipper'), getShipperStats);
router.get('/:id', authenticate, getLoadById);
router.put('/:id', authenticate, authorizeRole('shipper'), updateLoad);
router.delete('/:id', authenticate, authorizeRole('shipper'), deleteLoad);
router.get('/:id/matches', authenticate, authorizeRole('shipper'), getLoadMatches);
router.post('/:id/connect-driver', authenticate, authorizeRole('shipper'), connectDriver);

export default router;
