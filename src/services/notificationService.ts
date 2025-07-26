import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import nudgeService from './nudgeService';
import Transaction from '../models/Transaction';
import User from '../models/User';

export interface NotificationData {
  type: 'nudge' | 'transaction' | 'goal' | 'alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  data?: any;
  timestamp: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  
  private constructor() {}
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupSocketHandlers();
    console.log('🔔 Real-time notification service initialized');
  }
  
  private setupSocketHandlers(): void {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);
      
      // Handle user authentication
      socket.on('authenticate', (userId: string) => {
        this.userSockets.set(userId, socket.id);
        console.log(`👤 User ${userId} authenticated on socket ${socket.id}`);
        
        // Send welcome notification
        this.sendNotification(userId, {
          type: 'nudge',
          title: 'Welcome to Stash AI!',
          message: 'Your real-time financial notifications are now active.',
          severity: 'low',
          timestamp: new Date()
        });
      });
      
      // Handle user disconnection
      socket.on('disconnect', () => {
        // Remove user from socket mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`👤 User ${userId} disconnected`);
            break;
          }
        }
      });
      
      // Handle notification acknowledgments
      socket.on('acknowledge', (notificationId: string) => {
        console.log(`✅ Notification ${notificationId} acknowledged`);
      });
    });
  }
  
  sendNotification(userId: string, notification: NotificationData): void {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }
    
    const socketId = this.userSockets.get(userId);
    if (!socketId) {
      console.log(`📱 User ${userId} not connected, notification queued`);
      return;
    }
    
    this.io.to(socketId).emit('notification', notification);
    console.log(`📤 Notification sent to ${userId}: ${notification.title}`);
  }
  
  broadcastToAll(notification: NotificationData): void {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }
    
    this.io.emit('broadcast', notification);
    console.log(`📢 Broadcast notification: ${notification.title}`);
  }
  
  // Monitor transactions and send real-time nudges
  async monitorTransaction(userId: string, transaction: any): Promise<void> {
    try {
      // Check for immediate spending alerts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = await Transaction.find({
        userId,
        date: { $gte: today }
      });
      
      const dailyTotal = todayTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      const user = await User.findOne({ username: userId });
      
      // Daily spending limit alerts
      const limits = {
        'Heavy Spender': 2000,
        'Medium Spender': 1500,
        'Max Saver': 800
      };
      
      const limit = limits[user?.spendingPersonality || 'Medium Spender'];
      
      if (dailyTotal > limit * 1.5) {
        this.sendNotification(userId, {
          type: 'alert',
          title: '🚨 High Daily Spending Alert',
          message: `You've spent ₹${dailyTotal.toLocaleString()} today, which is significantly above your daily limit of ₹${limit.toLocaleString()}.`,
          severity: 'high',
          data: { dailyTotal, limit, transaction },
          timestamp: new Date()
        });
      } else if (dailyTotal > limit) {
        this.sendNotification(userId, {
          type: 'alert',
          title: '⚠️ Daily Limit Warning',
          message: `You've spent ₹${dailyTotal.toLocaleString()} today, which is above your daily limit of ₹${limit.toLocaleString()}.`,
          severity: 'medium',
          data: { dailyTotal, limit, transaction },
          timestamp: new Date()
        });
      }
      
      // Large transaction alerts
      if (transaction.amount > limit * 0.5) {
        this.sendNotification(userId, {
          type: 'transaction',
          title: '💰 Large Transaction Detected',
          message: `You just spent ₹${transaction.amount.toLocaleString()} at ${transaction.merchant}. This is a significant amount for your spending profile.`,
          severity: 'medium',
          data: { transaction, dailyTotal },
          timestamp: new Date()
        });
      }
      
      // Category spending alerts
      const categoryTransactions = todayTransactions.filter(txn => txn.category === transaction.category);
      const categoryTotal = categoryTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      if (categoryTotal > limit * 0.4) {
        this.sendNotification(userId, {
          type: 'nudge',
          title: '📊 Category Spending Alert',
          message: `You've spent ₹${categoryTotal.toLocaleString()} on ${transaction.category} today. Consider diversifying your spending.`,
          severity: 'medium',
          data: { category: transaction.category, categoryTotal, dailyTotal },
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('Error monitoring transaction:', error);
    }
  }
  
  // Send periodic spending insights
  async sendPeriodicInsights(): Promise<void> {
    try {
      const users = await User.find({});
      
      for (const user of users) {
        const socketId = this.userSockets.get(user.username);
        if (!socketId) continue; // User not connected
        
        const patterns = await nudgeService.analyzeSpendingPatterns(user.username);
        const topCategory = patterns[0];
        
        if (topCategory && topCategory.percentageOfTotal > 35) {
          this.sendNotification(user.username, {
            type: 'nudge',
            title: '📈 Weekly Spending Insight',
            message: `Your top spending category is ${topCategory.category} (${topCategory.percentageOfTotal.toFixed(1)}% of total). Consider setting a budget for this category.`,
            severity: 'low',
            data: { patterns: patterns.slice(0, 3) },
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error sending periodic insights:', error);
    }
  }
  
  // Send goal reminders
  async sendGoalReminders(): Promise<void> {
    try {
      const users = await User.find({});
      
      for (const user of users) {
        const socketId = this.userSockets.get(user.username);
        if (!socketId) continue;
        
        // Check if user has been active recently
        const recentTransactions = await Transaction.find({
          userId: user.username,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });
        
        if (recentTransactions.length === 0) {
          this.sendNotification(user.username, {
            type: 'goal',
            title: '🎯 Financial Goal Reminder',
            message: 'Haven\'t seen you in a while! Remember to track your spending to stay on top of your financial goals.',
            severity: 'low',
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error sending goal reminders:', error);
    }
  }
  
  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
  
  // Get user connection status
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Agentic AI: Generate and send contextual notifications
  async generateAgenticNotification(
    userId: string, 
    insight: any, 
    transactionData?: any
  ): Promise<void> {
    try {
      const user = await User.findOne({ username: userId });
      if (!user) return;

      let notificationType: string;
      let title: string;
      let message: string;
      let severity: 'low' | 'medium' | 'high' = 'medium';
      let suggestedQuestion: string;

      switch (insight.type) {
        case 'burn_risk':
          notificationType = 'burn_risk_alert';
          title = 'Burn Risk Detected';
          message = insight.content;
          severity = 'high';
          suggestedQuestion = 'How can I avoid this type of spending?';
          break;
        case 'savings_opportunity':
          notificationType = 'savings_opportunity';
          title = 'Savings Opportunity';
          message = insight.content;
          severity = 'low';
          suggestedQuestion = 'What are the best ways to save money right now?';
          break;
        case 'pattern':
          notificationType = 'habit_pattern';
          title = 'Spending Pattern Detected';
          message = insight.content;
          severity = 'medium';
          suggestedQuestion = 'How can I change this spending habit?';
          break;
        case 'goal':
          notificationType = 'goal_progress';
          title = 'Goal Progress Update';
          message = insight.content;
          severity = 'low';
          suggestedQuestion = 'How can I accelerate my progress?';
          break;
        default:
          notificationType = 'suggestion';
          title = 'Financial Insight';
          message = insight.content;
          severity = 'medium';
          suggestedQuestion = 'How can I improve my financial health?';
      }

      // Create notification in database
      const Nudge = (await import('../models/Nudge')).default;
      const nudge = new Nudge({
        userId,
        message,
        type: notificationType,
        severity,
        isRead: false,
        actionRequired: true,
        relatedTransactionId: transactionData?.id,
        relatedTransactions: transactionData ? [transactionData.id] : [],
        sourceInsightId: insight.insightId,
        chatbotContext: insight.type,
        suggestedQuestion
      });

      await nudge.save();

      // Send real-time notification
      this.sendNotification(userId, {
        type: 'nudge',
        title,
        message,
        severity,
        timestamp: new Date(),
        data: {
          insightId: insight.insightId,
          suggestedQuestion,
          hasActionButton: true
        }
      });

    } catch (error) {
      console.error('Error generating agentic notification:', error);
    }
  }
}

export default NotificationService.getInstance(); 