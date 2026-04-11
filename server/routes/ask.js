// server/routes/ask.js
import express from 'express';
import Chat            from '../models/Chat.js';
import { requireAuth }  from '../middleware/auth.js';
import { embedQuery }   from '../services/embeddings.js';
import { streamAnswer } from '../services/stream.js';
import { pinecone }     from '../config/index.js';

const router = express.Router();

function buildPrompt(question, context, historyText, pdfNames) {
  const sourceNote = pdfNames?.length > 1
    ? `You are searching across ${pdfNames.length} documents: ${pdfNames.join(', ')}.`
    : pdfNames?.length === 1
    ? `You are using the document: ${pdfNames[0]}.`
    : '';

  return `
You are an advanced AI assistant that can:
1. Extract and answer from provided PDF documents
2. Combine knowledge from multiple PDFs
3. Enhance answers with your own reasoning (like ChatGPT)

${sourceNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${historyText ? `CONVERSATION HISTORY:\n${historyText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

DOCUMENT CONTEXT:
${context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER QUESTION:
${question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANSWER FORMAT (STRICTLY FOLLOW):

1. **Direct Answer**
- Start with a clear, concise answer to the question.

2. **Based on the Document(s)**
- If answer is from provided context:
  - Say: "Based on the document..."
  - If multiple PDFs: mention filenames
  - Combine info if needed
- If partial info: still use what’s available

3. **Additionally (AI Explanation)**
- Expand using your own knowledge
- Explain deeper concepts like ChatGPT
- Fill gaps if documents are incomplete

4. **Example / Code (if applicable)**
- If question is technical (like DSA, coding, system design):
  - Provide clean code example
  - Explain it step-by-step

5. **Key Takeaways**
- 3–5 bullet points summarizing important ideas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES:

- Always prioritize document context first
- If multiple PDFs:
  - Compare, merge, or differentiate answers
- Use phrases like:
  - "Based on the document..."
  - "According to [filename]..."
  - "Additionally..."
- Never say "I don't know"
- If context is weak → still answer using AI knowledge
- Use **bold formatting** for important terms
- Keep tone: clear, intelligent, helpful (like ChatGPT)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIAL BEHAVIOR:

- If question is about DSA / coding:
  - Give optimized solution
  - Include time & space complexity
  - Explain intuition clearly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Now generate the best possible answer:
`;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { question, namespace, namespaces, chatId, fileName, pdfs } = req.body;
    const userId = req.uid;

    if (!question) return res.status(400).json({ error: 'Question required' });

    // Support both single namespace (old) and multiple namespaces (new)
    // namespaces = [{ namespace, fileName }, ...]
    const searchTargets = namespaces && namespaces.length > 0
      ? namespaces
      : [{ namespace, fileName: fileName || '' }];

    // Load or create chat
    let chat;
    if (chatId) chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      chat = new Chat({
        userId,
        namespace:  searchTargets[0]?.namespace || '',
        fileName:   searchTargets[0]?.fileName  || '',
        pdfs:       searchTargets,
        messages:   [],
      });
    }

    // History
    const recentMessages = chat.messages.slice(-6);
    const historyText = recentMessages.length > 0
      ? recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
      : '';

    // Embed query once
    const qVec = await embedQuery(question);

    // Query ALL namespaces in parallel — multi-PDF search
    const searchPromises = searchTargets.map(({ namespace: ns }) =>
      pinecone
        .Index(process.env.PINECONE_INDEX_NAME)
        .namespace(ns)
        .query({ vector: qVec, topK: 5, includeMetadata: true })
        .then(result => result.matches.map(m => ({
          text:     m.metadata.text,
          score:    m.score,
          source:   m.metadata.source || ns,
        })))
        .catch(() => []) // if one namespace fails, don't crash the whole request
    );

    const allResults = (await Promise.all(searchPromises)).flat();

    // Sort by score, take top 8 across all PDFs
    const topMatches = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Build context — include source filename so the AI can reference it
    const context = topMatches
      .map(m => `[Source: ${m.source}]\n${m.text}`)
      .join('\n\n');

    const pdfNames = searchTargets.map(t => t.fileName).filter(Boolean);
    const prompt   = buildPrompt(question, context, historyText, pdfNames);

    // SSE headers
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const answer = await streamAnswer(prompt, res);

    // Save to MongoDB
    chat.messages.push(
      { role: 'user',      text: question },
      { role: 'assistant', text: answer   }
    );
    // Update pdfs list if new ones were added
    if (namespaces && namespaces.length > 0 && chat.pdfs.length === 0) {
      chat.pdfs = namespaces;
    }
    await chat.save();

    res.write(`data: ${JSON.stringify({ done: true, chatId: chat._id.toString() })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Ask error:', err.message);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;