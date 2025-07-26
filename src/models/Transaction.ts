import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  date: Date;
  merchant: string;
  amount: number;
  category: string;
  paymentMode: string;
  paymentMethod?: string; // Alias for paymentMode
  isSimulated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  merchant: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ['UPI', 'Card', 'NetBanking', 'Cash']
  },
  isSimulated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema); 