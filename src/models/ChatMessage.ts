import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
ChatMessageSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema); 