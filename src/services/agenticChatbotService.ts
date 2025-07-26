import ChatbotContext, { IChatbotContext } from '../models/ChatbotContext';
import AIInsight from '../models/AIInsight';
import Nudge from '../models/Nudge';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export interface ChatbotContextData {
  userId: string;
  context: IChatbotContext['context'];
  transactionContext?: string;
  userType: string;
  spendingPersonality: string;
  recentBehavior?: string;
  suggestedQuestion?: string;
  availableData?: string[];
  sourceInsightId?: string;
  sourceNotificationId?: string;
}

export interface ConversationMessage {
  message: string;
  isUser: boolean;
  context?: string;
  timestamp?: Date;
}

export class AgenticChatbotService {
  
  async createChatbotContext(contextData: ChatbotContextData): Promise<IChatbotContext> {
    const sessionId = `session_${uuidv4()}`;
    
    const chatbotContext = new ChatbotContext({
      ...contextData,
      sessionId,
      conversationHistory: [],
      isActive: true
    });

    return await chatbotContext.save();
  }

  async getActiveContext(userId: string, sessionId?: string): Promise<IChatbotContext | null> {
    if (sessionId) {
      return await ChatbotContext.findOne({ userId, sessionId, isActive: true });
    }
    return await ChatbotContext.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
  }

