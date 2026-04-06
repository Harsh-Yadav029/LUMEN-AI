import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
});

const chatSchema = new mongoose.Schema({
  // BUG 11 FIX: default to 'anonymous' so old docs without userId don't
  // fail validation — run a migration later to backfill real userIds
  userId:    { type: String, default: 'anonymous', index: true },
  namespace: { type: String, required: true },
  fileName:  { type: String, default: '' },
  messages:  [messageSchema],
}, { timestamps: true });

chatSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Chat", chatSchema);
