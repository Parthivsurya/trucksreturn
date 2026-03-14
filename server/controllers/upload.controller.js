import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and image files are allowed.'));
  },
});

export function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { doc_type } = req.body;
    const validTypes = ['RC', 'permit', 'insurance', 'PUC', 'licence'];
    if (!validTypes.includes(doc_type)) {
      return res.status(400).json({ error: `Doc type must be one of: ${validTypes.join(', ')}` });
    }

    const file_url = `/uploads/${req.file.filename}`;
    db.prepare('INSERT INTO documents (user_id, doc_type, file_url) VALUES (?,?,?)')
      .run(req.user.id, doc_type, file_url);

    res.status(201).json({ message: 'Document uploaded.', file_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function getUserDocuments(req, res) {
  try {
    const userId = req.params.userId || req.user.id;
    const docs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC').all(userId);
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