  async addMessageToContext(
    userId: string, 
    sessionId: string, 
    message: string, 
    isUser: boolean, 
    context?: string
  ): Promise<IChatbotContext | null> {
    const conversationMessage: ConversationMessage = {
      message,
      isUser,
      context,
      timestamp: new Date()
    };

    return await ChatbotContext.findOneAndUpdate(
      { userId, sessionId, isActive: true },
      { 
        $push: { conversationHistory: conversationMessage },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  async createContextFromInsight(
    userId: string,
    insightId: string,
    userType: string,
    spendingPersonality: string
  ): Promise<IChatbotContext | null> {
    const insight = await AIInsight.findOne({ insightId, userId });
    if (!insight) return null;

    let suggestedQuestion = '';
    let transactionContext = '';

    // Generate contextual question based on insight type
    switch (insight.type) {
      case 'burn_risk':
        suggestedQuestion = `How can I reduce my ${insight.data?.category || 'spending'} to avoid overspending?`;
        transactionContext = 'burn_risk_analysis';
        break;
      case 'savings_opportunity':
        suggestedQuestion = 'What are some effective ways to save money based on my current spending pattern?';
        transactionContext = 'savings_optimization';
        break;
      case 'pattern':
        suggestedQuestion = 'How can I break my recurring spending habits?';
        transactionContext = 'habit_breaking';
        break;
      case 'goal':
        suggestedQuestion = 'How can I accelerate my progress towards my financial goals?';
        transactionContext = 'goal_acceleration';
        break;
      default:
        suggestedQuestion = 'How can I improve my financial health?';
        transactionContext = 'general_advice';
    }

    const contextData: ChatbotContextData = {
      userId,
      context: 'get_tips_clicked',
      transactionContext,
      userType,
      spendingPersonality,
      recentBehavior: insight.content,
      suggestedQuestion,
      availableData: ['transaction_history', 'spending_patterns', 'user_profile', 'financial_goals'],
      sourceInsightId: insightId
    };

    return await this.createChatbotContext(contextData);
  }

  async createContextFromNotification(
    userId: string,
    notificationId: string,
    userType: string,
    spendingPersonality: string
  ): Promise<IChatbotContext | null> {
    const notification = await Nudge.findOne({ _id: notificationId, userId });
    if (!notification) return null;

    let suggestedQuestion = '';
    let transactionContext = '';

    // Generate contextual question based on notification type
    switch (notification.type) {
      case 'burn_risk_alert':
        suggestedQuestion = 'How can I avoid this type of spending in the future?';
        transactionContext = 'burn_prevention';
        break;
      case 'savings_opportunity':
        suggestedQuestion = 'What are the best ways to save money right now?';
        transactionContext = 'savings_strategy';
        break;
      case 'habit_pattern':
        suggestedQuestion = 'How can I change this spending habit?';
        transactionContext = 'habit_modification';
        break;
      case 'goal_progress':
        suggestedQuestion = 'How can I stay on track with my financial goals?';
        transactionContext = 'goal_maintenance';
        break;
      default:
        suggestedQuestion = 'How can I improve my financial situation?';
        transactionContext = 'general_improvement';
    }

    const contextData: ChatbotContextData = {
      userId,
      context: 'notification_action',
      transactionContext,
      userType,
      spendingPersonality,
      recentBehavior: notification.message,
      suggestedQuestion,
      availableData: ['transaction_history', 'spending_patterns', 'user_profile', 'financial_goals'],
      sourceNotificationId: notificationId
    };

    return await this.createChatbotContext(contextData);
  }

  async createContextForTransactionAnalysis(
    userId: string,
    transactionId: string,
    userType: string,
    spendingPersonality: string,
    transactionData: any
  ): Promise<IChatbotContext | null> {
    const suggestedQuestion = `Can you analyze this ${transactionData.category} transaction and provide advice?`;
    
    const contextData: ChatbotContextData = {
      userId,
      context: 'transaction_analysis',
      transactionContext: `${transactionData.category}_analysis`,
      userType,
      spendingPersonality,
      recentBehavior: `Recent ${transactionData.category} transaction of ₹${transactionData.amount}`,
      suggestedQuestion,
      availableData: ['transaction_history', 'spending_patterns', 'user_profile', 'financial_goals', 'category_analysis'],
      sourceInsightId: undefined,
      sourceNotificationId: undefined
    };

    return await this.createChatbotContext(contextData);
  }

  async getConversationHistory(userId: string, sessionId: string): Promise<ConversationMessage[]> {
    const context = await this.getActiveContext(userId, sessionId);
    return context?.conversationHistory || [];
  }

  async deactivateContext(userId: string, sessionId: string): Promise<boolean> {
    const result = await ChatbotContext.findOneAndUpdate(
      { userId, sessionId },
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  async getUserContexts(userId: string, limit: number = 10): Promise<IChatbotContext[]> {
    return await ChatbotContext.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  // Generate contextual prompt for GPT-4
  async generateContextualPrompt(
    userId: string,
    sessionId: string,
    userMessage: string
  ): Promise<string> {
    // Check if this is a fallback sessionId
    const isFallbackSession = sessionId && sessionId.startsWith('fallback_');
    
    if (isFallbackSession) {
      // For fallback sessions, create a basic contextual prompt
      const user = await User.findOne({ username: userId });
      const userType = user?.userType || 'test';
      const spendingPersonality = user?.spendingPersonality || 'Medium Spender';
      
      const systemPrompt = `You are Stash AI, a financial advisor for ${userType} with ${spendingPersonality} personality.

Context: general_financial_advice
Recent Behavior: User clicked "Get Tips" on a financial insight
Available Data: transaction_history, spending_patterns, user_profile, financial_goals

Provide personalized, actionable financial advice based on the user's spending personality. Be specific, encouraging, and practical. Focus on the user's question and provide concrete steps they can take.

User: ${userMessage}
Assistant:`;

      return systemPrompt;
    }

    const context = await this.getActiveContext(userId, sessionId);
    if (!context) return userMessage;

    const conversationHistory = context.conversationHistory
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.message}`)
      .join('\n');

    const systemPrompt = `You are Stash AI, a financial advisor for ${context.userType} with ${context.spendingPersonality} personality.

Context: ${context.transactionContext || 'general_financial_advice'}
Recent Behavior: ${context.recentBehavior || 'No recent behavior data'}
Available Data: ${context.availableData?.join(', ') || 'transaction_history'}

Provide personalized, actionable financial advice based on the user's spending personality and recent behavior. Be specific, encouraging, and practical.

Previous conversation:
${conversationHistory}

User: ${userMessage}
Assistant:`;

    return systemPrompt;
  }
}

export default new AgenticChatbotService(); 