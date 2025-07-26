import { ITransaction } from '../models/Transaction'
import { IUser } from '../models/User'

interface PredictionResult {
  type: 'spending_prediction' | 'budget_forecast' | 'goal_tracking'
  message: string
  confidence: number
  predictedAmount?: number
  currentAmount?: number
  targetAmount?: number
  percentage?: number
}

interface SpendingPattern {
  dailyAverage: number
  weeklyAverage: number
  monthlyAverage: number
  weekendSpending: number
  weekdaySpending: number
  categoryTrends: { [category: string]: number }
}

export class PredictiveAnalyticsService {
  
  /**
   * Analyze spending patterns from transaction history
   */
  private analyzeSpendingPatterns(transactions: ITransaction[]): SpendingPattern {
    if (transactions.length === 0) {
      return {
        dailyAverage: 0,
        weeklyAverage: 0,
        monthlyAverage: 0,
        weekendSpending: 0,
        weekdaySpending: 0,
        categoryTrends: {}
      }
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Filter transactions from last 30 days
    const recentTransactions = transactions.filter(tx => 
      new Date(tx.date) >= thirtyDaysAgo
    )

    const totalAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const dailyAverage = totalAmount / 30
    const weeklyAverage = dailyAverage * 7
    const monthlyAverage = dailyAverage * 30

    // Analyze weekend vs weekday spending
    const weekendTransactions = recentTransactions.filter(tx => {
      const day = new Date(tx.date).getDay()
      return day === 0 || day === 6 // Sunday or Saturday
    })
    const weekdayTransactions = recentTransactions.filter(tx => {
      const day = new Date(tx.date).getDay()
      return day >= 1 && day <= 5 // Monday to Friday
    })

    const weekendSpending = weekendTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const weekdaySpending = weekdayTransactions.reduce((sum, tx) => sum + tx.amount, 0)

    // Analyze category trends
    const categoryTotals: { [category: string]: number } = {}
    recentTransactions.forEach(tx => {
      const category = tx.category.toLowerCase()
      categoryTotals[category] = (categoryTotals[category] || 0) + tx.amount
    })

    return {
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      weekendSpending,
      weekdaySpending,
      categoryTrends: categoryTotals
    }
  }

  /**
   * Predict monthly spending based on current patterns
   */
  private predictMonthlySpending(transactions: ITransaction[]): number {
    const patterns = this.analyzeSpendingPatterns(transactions)
    
    // Calculate trend (simple linear regression)
    const recentTransactions = transactions.slice(-10) // Last 10 transactions
    if (recentTransactions.length < 5) {
      return patterns.monthlyAverage
    }

    // Calculate if spending is increasing or decreasing
    const firstHalf = recentTransactions.slice(0, Math.floor(recentTransactions.length / 2))
    const secondHalf = recentTransactions.slice(Math.floor(recentTransactions.length / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum, tx) => sum + tx.amount, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, tx) => sum + tx.amount, 0) / secondHalf.length
    
    const trend = secondHalfAvg - firstHalfAvg
    const trendAdjustment = trend * 0.3 // Apply 30% of the trend

    return Math.max(0, patterns.monthlyAverage + trendAdjustment)
  }

  /**
   * Forecast budget overrun based on current spending
   */
  private forecastBudgetOverrun(
    transactions: ITransaction[], 
    user: IUser, 
    category: string
  ): { willOverrun: boolean; overrunAmount: number; percentage: number } {
    const patterns = this.analyzeSpendingPatterns(transactions)
    
    // Get budget cap for category
    const budgetCaps: { [key: string]: { [category: string]: number } } = {
      'Heavy Spender': {
        'Dining': 8000,
        'Shopping': 15000,
        'Entertainment': 12000,
        'Transport': 6000,
        'Healthcare': 4000,
        'Education': 8000
      },
      'Medium Spender': {
        'Dining': 5000,
        'Shopping': 8000,
        'Entertainment': 6000,
        'Transport': 4000,
        'Healthcare': 3000,
        'Education': 5000
      },
      'Max Saver': {
        'Dining': 3000,
        'Shopping': 4000,
        'Entertainment': 3000,
        'Transport': 2500,
        'Healthcare': 2000,
        'Education': 3000
      }
    }

    const userBudgetCaps = budgetCaps[user.spendingPersonality] || budgetCaps['Medium Spender']
    const budgetCap = userBudgetCaps[category] || 5000

    // Calculate current spending in this category
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const categoryTransactions = transactions.filter(tx => 
      tx.category.toLowerCase() === category.toLowerCase() &&
      new Date(tx.date) >= monthStart
    )
    
    const currentSpending = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    
    // Predict remaining spending for the month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysRemaining = daysInMonth - now.getDate()
    const dailyCategoryAverage = patterns.categoryTrends[category.toLowerCase()] / 30 || 0
    const predictedRemaining = dailyCategoryAverage * daysRemaining
    
    const totalPredicted = currentSpending + predictedRemaining
    const overrunAmount = Math.max(0, totalPredicted - budgetCap)
    const percentage = (totalPredicted / budgetCap) * 100

    return {
      willOverrun: totalPredicted > budgetCap,
      overrunAmount,
      percentage
    }
  }

