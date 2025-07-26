import mongoose, { Document, Schema } from 'mongoose';

export interface INudge extends Document {
  userId: string;
  message: string;
  type: 'warning' | 'suggestion' | 'celebration' | 'overspending' | 'budget_alert' | 'savings_goal' | 'spending_pattern' | 'bill_reminder' | 'burn_risk_alert' | 'savings_opportunity' | 'habit_pattern' | 'goal_progress';
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  actionRequired: boolean;
  userResponse?: 'accepted' | 'ignored' | 'snoozed' | 'get_tips_clicked';
  relatedTransactionId?: string;
  relatedTransactions?: string[];
  sourceInsightId?: string;
  chatbotContext?: string;
  suggestedQuestion?: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NudgeSchema = new Schema<INudge>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['warning', 'suggestion', 'celebration', 'overspending', 'budget_alert', 'savings_goal', 'spending_pattern', 'bill_reminder', 'burn_risk_alert', 'savings_opportunity', 'habit_pattern', 'goal_progress']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  userResponse: {
    type: String,
    enum: ['accepted', 'ignored', 'snoozed', 'get_tips_clicked']
  },
  relatedTransactionId: {
    type: String,
    ref: 'Transaction'
  },
  relatedTransactions: [{
    type: String,
    ref: 'Transaction'
  }],
  sourceInsightId: {
    type: String,
    ref: 'AIInsight'
  },
  chatbotContext: {
    type: String
  },
  suggestedQuestion: {
    type: String
  },
  data: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
NudgeSchema.index({ userId: 1, isRead: 1 });
NudgeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INudge>('Nudge', NudgeSchema); 