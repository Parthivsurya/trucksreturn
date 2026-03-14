import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, uploadDocument, getUserDocuments } from '../controllers/upload.controller.js';

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadDocument);
router.get('/mine', authenticate, getUserDocuments);
router.get('/user/:userId', authenticate, getUserDocuments);

export default router;
