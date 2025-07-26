import Transaction from '../models/Transaction';
import User from '../models/User';
import Salary from '../models/Salary';
import { v4 as uuidv4 } from 'uuid';

export interface BudgetOptimization {
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  reasoning: string;
  confidence: number;
  potentialSavings: number;
}

export interface FinancialGoal {
  id: string;
  type: 'savings' | 'investment' | 'debt_payoff' | 'emergency_fund';
  name: string;
  targetAmount: number;
  currentAmount: number;
  timeline: number; // months
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  nextAction: string;
}

export interface PersonalizedInsight {
  id: string;
  category: 'spending_pattern' | 'savings_opportunity' | 'investment_advice' | 'risk_assessment';
  title: string;
  content: string;
  confidence: number;
  actionItems: string[];
  relatedTransactions: string[];
}

export interface FinancialEducation {
  id: string;
  topic: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relevance: number; // 0-100
  estimatedReadTime: number; // minutes
  tags: string[];
}

export class AdvancedAIService {
  
  /**
   * Generate AI-powered budget optimization recommendations
   */
  async generateBudgetOptimization(userId: string): Promise<BudgetOptimization[]> {
    try {
      const user = await User.findOne({ username: userId });
      const salaryRecord = await Salary.findOne({ userId });
      const salary = salaryRecord?.salary || 100000;
      
      // Get recent transactions (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const transactions = await Transaction.find({
        userId,
        date: { $gte: threeMonthsAgo }
      }).sort({ date: -1 });
      
      // Analyze spending patterns by category
      const categorySpending = transactions.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
      const monthlyAverage = totalSpent / 3;
      
      const optimizations: BudgetOptimization[] = [];
      
      // Generate recommendations for each category
      Object.entries(categorySpending).forEach(([category, spent]) => {
        const monthlySpent = spent / 3;
        const percentageOfSalary = (monthlySpent / salary) * 100;
        
        let recommendedBudget = monthlySpent;
        let reasoning = '';
        let confidence = 0.7;
        let potentialSavings = 0;
        
        // AI logic for budget optimization
        if (percentageOfSalary > 30) {
          // High spending category - recommend reduction
          recommendedBudget = monthlySpent * 0.8;
          reasoning = `High spending in ${category} (${percentageOfSalary.toFixed(1)}% of salary). Consider reducing by 20% to improve financial health.`;
          potentialSavings = monthlySpent - recommendedBudget;
          confidence = 0.9;
        } else if (percentageOfSalary > 15) {
          // Moderate spending - slight optimization
          recommendedBudget = monthlySpent * 0.9;
          reasoning = `Moderate spending in ${category}. Small reduction can help with savings goals.`;
          potentialSavings = monthlySpent - recommendedBudget;
          confidence = 0.8;
        } else {
          // Low spending - maintain or slightly increase
          recommendedBudget = monthlySpent * 1.1;
          reasoning = `Low spending in ${category}. You can afford to spend slightly more if needed.`;
          confidence = 0.6;
        }
        
        optimizations.push({
          category,
          currentBudget: monthlySpent,
          recommendedBudget: Math.round(recommendedBudget),
          reasoning,
          confidence,
          potentialSavings: Math.round(potentialSavings)
        });
      });
      
