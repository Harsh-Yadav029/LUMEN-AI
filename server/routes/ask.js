// server/routes/ask.js
import express from 'express';
import Chat           from '../models/Chat.js';
import { requireAuth } from '../middleware/auth.js';
import { embedQuery }  from '../services/embeddings.js';
import { streamAnswer } from '../services/stream.js';
import { pinecone }    from '../config/index.js';

const router = express.Router();

// Build the prompt — kept here so it's easy to tune without touching routing logic
function buildPrompt(question, context, historyText) {
  return `
You are an expert AI assistant with deep knowledge across all domains. You have been provided with a PDF document as context, and your job is to give a comprehensive, well-structured answer — similar to how a knowledgeable tutor or consultant would explain something.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${historyText ? `CONVERSATION HISTORY:\n${historyText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

DOCUMENT CONTEXT:
${context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER QUESTION:
${question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO ANSWER:

1. **Direct Answer First** — Open with a clear, confident 1-2 sentence answer. No fluff.
2. **From the Document** — Pull relevant info from the PDF. Reference it naturally.
3. **In-Depth Explanation** — Go beyond the document. Cover the "what", "why", and "how".
4. **Real-World Examples** — Give 1-2 concrete, relatable examples or analogies.
5. **Key Takeaways** — End with 3-5 bullet points of the most important things to remember.

RULES:
- Use **bold** for important terms and headings
- Use bullet points and numbered lists where appropriate
- Never say "I don't know" — always give the best possible answer
- Tone: smart, clear, friendly

Now write the full answer:
`;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { question, namespace, chatId, fileName } = req.body;
    const userId = req.uid;

    if (!question) return res.status(400).json({ error: 'Question required' });

    // Load or create chat session scoped to this user
    let chat;
    if (chatId) chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat)  chat = new Chat({ userId, namespace, messages: [], fileName: fileName || '' });

    // Build history string from last 3 exchanges (6 messages)
    const recentMessages = chat.messages.slice(-6);
    const historyText = recentMessages.length > 0
      ? recentMessages
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .join('\n')
      : '';

    // Semantic search
    const qVec  = await embedQuery(question);
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME).namespace(namespace);
    const result = await index.query({ vector: qVec, topK: 5, includeMetadata: true });
    const context = result.matches.map(m => m.metadata.text).join('\n\n');

    const prompt = buildPrompt(question, context, historyText);

    // Set SSE headers before streaming starts
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const answer = await streamAnswer(prompt, res);

    // Save conversation to MongoDB
    chat.messages.push(
      { role: 'user',      text: question },
      { role: 'assistant', text: answer   }
    );
    if (!chat.fileName && fileName) chat.fileName = fileName;
    await chat.save();

    // Final SSE event with chatId so frontend can track the session
    res.write(`data: ${JSON.stringify({ done: true, chatId: chat._id.toString() })}\n\n`);
    res.end();

  } catch (err) {
    console.error(err);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
