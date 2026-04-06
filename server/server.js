// server/server.js
// Entry point — thin orchestrator that wires config, middleware, and routes.
// All logic lives in config/, middleware/, services/, and routes/.

import * as dotenv from 'dotenv';
dotenv.config();

import fs       from 'fs';
import path     from 'path';
import express  from 'express';
import cors     from 'cors';

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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lumen-ai-one.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors());
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
