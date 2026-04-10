// server/server.js
import * as dotenv from 'dotenv';
dotenv.config();

import fs      from 'fs';
import path    from 'path';
import express from 'express';
import cors    from 'cors';

import { connectDB }    from './config/db.js';
import { initFirebase } from './config/firebase.js';
import { UPLOADS, PORT, __dirname } from './config/index.js';

import uploadRouter from './routes/upload.js';
import askRouter    from './routes/ask.js';
import chatsRouter  from './routes/chats.js';

// ── Bootstrap ──
connectDB();
initFirebase();

// ── Ensure uploads dir exists on startup ──
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

// ── App ──
const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check — Render pings this to confirm the service is up ──
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Routes ──
app.use('/upload', uploadRouter);
app.use('/ask',    askRouter);
app.use('/chats',  chatsRouter);

// ── Global error handler ──
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
