import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { requireAuth, requireRole } from '../middleware.js';

export const uploadRouter = Router();

// ── Ensure uploads directory exists ──────────────────────────────────────────
const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /^image\/(jpeg|png|gif|webp)$/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ── POST /api/upload ──────────────────────────────────────────────────────────
uploadRouter.post(
  '/upload',
  requireAuth,
  requireRole(['CIVIL']),
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file received' });
    }
    // Return accessible URL — frontend can construct it from VITE_API_BASE
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: fileUrl });
  }
);
