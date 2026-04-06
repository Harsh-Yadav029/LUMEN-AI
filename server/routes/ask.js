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
You are a highly intelligent and knowledgeable AI assistant with expertise across multiple domains, including technology, science, business, and general knowledge.

You are provided with context from a PDF document. Your primary task is to generate a clear, detailed, and well-structured response to the user's query using this document as the main source of truth.

### Instructions:

1. **Understand the Query Deeply**
   - Analyze the user's question carefully.
   - Identify intent, key concepts, and required depth.

2. **Use PDF as Primary Context**
   - Extract relevant information from the provided document.
   - Base your answer primarily on this context.

3. **Enhance with External Knowledge (if needed)**
   - If the PDF lacks sufficient information, intelligently supplement with general knowledge.
   - Ensure the added information is accurate and relevant.

4. **Provide Structured & Detailed Responses**
   - Use headings, subheadings, and bullet points where appropriate.
   - Break down complex ideas into simple explanations.

5. **Explain Like an Expert Teacher**
   - Use simple language where possible.
   - Build understanding step-by-step.
   - Avoid unnecessary jargon unless required.

6. **Include Examples (Very Important)**
   - Add real-world or practical examples wherever possible.
   - Use analogies to simplify difficult concepts.

7. **Be Clear, Concise, and Insightful**
   - Avoid vague answers.
   - Focus on clarity and depth.

8. **If Information is Missing**
   - Clearly state assumptions.
   - Provide the best possible answer based on available knowledge.

### Output Style:

- Start with a **direct answer or summary**
- Then provide a **detailed explanation**
- Include **examples**
- End with a **short conclusion or key takeaway**

Your goal is to respond like a world-class AI assistant (similar to ChatGPT or Claude), delivering high-quality, insightful, and easy-to-understand answers.
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
