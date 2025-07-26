import Transaction from '../models/Transaction';
import User from '../models/User';
import Nudge from '../models/Nudge';
import { config } from '../config/env';

export interface SpendingPattern {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface NudgeTrigger {
  type: 'overspending' | 'budget_alert' | 'savings_goal' | 'spending_pattern' | 'bill_reminder';
  severity: 'low' | 'medium' | 'high';
  message: string;
  actionRequired: boolean;
  data?: any;
}

export class NudgeService {
  private static instance: NudgeService;
  
  private constructor() {}
  
  public static getInstance(): NudgeService {
    if (!NudgeService.instance) {
      NudgeService.instance = new NudgeService();
    }
    return NudgeService.instance;
  }
  
  async analyzeSpendingPatterns(userId: string): Promise<SpendingPattern[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });
    
    const categoryMap = new Map<string, { total: number; count: number }>();
    const totalSpent = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    transactions.forEach(txn => {
      const category = txn.category;
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      existing.total += txn.amount;
      existing.count += 1;
      categoryMap.set(category, existing);
    });
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: data.total,
      transactionCount: data.count,
      averageAmount: data.total / data.count,
      percentageOfTotal: (data.total / totalSpent) * 100
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }
  
  async generateNudges(userId: string): Promise<NudgeTrigger[]> {
    const user = await User.findOne({ username: userId });
    const patterns = await this.analyzeSpendingPatterns(userId);
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(7);
    
    const nudges: NudgeTrigger[] = [];
    
    // 1. Overspending detection
    const dailySpending = await this.checkDailySpendingLimit(userId, recentTransactions);
    if (dailySpending.shouldNudge) {
      nudges.push({
        type: 'overspending',
        severity: dailySpending.severity,
        message: dailySpending.message,
        actionRequired: true,
        data: { dailyTotal: dailySpending.dailyTotal, limit: dailySpending.limit }
      });
    }
    
    // 2. Category overspending
    const categoryNudges = this.checkCategoryOverspending(patterns, user?.spendingPersonality);
    nudges.push(...categoryNudges);
    
    // 3. Savings goal reminders
    const savingsNudge = await this.checkSavingsGoals(userId, patterns);
    if (savingsNudge) {
      nudges.push(savingsNudge);
    }
    
    // 4. Spending pattern insights
    const patternNudge = this.generatePatternInsight(patterns, user?.spendingPersonality);
    if (patternNudge) {
      nudges.push(patternNudge);
    }
    
    return nudges;
  }
  
  private async checkDailySpendingLimit(userId: string, recentTransactions: any[]): Promise<{
    shouldNudge: boolean;
    severity: 'low' | 'medium' | 'high';
    message: string;
    dailyTotal: number;
    limit: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = recentTransactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= today;
    });
    
    const dailyTotal = todayTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    // Set daily limits based on spending personality
    const limits = {
      'Heavy Spender': 2000,
      'Medium Spender': 1500,
      'Max Saver': 800
    };
    
    const user = await User.findOne({ username: userId });
    const limit = limits[user?.spendingPersonality || 'Medium Spender'];
    
    if (dailyTotal > limit * 1.5) {
      return {
        shouldNudge: true,
        severity: 'high',
        message: `🚨 You've spent ₹${dailyTotal.toLocaleString()} today, which is significantly above your daily limit of ₹${limit.toLocaleString()}. Consider reducing non-essential spending.`,
        dailyTotal,
        limit
      };
    } else if (dailyTotal > limit) {
      return {
        shouldNudge: true,
        severity: 'medium',
        message: `⚠️ You've spent ₹${dailyTotal.toLocaleString()} today, which is above your daily limit of ₹${limit.toLocaleString()}. Try to stay within budget for the rest of the day.`,
        dailyTotal,
        limit
      };
    }
    
    return {
      shouldNudge: false,
      severity: 'low',
      message: '',
      dailyTotal,
      limit
    };
  }
  
  private checkCategoryOverspending(patterns: SpendingPattern[], personality?: string): NudgeTrigger[] {
    const nudges: NudgeTrigger[] = [];
    
    // Define category thresholds based on personality
    const thresholds = {
      'Heavy Spender': {
        'Food & Dining': 0.4,
        'Shopping': 0.3,
        'Entertainment': 0.25
      },
      'Medium Spender': {
        'Food & Dining': 0.35,
        'Shopping': 0.25,
        'Entertainment': 0.2
      },
      'Max Saver': {
        'Food & Dining': 0.3,
        'Shopping': 0.2,
        'Entertainment': 0.15
      }
    };
    
    const personalityThresholds = thresholds[personality as keyof typeof thresholds || 'Medium Spender'];
    
    patterns.forEach(pattern => {
      const threshold = personalityThresholds[pattern.category as keyof typeof personalityThresholds];
      if (threshold && pattern.percentageOfTotal > threshold * 100) {
        nudges.push({
          type: 'spending_pattern',
          severity: pattern.percentageOfTotal > threshold * 120 ? 'high' : 'medium',
          message: `📊 You're spending ${pattern.percentageOfTotal.toFixed(1)}% of your money on ${pattern.category}. This is above the recommended ${(threshold * 100).toFixed(0)}% for your spending personality.`,
          actionRequired: false,
          data: { category: pattern.category, percentage: pattern.percentageOfTotal, threshold: threshold * 100 }
        });
      }
    });
    
    return nudges;
  }
  
  private async checkSavingsGoals(userId: string, patterns: SpendingPattern[]): Promise<NudgeTrigger | null> {
    const totalSpent = patterns.reduce((sum, p) => sum + p.totalAmount, 0);
    const savingsRate = await this.calculateSavingsRate(userId);
    
    if (savingsRate < 0.2) { // Less than 20% savings rate
      return {
        type: 'savings_goal',
        severity: 'medium',
        message: `💰 Your current savings rate is ${(savingsRate * 100).toFixed(1)}%. Consider increasing your savings to at least 20% of your income for better financial security.`,
        actionRequired: true,
        data: { currentRate: savingsRate, targetRate: 0.2 }
      };
    }
    
    return null;
  }
  
  private generatePatternInsight(patterns: SpendingPattern[], personality?: string): NudgeTrigger | null {
    const topCategory = patterns[0];
    const secondCategory = patterns[1];
    
    if (!topCategory || !secondCategory) return null;
    
    const insights = {
      'Heavy Spender': {
        'Food & Dining': 'Consider meal prepping to reduce dining out costs.',
        'Shopping': 'Try implementing a 24-hour rule before making non-essential purchases.',
        'Entertainment': 'Look for free or low-cost entertainment alternatives.'
      },
      'Medium Spender': {
        'Food & Dining': 'Great balance! Consider setting a weekly dining budget.',
        'Shopping': 'Good spending control. Keep tracking your purchases.',
        'Entertainment': 'Well-managed entertainment spending. Keep it up!'
      },
      'Max Saver': {
        'Food & Dining': 'Excellent food spending! Consider treating yourself occasionally.',
        'Shopping': 'Impressive shopping discipline!',
        'Entertainment': 'Great entertainment budget management!'
      }
    };
    
    const personalityInsights = insights[personality as keyof typeof insights || 'Medium Spender'];
    const insight = personalityInsights[topCategory.category as keyof typeof personalityInsights];
    
    if (insight) {
      return {
        type: 'spending_pattern',
        severity: 'low',
        message: `💡 ${insight} Your top spending category is ${topCategory.category} (${topCategory.percentageOfTotal.toFixed(1)}% of total spending).`,
        actionRequired: false,
        data: { category: topCategory.category, percentage: topCategory.percentageOfTotal }
      };
    }
    
    return null;
  }
  
  private async calculateSavingsRate(userId: string): Promise<number> {
    // This is a simplified calculation - in a real app, you'd have income data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });
    
    const totalSpent = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    // Assume monthly income based on spending personality (simplified)
    const user = await User.findOne({ username: userId });
    const estimatedIncome = {
      'Heavy Spender': 80000,
      'Medium Spender': 60000,
      'Max Saver': 50000
    }[user?.spendingPersonality || 'Medium Spender'];
    
    const savings = estimatedIncome - totalSpent;
    return savings / estimatedIncome;
  }
  
  async saveNudge(userId: string, nudge: NudgeTrigger): Promise<void> {
    const newNudge = new Nudge({
      userId,
      type: nudge.type,
      severity: nudge.severity,
      message: nudge.message,
      actionRequired: nudge.actionRequired,
      data: nudge.data,
      isRead: false,
      createdAt: new Date()
    });
    
    await newNudge.save();
  }
  
  async markNudgeAsRead(nudgeId: string): Promise<void> {
    await Nudge.findByIdAndUpdate(nudgeId, { isRead: true });
  }
}

export default NudgeService.getInstance(); 