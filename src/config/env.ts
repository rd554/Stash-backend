import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (for local overrides), then .env
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config();

export const config = {
  // Database
  mongodbUri: process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/stash-ai',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  
  // Server
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Feature flags
  enableRealGPT4: process.env.ENABLE_REAL_GPT4 === 'true' || false,
  enableRealTimeNotifications: process.env.ENABLE_REALTIME_NOTIFICATIONS === 'true' || false,
};

export default config; 