import mongoose, { Document, Schema } from 'mongoose';

export interface IAIInsight extends Document {
  userId: string;
  insightId: string;
  type: 'warning' | 'tip' | 'celebration' | 'goal' | 'pattern' | 'burn_risk' | 'savings_opportunity' | 'budget_overrun' | 'agentic_analysis' | 'behavioral_adaptation' | 'proactive_action' | 'smart_categorization' | 'financial_health_analytics' | 'predictive_spending' | 'budget_cap_warning';
  priority: 'critical' | 'warning' | 'tip' | 'info';
  content: string;
  title: string;
  generatedAt: Date;
  userResponse?: 'acted_on' | 'ignored' | 'dismissed' | 'get_tips_clicked';
  relatedTransactionId?: string;
  relatedTransactions?: string[];
  userType: string;
  spendingPersonality: string;
  followUpAction?: string;
  isActive: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AIInsightSchema = new Schema<IAIInsight>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  insightId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['warning', 'tip', 'celebration', 'goal', 'pattern', 'burn_risk', 'savings_opportunity', 'budget_overrun', 'agentic_analysis', 'behavioral_adaptation', 'proactive_action', 'smart_categorization', 'financial_health_analytics', 'predictive_spending', 'budget_cap_warning']
  },
  priority: {
    type: String,
    required: true,
    enum: ['critical', 'warning', 'tip', 'info'],
    default: 'tip'
  },
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  userResponse: {
    type: String,
    enum: ['acted_on', 'ignored', 'dismissed', 'get_tips_clicked']
  },
  relatedTransactionId: {
    type: String,
    ref: 'Transaction'
  },
  relatedTransactions: [{
    type: String,
    ref: 'Transaction'
  }],
  userType: {
    type: String,
    required: true
  },
  spendingPersonality: {
    type: String,
    required: true
  },
  followUpAction: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  data: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
AIInsightSchema.index({ userId: 1, isActive: 1 });
AIInsightSchema.index({ userId: 1, createdAt: -1 });
AIInsightSchema.index({ userId: 1, priority: 1 });

export default mongoose.model<IAIInsight>('AIInsight', AIInsightSchema); 