      return optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings);
      
    } catch (error) {
      console.error('Error generating budget optimization:', error);
      return [];
    }
  }
  
  /**
   * Generate personalized financial goals and recommendations
   */
  async generateFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    try {
      const user = await User.findOne({ username: userId });
      const salaryRecord = await Salary.findOne({ userId });
      const salary = salaryRecord?.salary || 100000;
      
      // Get recent transactions
      const recentTransactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(50);
      
      const totalSpent = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const monthlySpending = totalSpent / (recentTransactions.length > 0 ? recentTransactions.length / 30 : 1);
      
      const goals: FinancialGoal[] = [];
      
      // Emergency Fund Goal
      const emergencyFundTarget = salary * 0.06; // 6 months of salary
      goals.push({
        id: uuidv4(),
        type: 'emergency_fund',
        name: 'Emergency Fund',
        targetAmount: Math.round(emergencyFundTarget),
        currentAmount: 0, // Would need to track savings transactions
        timeline: 12,
        priority: 'high',
        recommendation: `Build an emergency fund of ₹${Math.round(emergencyFundTarget).toLocaleString()} (6 months of salary) for financial security.`,
        nextAction: 'Set up automatic monthly transfer of ₹' + Math.round(emergencyFundTarget / 12).toLocaleString()
      });
      
      // Savings Goal
      const savingsTarget = salary * 0.2; // 20% of salary
      goals.push({
        id: uuidv4(),
        type: 'savings',
        name: 'Monthly Savings',
        targetAmount: Math.round(savingsTarget),
        currentAmount: Math.max(0, salary - monthlySpending),
        timeline: 1,
        priority: 'high',
        recommendation: `Aim to save ₹${Math.round(savingsTarget).toLocaleString()} monthly (20% of salary) for long-term financial goals.`,
        nextAction: 'Review spending categories and identify areas to reduce by ₹' + Math.round(savingsTarget - (salary - monthlySpending)).toLocaleString()
      });
      
      // Investment Goal
      const investmentTarget = salary * 0.1; // 10% of salary
      goals.push({
        id: uuidv4(),
        type: 'investment',
        name: 'Investment Portfolio',
        targetAmount: Math.round(investmentTarget),
        currentAmount: 0,
        timeline: 6,
        priority: 'medium',
        recommendation: `Start investing ₹${Math.round(investmentTarget).toLocaleString()} monthly for wealth building and retirement planning.`,
        nextAction: 'Research index funds or mutual funds suitable for your risk profile'
      });
      
      return goals;
      
    } catch (error) {
      console.error('Error generating financial goals:', error);
      return [];
    }
  }
  
  /**
   * Generate personalized insights based on user behavior
   */
  async generatePersonalizedInsights(userId: string): Promise<PersonalizedInsight[]> {
    try {
      const user = await User.findOne({ username: userId });
      const recentTransactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(100);
      
      const insights: PersonalizedInsight[] = [];
      
      // Analyze spending patterns
      const categoryCounts = recentTransactions.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const highSpendCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (highSpendCategory && highSpendCategory[1] >= 5) {
        insights.push({
          id: uuidv4(),
          category: 'spending_pattern',
          title: 'High Frequency Spending Detected',
          content: `You make frequent purchases in ${highSpendCategory[0]} (${highSpendCategory[1]} transactions). Consider bulk buying or subscription services to save money.`,
          confidence: 0.85,
          actionItems: [
            'Review if all purchases are necessary',
            'Consider bulk buying for frequently purchased items',
            'Look for subscription alternatives'
          ],
          relatedTransactions: recentTransactions
            .filter(tx => tx.category === highSpendCategory[0])
            .slice(0, 5)
            .map(tx => (tx._id as any).toString())
        });
      }
      
      // Savings opportunity analysis
      const totalSpent = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const averageTransaction = totalSpent / recentTransactions.length;
      
      if (averageTransaction > 1000) {
        insights.push({
          id: uuidv4(),
          category: 'savings_opportunity',
          title: 'High Transaction Values',
          content: `Your average transaction is ₹${averageTransaction.toLocaleString()}. Consider breaking down large purchases or looking for better deals.`,
          confidence: 0.8,
          actionItems: [
            'Compare prices before making large purchases',
            'Consider installment options for expensive items',
            'Look for cashback or discount opportunities'
          ],
          relatedTransactions: recentTransactions
            .filter(tx => tx.amount > averageTransaction)
            .slice(0, 3)
            .map(tx => (tx._id as any).toString())
        });
      }
      
      return insights;
      
    } catch (error) {
      console.error('Error generating personalized insights:', error);
      return [];
    }
  }
  
  /**
   * Generate contextual financial education content
   */
  async generateFinancialEducation(userId: string): Promise<FinancialEducation[]> {
    try {
      const user = await User.findOne({ username: userId });
      const recentTransactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(20);
      
      const education: FinancialEducation[] = [];
      
      // Analyze user's financial situation to recommend relevant topics
      const totalSpent = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const categories = [...new Set(recentTransactions.map(tx => tx.category))];
      
      // Budgeting education
      if (categories.length > 3) {
        education.push({
          id: uuidv4(),
          topic: 'budgeting',
          title: 'Mastering Category-Based Budgeting',
          content: 'Learn how to create and maintain effective budgets across multiple spending categories. This guide will help you track expenses, set realistic limits, and achieve your financial goals.',
          difficulty: 'intermediate',
          relevance: 95,
          estimatedReadTime: 8,
          tags: ['budgeting', 'expense tracking', 'financial planning']
        });
      }
      
      // Savings education
      if (totalSpent > 50000) {
        education.push({
          id: uuidv4(),
          topic: 'savings',
          title: 'Building Your Emergency Fund',
          content: 'Discover the importance of emergency funds and learn strategies to build one. This essential financial safety net can protect you from unexpected expenses and financial stress.',
          difficulty: 'beginner',
          relevance: 90,
          estimatedReadTime: 6,
          tags: ['emergency fund', 'savings', 'financial security']
        });
      }
      
      // Investment education
      education.push({
        id: uuidv4(),
        topic: 'investment',
        title: 'Getting Started with Investments',
        content: 'Begin your investment journey with this comprehensive guide. Learn about different investment options, risk management, and how to start building wealth for your future.',
        difficulty: 'beginner',
        relevance: 85,
        estimatedReadTime: 10,
        tags: ['investing', 'wealth building', 'financial growth']
      });
      
      return education.sort((a, b) => b.relevance - a.relevance);
      
    } catch (error) {
      console.error('Error generating financial education:', error);
      return [];
    }
  }
}

export default new AdvancedAIService(); 