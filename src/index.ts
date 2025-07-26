// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// Immediate debug to check if environment variables are loaded
console.log('🚀 IMMEDIATE DEBUG - Environment variables check:');
console.log('🚀 process.env.MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🚀 process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('🚀 process.env.PORT:', process.env.PORT);
console.log('🚀 All environment variables:', Object.keys(process.env).filter(key => key.includes('MONGODB') || key.includes('NODE') || key.includes('PORT')));

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { connectDB } from './utils/database';
import { config } from './config/env';

// Import routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import chatRoutes from './routes/chat';
import nudgesRoutes from './routes/nudges';
import personaRoutes from './routes/personas';
import systemRoutes from './routes/system';
import financialRoutes from './routes/financial';
import salaryRoutes from './routes/salary';
import agenticInsightRoutes from './routes/agenticInsights';
import agenticChatbotRoutes from './routes/agenticChatbot';
import advancedAnalyticsRoutes from './routes/advancedAnalytics';
import phase4FeaturesRoutes from './routes/phase4Features';
import budgetRoutes from './routes/budget';

// Import services
import notificationService from './services/notificationService';

const app = express();
const server = createServer(app);
const PORT = config.port;

// Start server immediately
server.listen(PORT, () => {
  console.log(`🚀 Stash AI Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API info: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔔 Real-time notifications: ${config.enableRealTimeNotifications ? 'Enabled' : 'Disabled'}`);
  console.log(`🤖 GPT-4 integration: ${config.enableRealGPT4 ? 'Enabled' : 'Disabled'}`);
});

// Connect to MongoDB in background (non-blocking)
setTimeout(() => {
  connectDB().catch(error => {
    console.log('⚠️ MongoDB connection failed, but server is running');
    console.log('⚠️ Some features may not work without database connection');
  });
}, 1000);

// Initialize real-time notification service
if (config.enableRealTimeNotifications) {
  notificationService.initialize(server);
  console.log('🔔 Real-time notifications enabled');
}

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/nudges', nudgesRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/agentic/insights', agenticInsightRoutes);
app.use('/api/agentic/chatbot', agenticChatbotRoutes);
app.use('/api/analytics', advancedAnalyticsRoutes);
app.use('/api/phase4', phase4FeaturesRoutes);
app.use('/api/budget', budgetRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Stash AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Debug route to check environment variables
app.get('/debug', (req, res) => {
  res.json({
    message: 'Environment Variables Debug',
    mongodbUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    allEnvVars: Object.keys(process.env).filter(key => 
      key.includes('MONGODB') || 
      key.includes('NODE') || 
      key.includes('PORT') ||
      key.includes('OPENAI') ||
      key.includes('ENABLE')
    ),
    config: {
      mongodbUri: config.mongodbUri.substring(0, 50) + '...',
      nodeEnv: config.nodeEnv,
      port: config.port
    }
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    name: 'Stash AI Backend API',
    version: '1.0.0',
    description: 'Your mindful money coach, powered by habits',
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      chat: '/api/chat',
      nudges: '/api/nudges'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});



// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 