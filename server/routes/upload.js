import express  from 'express';
import fs       from 'fs';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { requireAuth } from '../middleware/auth.js';
import { upload }      from '../middleware/upload.js';
import { embedTexts }  from '../services/embeddings.js';
import { pinecone, BATCH_SIZE, UPLOADS } from '../config/index.js';

const router = express.Router();

router.post('/', requireAuth, upload.single('pdf'), async (req, res) => {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

  const filePath = req.file?.path;

  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    const fileName  = req.file.originalname;
    const namespace = `${req.uid}_${Date.now()}`;

    // Import pdf-parse lazily — avoids the startup test-file crash on Render
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');

    const buffer  = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from this PDF.' });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize:    800,
      chunkOverlap: 200,
      separators:   ['\n\n', '\n', '.', ' '],
    });
    const texts = await splitter.splitText(rawText);

    const vectors = await embedTexts(texts);
    const index   = pinecone.Index(process.env.PINECONE_INDEX_NAME).namespace(namespace);

    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE).map((values, j) => ({
        id:       `chunk-${i + j}`,
        values,
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

export default router;