import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
import { serverError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIMETYPES  = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIMETYPES.includes(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPG, PNG, WebP) are allowed.'));
    }
  },
});

export async function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { doc_type } = req.body;
    const validTypes = ['RC', 'permit', 'insurance', 'PUC', 'licence'];
    if (!validTypes.includes(doc_type)) {
      return res.status(400).json({ error: `Doc type must be one of: ${validTypes.join(', ')}` });
    }

    const file_url = `/uploads/${req.file.filename}`;
    await pool.query(
      'INSERT INTO documents (user_id, doc_type, file_url) VALUES ($1,$2,$3)',
      [req.user.id, doc_type, file_url]
    );
    res.status(201).json({ message: 'Document uploaded.', file_url });
  } catch (err) {
    return serverError(res, err, 'upload:document');
  }
}

export async function getUserDocuments(req, res) {
  try {
    const userId = req.params.userId || req.user.id;
    const { rows: documents } = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [userId]
    );
    res.json({ documents });
  } catch (err) {
    return serverError(res, err, 'upload:getUserDocs');
  }
}
