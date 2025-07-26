import mongoose, { Document, Schema } from 'mongoose';

export interface IChatbotContext extends Document {
  userId: string;
  sessionId: string;
  context: string;
  transactionContext?: string;
  userType: string;
  spendingPersonality: string;
  recentBehavior?: string;
  suggestedQuestion?: string;
  availableData?: string[];
  sourceInsightId?: string;
  sourceNotificationId?: string;
  conversationHistory: Array<{
    message: string;
    isUser: boolean;
    timestamp: Date;
    context?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotContextSchema = new Schema<IChatbotContext>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  context: {
    type: String,
    required: true,
    enum: ['user_initiated', 'get_tips_clicked', 'insight_followup', 'notification_action', 'transaction_analysis']
  },
  transactionContext: {
    type: String
  },
  userType: {
    type: String,
    required: true
  },
  spendingPersonality: {
    type: String,
    required: true
  },
  recentBehavior: {
    type: String
  },
  suggestedQuestion: {
    type: String
  },
  availableData: [{
    type: String
  }],
  sourceInsightId: {
    type: String,
    ref: 'AIInsight'
  },
  sourceNotificationId: {
    type: String,
    ref: 'Nudge'
  },
  conversationHistory: [{
    message: {
      type: String,
      required: true
    },
    isUser: {
      type: Boolean,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    context: {
      type: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ChatbotContextSchema.index({ userId: 1, isActive: 1 });
ChatbotContextSchema.index({ userId: 1, sessionId: 1 });
ChatbotContextSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IChatbotContext>('ChatbotContext', ChatbotContextSchema); 