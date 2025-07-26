import Transaction from '../models/Transaction';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export interface SpendingTrend {
  period: string;
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  averageTransaction: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FinancialHealthScore {
  overall: number;
  spending: number;
  savings: number;
  budgeting: number;
  recommendations: string[];
}

export interface MoodSpendCorrelation {
  dayOfWeek: string;
  averageSpend: number;
  moodIndicator: string;
  correlation: number;
}

export interface PredictivePattern {
  category: string;
  predictedSpend: number;
  confidence: number;
  nextOccurrence: Date;
  recommendation: string;
}

export class AdvancedAnalyticsService {
  
  /**
   * Generate comprehensive spending trends analysis
   */
  async generateSpendingTrends(userId: string, months: number = 3): Promise<SpendingTrend[]> {
    const trends: SpendingTrend[] = [];
    
    try {
      // Get transactions for the specified period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const transactions = await Transaction.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      
      // Group by month
      const monthlyData = new Map<string, any[]>();
      
      transactions.forEach(tx => {
        const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, []);
        }
        monthlyData.get(monthKey)!.push(tx);
      });
      
      // Calculate trends for each month
      const monthsArray = Array.from(monthlyData.keys()).sort();
      
      for (let i = 0; i < monthsArray.length; i++) {
        const month = monthsArray[i];
        const monthTransactions = monthlyData.get(month)!;
        
        const totalSpent = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const categoryBreakdown = monthTransactions.reduce((acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        }, {} as Record<string, number>);
        
        const averageTransaction = totalSpent / monthTransactions.length;
        
        // Determine trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (i > 0) {
          const prevMonth = monthsArray[i - 1];
          const prevTransactions = monthlyData.get(prevMonth)!;
          const prevTotal = prevTransactions.reduce((sum, tx) => sum + tx.amount, 0);
          
          if (totalSpent > prevTotal * 1.1) trend = 'increasing';
          else if (totalSpent < prevTotal * 0.9) trend = 'decreasing';
        }
        
        trends.push({
          period: month,
          totalSpent,
          categoryBreakdown,
          averageTransaction,
          trend
        });
      }
      
    } catch (error) {
      console.error('Error generating spending trends:', error);
    }
    
    return trends;
  }
  
  /**
   * Calculate comprehensive financial health score
   */
  async calculateFinancialHealthScore(userId: string): Promise<FinancialHealthScore> {
    try {
      const user = await User.findOne({ username: userId });
      if (!user) throw new Error('User not found');
      
      // Get recent transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      const transactions = await Transaction.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      });
      
      const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const averageSpend = totalSpent / transactions.length;
      
      // Calculate spending score (lower is better)
      const spendingScore = Math.max(0, 100 - (totalSpent / 50000) * 100);
      
      // Calculate savings score (assuming 20% savings target)
      const estimatedIncome = 100000; // Default, should come from user profile
      const savingsTarget = estimatedIncome * 0.2;
      const actualSavings = estimatedIncome - totalSpent;
      const savingsScore = Math.min(100, (actualSavings / savingsTarget) * 100);
      
      // Calculate budgeting score based on category distribution
      const categorySpending = transactions.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const categoryCount = Object.keys(categorySpending).length;
      const budgetingScore = Math.min(100, categoryCount * 10);
      
      // Overall score
      const overall = Math.round((spendingScore + savingsScore + budgetingScore) / 3);
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (spendingScore < 50) recommendations.push('Consider reducing overall spending');
      if (savingsScore < 50) recommendations.push('Focus on increasing savings');
      if (budgetingScore < 50) recommendations.push('Create a detailed budget plan');
      
      return {
        overall,
        spending: Math.round(spendingScore),
        savings: Math.round(savingsScore),
        budgeting: Math.round(budgetingScore),
        recommendations
      };
      
    } catch (error) {
      console.error('Error calculating financial health score:', error);
      return {
        overall: 50,
        spending: 50,
        savings: 50,
        budgeting: 50,
        recommendations: ['Unable to calculate score at this time']
      };
    }
  }
  
  /**
   * Analyze mood-spend correlation patterns
   */
  async analyzeMoodSpendCorrelation(userId: string): Promise<MoodSpendCorrelation[]> {
    const correlations: MoodSpendCorrelation[] = [];
    
    try {
      const transactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(100);
      
      // Group by day of week
      const dayOfWeekData = new Map<string, number[]>();
      
      transactions.forEach(tx => {
        const dayOfWeek = tx.date.toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayOfWeekData.has(dayOfWeek)) {
          dayOfWeekData.set(dayOfWeek, []);
        }
        dayOfWeekData.get(dayOfWeek)!.push(tx.amount);
      });
      
      // Calculate correlations for each day
      dayOfWeekData.forEach((amounts, day) => {
        const averageSpend = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        
        // Simple mood indicator based on spending patterns
        let moodIndicator = 'neutral';
        if (averageSpend > 2000) moodIndicator = 'high_spending';
        else if (averageSpend < 500) moodIndicator = 'low_spending';
        
        // Calculate correlation (simplified)
        const correlation = Math.min(1, averageSpend / 3000);
        
        correlations.push({
          dayOfWeek: day,
          averageSpend,
          moodIndicator,
          correlation
        });
      });
      
    } catch (error) {
      console.error('Error analyzing mood-spend correlation:', error);
    }
    
    return correlations;
  }
  
  /**
   * Generate predictive spending patterns
   */
  async generatePredictivePatterns(userId: string): Promise<PredictivePattern[]> {
    const patterns: PredictivePattern[] = [];
    
    try {
      const transactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(50);
      
      // Group by category
      const categoryData = new Map<string, any[]>();
      
      transactions.forEach(tx => {
        if (!categoryData.has(tx.category)) {
          categoryData.set(tx.category, []);
        }
        categoryData.get(tx.category)!.push(tx);
      });
      
      // Generate predictions for each category
      categoryData.forEach((txs, category) => {
        if (txs.length < 3) return; // Need at least 3 transactions for prediction
        
        const amounts = txs.map(tx => tx.amount);
        const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        
        // Simple prediction: next amount will be similar to average
        const predictedSpend = averageAmount * (0.8 + Math.random() * 0.4); // ±20% variation
        
        // Calculate confidence based on consistency
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - averageAmount, 2), 0) / amounts.length;
        const confidence = Math.max(0.3, 1 - (variance / (averageAmount * averageAmount)));
        
        // Predict next occurrence (simple: within next 7 days)
        const nextOccurrence = new Date();
        nextOccurrence.setDate(nextOccurrence.getDate() + Math.floor(Math.random() * 7) + 1);
        
        // Generate recommendation
        let recommendation = 'Consider this spending pattern';
        if (predictedSpend > 2000) {
          recommendation = 'High spending predicted - consider alternatives';
        } else if (predictedSpend < 500) {
          recommendation = 'Low spending predicted - good for savings';
        }
        
        patterns.push({
          category,
          predictedSpend: Math.round(predictedSpend),
          confidence: Math.round(confidence * 100),
          nextOccurrence,
          recommendation
        });
      });
      
    } catch (error) {
      console.error('Error generating predictive patterns:', error);
    }
    
    return patterns;
  }
  
  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(userId: string): Promise<any> {
    try {
      const [trends, healthScore, correlations, predictions] = await Promise.all([
        this.generateSpendingTrends(userId),
        this.calculateFinancialHealthScore(userId),
        this.analyzeMoodSpendCorrelation(userId),
        this.generatePredictivePatterns(userId)
      ]);
      
      return {
        userId,
        reportId: `report_${uuidv4()}`,
        generatedAt: new Date(),
        trends,
        healthScore,
        correlations,
        predictions,
        summary: {
          totalTrends: trends.length,
          healthScore: healthScore.overall,
          correlationInsights: correlations.length,
          predictions: predictions.length
        }
      };
      
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }
}

export default new AdvancedAnalyticsService(); 