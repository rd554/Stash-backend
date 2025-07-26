import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (for local overrides), then .env
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config();

// Debug: Log what environment variables are available
console.log('🔧 Config Debug:');
console.log('🔧 process.env.MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔧 process.env.DB_URI exists:', !!process.env.DB_URI);
console.log('🔧 process.env.NODE_ENV:', process.env.NODE_ENV);

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

// Debug: Log final config values
console.log('🔧 Final config.mongodbUri:', config.mongodbUri.substring(0, 50) + '...');

export default config; 