import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
});

// Each PDF gets stored as { namespace, fileName }
const pdfSchema = new mongoose.Schema({
  namespace: { type: String, required: true },
  fileName:  { type: String, required: true },
}, { _id: false });

const chatSchema = new mongoose.Schema({
  userId:    { type: String, default: 'anonymous', index: true },

  // Multi-PDF: array of uploaded PDFs for this chat session
  pdfs:      { type: [pdfSchema], default: [] },

  // Keep single namespace/fileName for backwards compat with old chats
  namespace: { type: String, default: '' },
  fileName:  { type: String, default: '' },

  messages:  [messageSchema],
}, { timestamps: true });

chatSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Chat", chatSchema);