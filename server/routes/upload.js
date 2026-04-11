// server/routes/upload.js
import express  from 'express';
import fs       from 'fs';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { requireAuth } from '../middleware/auth.js';
import { upload }      from '../middleware/upload.js';
import { embedTexts }  from '../services/embeddings.js';
import { pinecone, BATCH_SIZE, UPLOADS } from '../config/index.js';

const router = express.Router();

// ── Single PDF upload (existing) ──
// POST /upload — uploads one PDF, returns { namespace, fileName, chunks }
router.post('/', requireAuth, upload.single('pdf'), async (req, res) => {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
  const filePath = req.file?.path;

  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    const fileName  = req.file.originalname;
    const namespace = `${req.uid}_${Date.now()}`;

    // Lazy import — avoids pdf-parse startup crash on Render
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const buffer  = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from this PDF.' });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800, chunkOverlap: 200, separators: ['\n\n', '\n', '.', ' '],
    });
    const texts   = await splitter.splitText(rawText);
    const vectors = await embedTexts(texts);

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME).namespace(namespace);

    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE).map((values, j) => ({
        id: `chunk-${i + j}`, values,
        metadata: { text: texts[i + j], source: fileName },
      }));
      await index.upsert(batch);
    }

    res.json({ status: 'ok', namespace, fileName, chunks: texts.length });

  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});

// ── Multi PDF upload ──
// POST /upload/multiple — uploads up to 5 PDFs at once
// Returns { pdfs: [{ namespace, fileName, chunks }] }
router.post('/multiple', requireAuth, upload.array('pdfs', 5), async (req, res) => {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No PDFs uploaded' });
  }

  const results = [];
  const errors  = [];

  for (const file of req.files) {
    const filePath = file.path;
    try {
      const fileName  = file.originalname;
      const namespace = `${req.uid}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const buffer  = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);
      const rawText = pdfData.text;

      if (!rawText || rawText.trim().length === 0) {
        errors.push({ fileName, error: 'Could not extract text' });
        continue;
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800, chunkOverlap: 200, separators: ['\n\n', '\n', '.', ' '],
      });
      const texts   = await splitter.splitText(rawText);
      const vectors = await embedTexts(texts);
      const index   = pinecone.Index(process.env.PINECONE_INDEX_NAME).namespace(namespace);

      for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        const batch = vectors.slice(i, i + BATCH_SIZE).map((values, j) => ({
          id: `chunk-${i + j}`, values,
          metadata: { text: texts[i + j], source: fileName },
        }));
        await index.upsert(batch);
      }

      results.push({ namespace, fileName, chunks: texts.length });

    } catch (err) {
      console.error(`Upload error for ${file.originalname}:`, err.message);
      errors.push({ fileName: file.originalname, error: err.message });
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  }

  if (results.length === 0) {
    return res.status(500).json({ error: 'All uploads failed', errors });
  }

  res.json({ status: 'ok', pdfs: results, errors });
});

export default router;