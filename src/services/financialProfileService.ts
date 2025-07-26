import Transaction from '../models/Transaction';
import User from '../models/User';
import { getDefaultEMI, getDefaultSalary, getBudgetForPersona } from '../utils/budgetData';
import { PersonaTransaction } from './transactionService';

export interface FinancialMetrics {
  salary: number;
  emi: number;
  savings: number;
  netSpend: number;
  totalSpent: number;
  budgetOverview: Array<{
    category: string;
    amount: number;
    budgetCap: number;
    percentage: number;
    isOverBudget: boolean;
  }>;
}

export interface SpendingPattern {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export class FinancialProfileService {
  private static instance: FinancialProfileService;
  
  private constructor() {}
  
  public static getInstance(): FinancialProfileService {
    if (!FinancialProfileService.instance) {
      FinancialProfileService.instance = new FinancialProfileService();
    }
    return FinancialProfileService.instance;
  }

  async calculateFinancialMetrics(userId: string): Promise<FinancialMetrics> {
    const user = await User.findOne({ username: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Use current date instead of hardcoded dates
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();
    
    // Calculate date range: Start of current month to today
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;
    


    // Get user's transactions from database (up to current date)
    const dbTransactions = await Transaction.find({ 
      userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    // Get persona-based transaction data (up to current date) with category normalization
    const personaMapping: { [key: string]: string } = {
      'Heavy Spender': 'heavy',
      'Medium Spender': 'medium',
      'Max Saver': 'max'
    }
    
    const personaType = personaMapping[user.spendingPersonality] || 'medium'
    const transactionService = require('./transactionService').default;
    const personaTransactions = transactionService.getTransactionsByDateRangeAndCategory(personaType, startDate, endDate, user.spendingPersonality);
    
    // Combine database and persona transactions
    const allTransactions = [...dbTransactions, ...personaTransactions];
    
    // Calculate total spent from all transactions (excluding savings)
    const totalSpent = allTransactions
      .filter(txn => txn.category.toLowerCase() !== 'savings')
      .reduce((sum, txn) => sum + txn.amount, 0);
    
    // Calculate savings from savings category transactions
    const savings = allTransactions
      .filter(txn => txn.category.toLowerCase() === 'savings')
      .reduce((sum, txn) => sum + txn.amount, 0);

    // Get user's actual salary from database
    const Salary = require('../models/Salary').default;
    const salaryRecord = await Salary.findOne({ userId }).sort({ createdAt: -1 });
    const salary = salaryRecord?.salary || getDefaultSalary();
    
    console.log('🔍 FINANCIAL METRICS DEBUG: User ID:', userId);
    console.log('🔍 FINANCIAL METRICS DEBUG: Salary record found:', !!salaryRecord);
    console.log('🔍 FINANCIAL METRICS DEBUG: Salary being used:', salary);
    console.log('🔍 FINANCIAL METRICS DEBUG: Total spent (excluding savings):', totalSpent);
    console.log('🔍 FINANCIAL METRICS DEBUG: Savings from transactions:', savings);
    
    const emi = getDefaultEMI(user.spendingPersonality);

    // Calculate net spend (salary - emi - savings)
    const netSpend = salary - emi - savings;

    // Get budget overview
    const budgetOverview = await this.calculateBudgetOverview(userId, user.spendingPersonality);

    return {
      salary,
      emi,
      savings,
      netSpend,
      totalSpent,
      budgetOverview
    };
  }

  async calculateBudgetOverview(userId: string, persona: string): Promise<FinancialMetrics['budgetOverview']> {
    // Get user's custom budget caps from database
    const Budget = require('../models/Budget').default;
    const userBudgets = await Budget.find({ userId });
    
    // Get default budget caps for the persona
    const budgetData = getBudgetForPersona(persona);
    if (!budgetData) {
      return [];
    }

    // Merge custom budgets with defaults
    const budgetCaps: { [category: string]: number } = {};
    
    // Start with default caps
    budgetData.categories.forEach(cat => {
      budgetCaps[cat.category] = cat.budgetCap;
    });
    
    // Override with user's custom caps
    userBudgets.forEach((budget: any) => {
      budgetCaps[budget.category] = budget.budgetCap;
    });

    // Use current date instead of hardcoded dates
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();
    
    // Calculate date range: Start of current month to today
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;

    // Get user's transactions from database (up to current date)
    const dbMonthlyTransactions = await Transaction.find({
      userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    // Get persona-based transaction data (up to current date) with category normalization
    const personaMapping: { [key: string]: string } = {
      'Heavy Spender': 'heavy',
      'Medium Spender': 'medium',
      'Max Saver': 'max'
    }
    
    const personaType = personaMapping[persona] || 'medium'
    const transactionService = require('./transactionService').default;
    const personaTransactions = transactionService.getTransactionsByDateRangeAndCategory(personaType, startDate, endDate, persona);
    
    // Combine database and persona transactions
    const allTransactions = [...dbMonthlyTransactions, ...personaTransactions];

    // Calculate actual spending by category
    const categorySpending = new Map<string, number>();
    allTransactions.forEach(txn => {
      // Categories are already normalized by getTransactionsByDateRangeAndCategory
      const category = txn.category;
      const current = categorySpending.get(category) || 0;
      categorySpending.set(category, current + txn.amount);
    });
    
    // Create budget overview using merged budget caps
    const budgetOverview = Object.entries(budgetCaps).map(([category, budgetCap]) => {
      const actualAmount = categorySpending.get(category) || 0;
      const percentage = (actualAmount / budgetCap) * 100;
      const isOverBudget = actualAmount > budgetCap;

      return {
        category: category,
        amount: actualAmount,
        budgetCap: budgetCap,
        percentage: Math.round(percentage * 100) / 100,
        isOverBudget
      };
    });
    
    return budgetOverview;
  }

  async analyzeSpendingPatterns(userId: string, days: number = 30): Promise<SpendingPattern[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate }
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

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalAmount: data.total,
        transactionCount: data.count,
        averageAmount: data.total / data.count,
        percentageOfTotal: (data.total / totalSpent) * 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getWeeklySpending(userId: string): Promise<Array<{ date: string; amount: number }>> {
    try {
      const user = await User.findOne({ username: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Map user persona to transaction service persona type
      const personaMapping: { [key: string]: string } = {
        'Heavy Spender': 'heavy',
        'Medium Spender': 'medium',
        'Max Saver': 'max'
      }
      
      const personaType = personaMapping[user.spendingPersonality] || 'medium'
      
      // Use transaction service for consistent weekly spending logic
      const transactionService = require('./transactionService').default;
      const weeklyData = transactionService.getWeeklyTransactions(personaType);
      
      // Convert to array format expected by frontend
      return Object.entries(weeklyData)
        .map(([date, amount]) => ({ date, amount: amount as number }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting weekly spending:', error);
      return [];
    }
  }

  async detectSavingsTransactions(userId: string): Promise<number> {
    const savingsKeywords = ['savings', 'fd', 'sip', 'investment', 'mutual fund', 'ppf'];
    
    const transactions = await Transaction.find({ userId });
    
    return transactions
      .filter(txn => {
        const merchant = txn.merchant.toLowerCase();
        const category = txn.category.toLowerCase();
        return savingsKeywords.some(keyword => 
          merchant.includes(keyword) || category.includes(keyword)
        );
      })
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  async getFinancialInsights(userId: string): Promise<Array<{
    type: 'warning' | 'info' | 'success' | 'tip';
    icon: string;
    bgColor: string;
    textColor: string;
    iconColor: string;
    message: string;
    hasButton: boolean;
    buttonText?: string;
  }>> {
    try {
      const user = await User.findOne({ username: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const metrics = await this.calculateFinancialMetrics(userId);
      
      // Map user persona to transaction service persona type
      const personaMapping: { [key: string]: string } = {
        'Heavy Spender': 'heavy',
        'Medium Spender': 'medium',
        'Max Saver': 'max'
      }
      
      const personaType = personaMapping[user.spendingPersonality] || 'medium'
      
      // Import transaction service
      const transactionService = require('./transactionService').default;
      const transactionStats = transactionService.getTransactionStats(personaType, 30);
      const latestTransactions: PersonaTransaction[] = transactionService.getLatestTransactions(personaType, 10);
      
      const insights: any[] = [];

      // Personality-based insights
      if (user.spendingPersonality === 'Heavy Spender') {
        if (metrics.savings < 10000) {
          insights.push({
            type: 'warning',
            icon: '⚠️',
            bgColor: 'bg-[#FEF2F2]',
            textColor: 'text-[#991B1B]',
            iconColor: 'text-[#EF4444]',
            message: `Your savings (₹${metrics.savings.toLocaleString()}) are quite low. Consider reducing non-essential spending.`,
            hasButton: true,
            buttonText: 'Get Tips'
          });
        }
      } else if (user.spendingPersonality === 'Medium Spender') {
        if (metrics.savings > 15000) {
          insights.push({
            type: 'success',
            icon: '✅',
            bgColor: 'bg-[#ECFDF5]',
            textColor: 'text-[#065F46]',
            iconColor: 'text-[#10B981]',
            message: `Great job! You've saved ₹${metrics.savings.toLocaleString()} this month.`,
            hasButton: false
          });
        }
      } else { // Max Saver
        if (metrics.savings > 30000) {
          insights.push({
            type: 'success',
            icon: '🏦',
            bgColor: 'bg-[#ECFDF5]',
            textColor: 'text-[#065F46]',
            iconColor: 'text-[#10B981]',
            message: `Excellent! You're saving ₹${metrics.savings.toLocaleString()} (${Math.round((metrics.savings / metrics.salary) * 100)}% of income).`,
            hasButton: false
          });
        }
      }

      // Transaction-based insights
      if (latestTransactions.length > 0) {
        const totalSpent = transactionStats.totalAmount;
        const averageTransaction = transactionStats.averageAmount;

        if (averageTransaction > 2000) {
          insights.push({
            type: 'warning',
            icon: '💸',
            bgColor: 'bg-[#FEF2F2]',
            textColor: 'text-[#991B1B]',
            iconColor: 'text-[#EF4444]',
            message: `Your average transaction is ₹${Math.round(averageTransaction).toLocaleString()}. Consider smaller, planned purchases.`,
            hasButton: true,
            buttonText: 'Get Tips'
          });
        }

        // Category analysis using transaction stats
        if (transactionStats.topCategories.length > 0) {
          const topCategory = transactionStats.topCategories[0];
          if (topCategory.amount > totalSpent * 0.3) {
            insights.push({
              type: 'info',
              icon: '📊',
              bgColor: 'bg-[#EFF6FF]',
              textColor: 'text-[#1E3A8A]',
              iconColor: 'text-[#3B82F6]',
              message: `${topCategory.category} is your highest spending category (₹${topCategory.amount.toLocaleString()}).`,
              hasButton: false
            });
          }
        }

        // Recent transaction insights
        if (latestTransactions.length >= 3) {
          const recentTotal = latestTransactions.slice(0, 3).reduce((sum: number, tx: PersonaTransaction) => sum + tx.amount, 0);
          if (recentTotal > 10000) {
            insights.push({
              type: 'warning',
              icon: '⚡',
              bgColor: 'bg-[#FEF2F2]',
              textColor: 'text-[#991B1B]',
              iconColor: 'text-[#EF4444]',
              message: `High recent spending detected (₹${recentTotal.toLocaleString()} in last 3 transactions).`,
              hasButton: true,
              buttonText: 'Get Tips'
            });
          }
        }
      }

      // Budget overspend insights
      const budgetOverview = await this.calculateBudgetOverview(userId, user.spendingPersonality);
      const overBudgetCategories = budgetOverview.filter(cat => cat.isOverBudget);
      
      if (overBudgetCategories.length > 0) {
        insights.push({
          type: 'warning',
          icon: '🚨',
          bgColor: 'bg-[#FEF2F2]',
          textColor: 'text-[#991B1B]',
          iconColor: 'text-[#EF4444]',
          message: `You're over budget in ${overBudgetCategories.length} category(ies). Review your spending.`,
          hasButton: true,
          buttonText: 'Get Tips'
        });
      }

      return insights.slice(0, 3); // Return max 3 insights
    } catch (error) {
      console.error('Error getting financial insights:', error);
      throw error;
    }
  }
}

export default FinancialProfileService.getInstance(); 