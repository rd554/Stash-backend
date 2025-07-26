import mongoose, { Schema, Document } from 'mongoose';

export interface ISalary extends Document {
  userId: string;
  salary: number;
  createdAt: Date;
  updatedAt: Date;
}

const SalarySchema = new Schema<ISalary>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  salary: {
    type: Number,
    required: true,
    min: 100000 // Minimum salary ₹1,00,000
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

// Update the updatedAt field before saving
SalarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ISalary>('Salary', SalarySchema); 