import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  age: number;
  theme: 'light';
  spendingPersonality: 'Heavy Spender' | 'Medium Spender' | 'Max Saver';
  userType?: string;
  salary?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    enum: ['test1', 'test2', 'test3']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  theme: {
    type: String,
    required: true,
    enum: ['light'],
    default: 'light'
  },
  spendingPersonality: {
    type: String,
    required: true,
    enum: ['Heavy Spender', 'Medium Spender', 'Max Saver']
  },
  userType: {
    type: String,
    default: 'test'
  },
  salary: {
    type: Number,
    min: 100000,
    default: 100000
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema); 