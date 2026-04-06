// server/routes/upload.js
import express from 'express';
import fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { requireAuth } from '../middleware/auth.js';
import { upload }      from '../middleware/upload.js';
import { embedTexts }  from '../services/embeddings.js';
import { pinecone, BATCH_SIZE } from '../config/index.js';

const router = express.Router();

router.post('/', requireAuth, upload.single('pdf'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    const fileName  = req.file.originalname;
    // Namespace is scoped to the user so PDFs never bleed across accounts
    const namespace = `${req.uid}_${Date.now()}`;

    const docs = await new PDFLoader(filePath).load();

    const chunks = await new RecursiveCharacterTextSplitter({
      chunkSize:    800,
      chunkOverlap: 200,
      separators:   ['\n\n', '\n', '.', ' '],
    }).splitDocuments(docs);

    const texts   = chunks.map(d => d.pageContent);
    const vectors = await embedTexts(texts);

    const index = pinecone
      .Index(process.env.PINECONE_INDEX_NAME)
      .namespace(namespace);

    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE).map((values, j) => ({
        id:       `chunk-${i + j}`,
        values,
        metadata: { text: texts[i + j], source: fileName },
      }));
      await index.upsert(batch);
    }

    res.json({ status: 'ok', namespace, fileName, chunks: chunks.length });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

export default router;
