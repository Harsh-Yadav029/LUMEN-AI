// server/services/stream.js
// Streams tokens directly into an Express response via SSE.
// Tries Groq first (fast), falls back to Gemini if Groq fails.
// Returns the full accumulated text once streaming is complete.

import { groq, gemini, GROQ_MODEL, GEMINI_MODEL } from '../config/index.js';

export async function streamAnswer(prompt, res) {
  // ── Primary: Groq ──
  try {
    console.log('🟢 Streaming via Groq...');
    const stream = await groq.chat.completions.create({
      model:    GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream:   true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullText += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
    console.log('✅ Groq stream complete');
    return fullText;

  } catch (groqErr) {
    console.warn('⚠️ Groq stream failed:', groqErr.message);

    // ── Fallback: Gemini ──
    try {
      console.log('🔵 Falling back to Gemini...');
      const model  = gemini.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      let fullText = '';
      for await (const chunk of result.stream) {
        const token = chunk.text();
        if (token) {
          fullText += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }
      console.log('✅ Gemini stream complete');
      return fullText;

    } catch (geminiErr) {
      console.error('❌ Both stream APIs failed');
      throw new Error(
        `Both APIs failed. Groq: ${groqErr.message} | Gemini: ${geminiErr.message}`
      );
    }
  }
}
