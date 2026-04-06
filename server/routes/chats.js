// server/routes/chats.js
import express from 'express';
import Chat           from '../models/Chat.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /chats — sidebar list (lightweight, no full messages)
router.get('/', requireAuth, async (req, res) => {
  try {
    const chats = await Chat.find(
      { userId: req.uid },
      { _id: 1, fileName: 1, namespace: 1, createdAt: 1, messages: { $slice: 1 } }
    ).sort({ createdAt: -1 }).limit(50);

    const list = chats.map(c => ({
      id:        c._id,
      fileName:  c.fileName || 'Untitled chat',
      namespace: c.namespace,
      preview:   c.messages?.[0]?.text?.slice(0, 80) || 'No messages yet',
      createdAt: c.createdAt,
    }));

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /chats/:id — full message history for session restore
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.uid });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    res.json({
      id:        chat._id,
      fileName:  chat.fileName || 'Untitled chat',
      namespace: chat.namespace,
      messages:  chat.messages,
      createdAt: chat.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /chats/:id — userId check prevents deleting another user's chat
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Chat.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ status: 'deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