  /**
   * Track progress towards savings goal
   */
  private async trackSavingsGoal(transactions: ITransaction[], user: IUser): Promise<{ 
    currentSavings: number; 
    targetSavings: number; 
    percentage: number; 
    onTrack: boolean 
  }> {
    // Calculate current savings from transactions
    const savingsTransactions = transactions.filter(tx => 
      tx.category.toLowerCase() === 'savings'
    )
    const currentSavings = savingsTransactions.reduce((sum, tx) => sum + tx.amount, 0)

    // Get user's actual salary from database
    const Salary = require('../models/Salary').default;
    const salaryRecord = await Salary.findOne({ userId: user.username }).sort({ createdAt: -1 });
    const salary = salaryRecord?.salary || 100000; // Default fallback

    // Get user's actual savings budget cap from database
    const Budget = require('../models/Budget').default;
    const savingsBudget = await Budget.findOne({ 
      userId: user.username, 
      category: 'Savings' 
    }).sort({ updatedAt: -1 });

    // Use the actual budget cap if available, otherwise fall back to percentage-based calculation
    let targetSavings: number;
    if (savingsBudget) {
      targetSavings = savingsBudget.budgetCap;
    } else {
      // Fallback to percentage-based calculation (old logic)
      const salaryTargets: { [key: string]: number } = {
        'Heavy Spender': 0.05, // 5% of salary
        'Medium Spender': 0.20, // 20% of salary
        'Max Saver': 0.40 // 40% of salary
      }
      const targetPercentage = salaryTargets[user.spendingPersonality] || 0.20
      targetSavings = salary * targetPercentage
    }

    const percentage = (currentSavings / targetSavings) * 100
    const onTrack = percentage >= 60 // Consider on track if 60% or more

    return {
      currentSavings,
      targetSavings,
      percentage,
      onTrack
    }
  }

  /**
   * Generate predictive insights for a user
   */
  async generatePredictiveInsights(user: IUser, transactions: ITransaction[]): Promise<PredictionResult[]> {
    const insights: PredictionResult[] = []

    // 1. Spending Prediction
    const predictedMonthlySpending = this.predictMonthlySpending(transactions)
    const patterns = this.analyzeSpendingPatterns(transactions)
    const currentMonthlySpending = patterns.monthlyAverage

    if (predictedMonthlySpending > currentMonthlySpending * 1.1) {
      insights.push({
        type: 'spending_prediction',
        message: `You're likely to spend ₹${Math.round(predictedMonthlySpending - currentMonthlySpending)} more this month based on your current spending trend.`,
        confidence: 0.75,
        predictedAmount: predictedMonthlySpending,
        currentAmount: currentMonthlySpending
      })
    }

    // 2. Budget Forecasting for top spending categories
    const topCategories = Object.entries(patterns.categoryTrends)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    for (const [category, amount] of topCategories) {
      const forecast = this.forecastBudgetOverrun(transactions, user, category)
      if (forecast.willOverrun) {
        insights.push({
          type: 'budget_forecast',
          message: `At this rate, you'll exceed your ${category} budget by ₹${Math.round(forecast.overrunAmount)} (${forecast.percentage.toFixed(1)}% of budget).`,
          confidence: 0.8,
          predictedAmount: forecast.overrunAmount,
          percentage: forecast.percentage
        })
      }
    }

    // 3. Goal Tracking
    const savingsGoal = await this.trackSavingsGoal(transactions, user)
    insights.push({
      type: 'goal_tracking',
      message: `You're ${savingsGoal.percentage.toFixed(0)}% towards your savings goal (₹${Math.round(savingsGoal.currentSavings)} of ₹${Math.round(savingsGoal.targetSavings)}).`,
      confidence: 0.9,
      currentAmount: savingsGoal.currentSavings,
      targetAmount: savingsGoal.targetSavings,
      percentage: savingsGoal.percentage
    })

    return insights
  }

  /**
   * Get spending patterns for external use
   */
  getSpendingPatterns(transactions: ITransaction[]): SpendingPattern {
    return this.analyzeSpendingPatterns(transactions)
  }
}

export default new PredictiveAnalyticsService() 