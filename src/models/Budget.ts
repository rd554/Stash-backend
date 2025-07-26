import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  userId: string;
  category: string;
  budgetCap: number;
  spendingPersonality: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true
  },
  budgetCap: {
    type: Number,
    required: true,
    min: 0
  },
  spendingPersonality: {
    type: String,
    required: true,
    enum: ['Heavy Spender', 'Medium Spender', 'Max Saver']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique budget caps per user per category
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

// Update the updatedAt field on save
BudgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IBudget>('Budget', BudgetSchema); 