// server/middleware/upload.js
import multer from 'multer';
import fs     from 'fs';
import { UPLOADS } from '../config/index.js';

if (!fs.existsSync(UPLOADS)) {
  fs.mkdirSync(UPLOADS, { recursive: true });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => {
      if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
      cb(null, UPLOADS);
    },
    filename: (_, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  fileFilter: (_, file, cb) =>
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files allowed')),
  limits: { fileSize: 50 * 1024 * 1024 }, 
});
