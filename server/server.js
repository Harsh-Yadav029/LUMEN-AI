// server/server.js
// Entry point — thin orchestrator that wires config, middleware, and routes.
// All logic lives in config/, middleware/, services/, and routes/.

import * as dotenv from 'dotenv';
dotenv.config();

import fs       from 'fs';
import path     from 'path';
import express  from 'express';

import { connectDB }   from './config/db.js';
import { initFirebase } from './config/firebase.js';
import { UPLOADS, PORT, __dirname } from './config/index.js';

import uploadRouter from './routes/upload.js';
import askRouter    from './routes/ask.js';
import chatsRouter  from './routes/chats.js';

// ── Bootstrap ──
connectDB();
initFirebase();

// ── Ensure uploads directory exists ──
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

// ── App ──
const app = express();
// 🔥 HARD FIX FOR CORS (works 100%)
const allowedOrigins = [
  "http://localhost:5173",
  "https://lumen-ai-one.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──
app.use('/upload', uploadRouter);
app.use('/ask',    askRouter);
app.use('/chats',  chatsRouter);

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
