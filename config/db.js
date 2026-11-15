import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lost_and_found_db', {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection error: ${error.message}`);
    console.warn(`ℹ️ Running in memory database fallback mode for instant demonstration.`);
    return false;
  }
};
