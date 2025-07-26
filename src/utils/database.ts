import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/stash-ai';

// Debug: Log environment variable status
console.log('🔍 Environment Variable Debug:');
console.log('🔍 process.env.MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 process.env.DB_URI exists:', !!process.env.DB_URI);
console.log('🔍 Final MONGODB_URI (first 50 chars):', MONGODB_URI.substring(0, 50) + '...');

// Check if we're using local MongoDB as fallback
const isLocalMongo = MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');

// Connection retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const connectDB = async (): Promise<void> => {
  // Configure Mongoose settings
  mongoose.set('bufferCommands', false); // Disable mongoose buffering
  
  // MongoDB connection options (different for local vs Atlas)
  const options = isLocalMongo ? {
    // Local MongoDB options
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 5000,
  } : {
    // MongoDB Atlas options with SSL/TLS configuration
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10000,
    connectTimeoutMS: 30000,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔗 Attempting to connect to MongoDB... (Attempt ${attempt}/${MAX_RETRIES})`);
      console.log('🔗 URI:', MONGODB_URI.substring(0, 50) + '...');
      console.log('🔗 Connection type:', isLocalMongo ? 'Local MongoDB' : 'MongoDB Atlas');
      
      const conn = await mongoose.connect(MONGODB_URI, options);
      console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('📊 MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('📊 MongoDB reconnected');
      });
      
      // If we get here, connection was successful
      return;
      
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);
      
      if (attempt === MAX_RETRIES) {
        console.error('❌ All MongoDB connection attempts failed');
        console.log('⚠️ Server will continue without MongoDB connection. Some features may be limited.');
        // Don't exit process in development, allow retries
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        }
        return;
      }
      
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await delay(RETRY_DELAY);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📊 MongoDB Disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
}; 