import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, uploadDocument, getUserDocuments } from '../controllers/upload.controller.js';

const router = Router();

router.post('/', authenticate, (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5 MB.'
        : err.message || 'Upload failed.';
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, uploadDocument);
router.get('/mine', authenticate, getUserDocuments);
router.get('/user/:userId', authenticate, getUserDocuments);

export default router;
