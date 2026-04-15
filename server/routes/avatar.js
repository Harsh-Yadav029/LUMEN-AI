// server/routes/avatar.js
import express  from 'express';
import multer   from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Use memory storage — no disk write needed, stream directly to Cloudinary
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files allowed')),
});

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /upload-avatar
// Uploads image buffer to Cloudinary, returns public URL
router.post('/', requireAuth, memUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // Upload buffer to Cloudinary via upload_stream
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         'lumen-avatars',
          public_id:      `avatar_${req.uid}`,  // one avatar per user, overwrites old one
          overwrite:      true,
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({ url });

  } catch (err) {
    console.error('Avatar upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;