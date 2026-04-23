import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller.js';

const router = Router();

router.get('/',           authenticate, getNotifications);
router.put('/read-all',   authenticate, markAllRead);
router.put('/:id/read',   authenticate, markRead);

export default router;
