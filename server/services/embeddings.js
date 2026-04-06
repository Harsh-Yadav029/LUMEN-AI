// server/services/embeddings.js
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { EMBED_MODEL, EMBED_DIM, EMBED_BATCH } from '../config/index.js';

function getEmbedder() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model:  EMBED_MODEL,
  });
}

export async function embedTexts(texts) {
  const embedder = getEmbedder();
  const result   = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const vecs  = await embedder.embedDocuments(batch);
    result.push(...vecs.map(v => v.slice(0, EMBED_DIM)));
  }

  return result;
}

export async function embedQuery(text) {
  const vec = await getEmbedder().embedQuery(text);
  return vec.slice(0, EMBED_DIM);
}
