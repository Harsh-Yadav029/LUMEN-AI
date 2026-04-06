import mongoose from 'mongoose';

export function connectDB() {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
      console.error('❌ MongoDB error:', err.message);
      process.exit(1);
    });
}
