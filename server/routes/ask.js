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
You are an intelligent AI assistant designed to answer user questions accurately using the provided PDF context.

========================
USER QUESTION:
${question}
========================

========================
CONTEXT FROM PDF:
${context || "No relevant context found"}
========================

========================
CHAT HISTORY:
${historyText || "No previous conversation"}
========================

### INSTRUCTIONS:

1. **Answer the USER QUESTION directly and clearly**
   - Focus primarily on the user's question
   - Do NOT give unrelated information

2. **Use the PDF CONTEXT as the main source**
   - If relevant context exists → base your answer on it
   - If context is missing → say:
     "The document does not contain enough information, but here is a general explanation..."

3. **Keep answers structured and easy to read**
   - Start with a short direct answer
   - Then explain in detail
   - Use bullet points if needed

4. **Be precise and relevant**
   - Avoid unnecessary long explanations
   - Stay focused on the question

5. **Use examples when helpful**
   - Only if it improves understanding

6. **Maintain conversational tone**
   - Answer like ChatGPT (natural, helpful, clear)

---

### OUTPUT FORMAT:

- Short Answer (1–2 lines)
- Detailed Explanation
- (Optional) Example
- Final Key Takeaway

---

Now generate the best possible answer.
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
