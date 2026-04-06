import * as dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import Groq from 'groq-sdk';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname  = path.dirname(path.dirname(__filename)); // points to /server

export const PORT       = process.env.PORT || 3000;
export const UPLOADS    = path.join(__dirname, 'uploads');

// AI model names
export const EMBED_MODEL  = 'gemini-embedding-001';
export const EMBED_DIM    = 2048;
export const GROQ_MODEL   = 'llama-3.3-70b-versatile';
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Batch sizes
export const BATCH_SIZE  = 50;
export const EMBED_BATCH = 5;

// Initialised AI clients — imported by services that need them
export const gemini   = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const groq     = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });