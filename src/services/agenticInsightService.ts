import AIInsight, { IAIInsight } from '../models/AIInsight';
import { getBudgetForPersona } from '../utils/budgetData';
import { v4 as uuidv4 } from 'uuid';
import predictiveAnalyticsService from './predictiveAnalyticsService';
import userBehaviorService from './userBehaviorService';

export interface TransactionData {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  paymentMethod: string;
}

export interface UserProfile {
  userId: string;
  userType: string;
  spendingPersonality: string;
  salary: number;
}

export interface InsightTemplate {
  type: IAIInsight['type'];
  priority: IAIInsight['priority'];
  title: string;
  content: string;
  conditions: (transactions: TransactionData[], userProfile: UserProfile) => boolean;
  generateContent: (transactions: TransactionData[], userProfile: UserProfile) => string | Promise<string>;
}

export class AgenticInsightService {
  private insightTemplates: InsightTemplate[] = [];

  constructor() {
    this.initializeInsightTemplates();
  }

  private initializeInsightTemplates() {
    this.insightTemplates = [
      // Budget Overrun Insight
      {
        type: 'budget_overrun',
        priority: 'critical',
        title: 'Budget Limit Exceeded',
        content: 'Budget Alert: You\'ve exceeded limits in multiple categories.',
        conditions: (transactions, userProfile) => {
          // Always trigger this insight to show budget status
          return true;
        },
        generateContent: async (transactions, userProfile) => {
          const budgetData = await this.getBudgetDataForUser(userProfile.spendingPersonality, userProfile.userId);
          if (!budgetData) return 'Unable to analyze budget status.';
          
          // Calculate spending by category
          const categorySpending = transactions.reduce((acc, t) => {
            const normalizedCategory = this.normalizeCategory(t.category, userProfile.spendingPersonality);
            acc[normalizedCategory] = (acc[normalizedCategory] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

          // Find over-budget categories
          const overBudgetCategories: string[] = [];
          Object.entries(budgetData).forEach(([category, { budgetCap }]) => {
            const spent = categorySpending[category] || 0;
            if (spent > budgetCap) {
              const overrun = spent - budgetCap;
              const percentage = budgetCap > 0 ? (overrun / budgetCap) * 100 : Infinity;
              overBudgetCategories.push(`${category} (₹${overrun.toLocaleString()} over, ${percentage.toFixed(1)}% of budget)`);
            }
          });

          if (overBudgetCategories.length === 0) {
            return 'Great job! You\'re staying within your budget limits.';
          }

          return `Budget Alert: You've exceeded limits in ${overBudgetCategories.join(', ')}. Consider reducing spending in these categories for the rest of the month.`;
        }
      },

      // Burn Risk Alerts
      {
        type: 'burn_risk',
        priority: 'critical',
        title: 'High Burn Risk Detected',
        content: 'You\'ve made multiple similar transactions recently',
        conditions: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          const categoryCounts = recentTransactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          return Object.values(categoryCounts).some(count => count >= 3);
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          const categoryCounts = recentTransactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const highCountCategory = Object.entries(categoryCounts)
            .find(([_, count]) => count >= 3);
          
          if (highCountCategory) {
            return `You've made ${highCountCategory[1]} transactions in ${highCountCategory[0]} this week. Consider setting a daily limit to avoid overspending.`;
          }
          return 'Multiple similar transactions detected. Review your spending patterns.';
        }
      },

      // Savings Opportunities
      {
        type: 'savings_opportunity',
        priority: 'tip',
        title: 'Savings Opportunity',
        content: 'Great opportunity to save money',
        conditions: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          );
          const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
          return totalSpent < userProfile.salary * 0.1; // Less than 10% of salary in 3 days
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          );
          const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
          const potentialSavings = userProfile.salary * 0.2 - totalSpent;
          
          return `You've spent ₹${totalSpent.toLocaleString()} in the last 3 days. You could save ₹${potentialSavings.toLocaleString()} this month by maintaining this controlled spending pattern!`;
        }
      },

      // Pattern Recognition
      {
        type: 'pattern',
        priority: 'warning',
        title: 'Spending Pattern Detected',
        content: 'We noticed a recurring spending pattern',
        conditions: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          );
          
          // Check for same day of week patterns
          const dayOfWeekCounts = recentTransactions.reduce((acc, t) => {
            const day = new Date(t.date).getDay();
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);
          
          return Object.values(dayOfWeekCounts).some(count => count >= 2);
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          );
          
          const dayOfWeekCounts = recentTransactions.reduce((acc, t) => {
            const day = new Date(t.date).getDay();
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);
          
          const patternDay = Object.entries(dayOfWeekCounts)
            .find(([_, count]) => count >= 2);
          
          if (patternDay) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `You tend to spend more on ${dayNames[parseInt(patternDay[0])]}s. Consider planning your purchases to avoid impulse spending.`;
          }
          
          return 'We detected a recurring spending pattern. Review your habits.';
        }
      },

      // Goal Progress
      {
        type: 'goal',
        priority: 'info',
        title: 'Goal Progress Update',
        content: 'Track your financial goals',
        conditions: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          const savingsTransactions = recentTransactions.filter(t => 
            t.category.toLowerCase().includes('savings') || 
            t.merchant.toLowerCase().includes('savings')
          );
          return savingsTransactions.length > 0;
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          const savingsTransactions = recentTransactions.filter(t => 
            t.category.toLowerCase().includes('savings') || 
            t.merchant.toLowerCase().includes('savings')
          );
          const totalSavings = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          return `Great job! You've saved ₹${totalSavings.toLocaleString()} this week. Keep up the momentum towards your financial goals!`;
        }
      },



      // User Type Specific Insights
      {
        type: 'tip',
        priority: 'tip',
        title: 'Personalized Tip',
        content: 'Customized advice for your spending personality',
        conditions: (transactions, userProfile) => {
          return userProfile.spendingPersonality === 'Heavy Spender';
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          if (userProfile.spendingPersonality === 'Heavy Spender') {
            return `As a Heavy Spender, you've spent ₹${totalSpent.toLocaleString()} this week. Consider setting up automatic savings transfers to balance your spending habits.`;
          } else if (userProfile.spendingPersonality === 'Max Saver') {
            return `Excellent saving behavior! You've maintained your Max Saver habits. Consider treating yourself occasionally while staying on track.`;
          } else {
            return `You're maintaining a good balance between spending and saving. Keep up the moderate approach!`;
          }
        }
      },

      // Proactive Action Insights
      {
        type: 'proactive_action',
        priority: 'tip',
        title: 'Proactive Financial Action',
        content: 'Take action before issues arise',
        conditions: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          );
          const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
          const dailyAverage = totalSpent / 5;
          const monthlyProjection = dailyAverage * 30;
          
          // Trigger if spending is moderate to high (between 15-80% of salary)
          return monthlyProjection > userProfile.salary * 0.15 && monthlyProjection < userProfile.salary * 0.8;
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          );
          const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
          const dailyAverage = totalSpent / 5;
          const monthlyProjection = dailyAverage * 30;
          const percentageOfSalary = ((monthlyProjection / userProfile.salary) * 100).toFixed(1);
          
          return `Your current spending rate projects to ₹${monthlyProjection.toLocaleString()} this month (${percentageOfSalary}% of salary). Consider setting up automatic savings now to stay ahead of your budget!`;
        }
      },

      // Smart Categorization Insights
      {
        type: 'smart_categorization',
        priority: 'info',
        title: 'Smart Categorization',
        content: 'AI-powered spending categorization insights',
        conditions: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          
          // Check for transactions that might be miscategorized
          const categoryCounts = recentTransactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          // Trigger if there are many small transactions in the same category
          return Object.values(categoryCounts).some(count => count >= 4);
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          
          const categoryCounts = recentTransactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const highCountCategory = Object.entries(categoryCounts)
            .find(([_, count]) => count >= 4);
          
          if (highCountCategory) {
            const categoryTotal = recentTransactions
              .filter(t => t.category === highCountCategory[0])
              .reduce((sum, t) => sum + t.amount, 0);
            
            return `I noticed ${highCountCategory[1]} transactions in ${highCountCategory[0]} (₹${categoryTotal.toLocaleString()}). Consider creating a dedicated budget for this category to better track your spending.`;
          }
          
          return 'Your spending patterns suggest opportunities for better categorization. Review your transaction categories for accuracy.';
        }
      },

      // Budget Cap Warning Insight
      {
        type: 'budget_cap_warning',
        priority: 'warning',
        title: 'Budget Cap Analysis',
        content: 'Your budget caps may be set too high relative to your salary.',
        conditions: (transactions, userProfile) => {
          // Get budget data to check for high caps
          return true; // Always check
        },
        generateContent: async (transactions, userProfile) => {
          const budgetData = await this.getBudgetDataForUser(userProfile.spendingPersonality, userProfile.userId);
          if (!budgetData) return 'Unable to analyze budget caps.';
          
          const totalBudgetCap = Object.values(budgetData).reduce((sum, { budgetCap }) => sum + budgetCap, 0);
          const budgetToSalaryRatio = totalBudgetCap / userProfile.salary;
          
          if (budgetToSalaryRatio > 0.8) {
            return `Your total budget caps (₹${totalBudgetCap.toLocaleString()}) represent ${(budgetToSalaryRatio * 100).toFixed(1)}% of your salary. Consider reducing caps to maintain healthy savings.`;
          }
          
          return `Your budget caps are well-balanced at ${(budgetToSalaryRatio * 100).toFixed(1)}% of your salary.`;
        }
      },

      // Predictive Spending Insight
      {
        type: 'predictive_spending',
        priority: 'tip',
        title: 'Predictive Spending Analysis',
        content: 'AI prediction for your next purchase',
        conditions: (transactions, userProfile) => {
          // Always trigger this insight to show predictions
          return true;
        },
        generateContent: (transactions, userProfile) => {
          const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          );
          
          if (recentTransactions.length === 0) {
            return 'No recent transactions to analyze. Start spending to get personalized predictions.';
          }
          
          // Find most frequent category
          const categoryCounts = recentTransactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const mostFrequentCategory = Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)[0];
          
          if (mostFrequentCategory) {
            const category = mostFrequentCategory[0];
            const avgAmount = recentTransactions
              .filter(t => t.category === category)
              .reduce((sum, t) => sum + t.amount, 0) / mostFrequentCategory[1];
            
            // Predict next occurrence in 3-7 days
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + Math.floor(Math.random() * 5) + 3);
            
            const confidence = Math.min(85, Math.max(60, mostFrequentCategory[1] * 10));
            
            return `Next ${category} purchase predicted: ₹${Math.round(avgAmount).toLocaleString()} on ${nextDate.toLocaleDateString('en-GB')} (${confidence}% confidence).`;
          }
          
          return 'Analyzing your spending patterns to provide personalized predictions.';
        }
      }
    ];
  }

  async generateInsightsForUser(
    userId: string, 
    transactions: TransactionData[], 
    userProfile: UserProfile
  ): Promise<IAIInsight[]> {
    const generatedInsights: IAIInsight[] = [];

    console.log('=== INSIGHT GENERATION STARTED ===');
    console.log('Generating insights for user:', userId);
    console.log('User profile:', userProfile);
    console.log('Number of templates:', this.insightTemplates.length);
    console.log('Template types:', this.insightTemplates.map(t => t.type));
    console.log('First template type:', this.insightTemplates[0]?.type);
    console.log('Budget overrun template exists:', this.insightTemplates.some(t => t.type === 'budget_overrun'));
    console.log('Budget overrun template index:', this.insightTemplates.findIndex(t => t.type === 'budget_overrun'));

    for (const template of this.insightTemplates) {
      console.log(`Checking template: ${template.type} - ${template.title}`);
      
      if (template.conditions(transactions, userProfile)) {
        console.log(`Template ${template.type} conditions met!`);
        const insightId = `insight_${uuidv4()}`;
        const content = await template.generateContent(transactions, userProfile);
        
        const insight = new AIInsight({
          userId,
          insightId,
          type: template.type,
          priority: template.priority,
          title: template.title,
          content,
          generatedAt: new Date(),
          userType: userProfile.userType,
          spendingPersonality: userProfile.spendingPersonality,
          relatedTransactions: transactions.slice(-5).map(t => t.id), // Last 5 transactions
          isActive: true,
          data: {
            templateType: template.type,
            transactionCount: transactions.length,
            generatedAt: new Date()
          }
        });

        generatedInsights.push(insight);
      } else {
        console.log(`Template ${template.type} conditions NOT met`);
      }
    }

    // Generate predictive insights
    const predictiveInsights = await this.generatePredictiveInsights(userId, transactions, userProfile);
    generatedInsights.push(...predictiveInsights);

    // Generate behavioral insights
    const behavioralInsights = await this.generateBehavioralInsights(userId, userProfile);
    generatedInsights.push(...behavioralInsights);

    // Save insights to database
    if (generatedInsights.length > 0) {
      await AIInsight.insertMany(generatedInsights);
    }

    return generatedInsights;
  }

  async getActiveInsightsForUser(userId: string, limit: number = 3): Promise<IAIInsight[]> {
    const insights = await AIInsight.find({ 
      userId, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .exec();
    
    // Remove duplicates based on type and content
    const uniqueInsights = insights.filter((insight, index, self) => 
      index === self.findIndex(i => 
        i.type === insight.type && 
        i.content === insight.content
      )
    );
    
    // Return up to the limit
    return uniqueInsights.slice(0, limit);
  }

  async updateInsightResponse(
    insightId: string, 
    userId: string, 
    response: IAIInsight['userResponse']
  ): Promise<IAIInsight | null> {
    return await AIInsight.findOneAndUpdate(
      { insightId, userId },
      { userResponse: response },
      { new: true }
    );
  }

  async deactivateInsight(insightId: string, userId: string): Promise<boolean> {
    const result = await AIInsight.findOneAndUpdate(
      { insightId, userId },
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  /**
   * Generate predictive insights using the PredictiveAnalyticsService
   */
  private async generatePredictiveInsights(
    userId: string, 
    transactions: TransactionData[], 
    userProfile: UserProfile
  ): Promise<IAIInsight[]> {
    const predictiveInsights: IAIInsight[] = [];

    try {
      // Convert TransactionData to Transaction format for predictive service
      const transactionModels = transactions.map(tx => ({
        _id: tx.id,
        userId,
        amount: tx.amount,
        category: tx.category,
        merchant: tx.merchant,
        date: tx.date,
        paymentMethod: tx.paymentMethod
      })) as any[];

      // Convert UserProfile to User format
      const userModel = {
        _id: userId,
        username: userId,
        spendingPersonality: userProfile.spendingPersonality,
        name: 'User',
        age: 25,
        theme: 'light'
      } as any;

      // Generate predictive insights
      const predictions = await predictiveAnalyticsService.generatePredictiveInsights(userModel, transactionModels);

      // Convert predictions to AIInsight format
      for (const prediction of predictions) {
        const insightId = `predictive_${uuidv4()}`;
        
        let type: IAIInsight['type'] = 'pattern';
        let priority: IAIInsight['priority'] = 'info';
        
        switch (prediction.type) {
          case 'spending_prediction':
            type = 'pattern';
            priority = 'warning';
            break;
          case 'budget_forecast':
            type = 'pattern';
            priority = 'critical';
            break;
          case 'goal_tracking':
            type = 'goal';
            priority = 'info';
            break;
        }

        const insight = new AIInsight({
          userId,
          insightId,
          type,
          priority,
          title: this.getPredictiveTitle(prediction.type),
          content: prediction.message,
          generatedAt: new Date(),
          userType: userProfile.userType,
          spendingPersonality: userProfile.spendingPersonality,
          relatedTransactions: transactions.slice(-5).map(t => t.id),
          isActive: true,
          data: {
            templateType: 'predictive',
            predictionType: prediction.type,
            confidence: prediction.confidence,
            predictedAmount: prediction.predictedAmount,
            currentAmount: prediction.currentAmount,
            targetAmount: prediction.targetAmount,
            percentage: prediction.percentage,
            generatedAt: new Date()
          }
        });

        predictiveInsights.push(insight);
      }
    } catch (error) {
      console.error('Error generating predictive insights:', error);
    }

    return predictiveInsights;
  }

  /**
   * Get title for predictive insights
   */
  private getPredictiveTitle(type: string): string {
    switch (type) {
      case 'spending_prediction':
        return 'Spending Prediction';
      case 'budget_forecast':
        return 'Budget Forecast';
      case 'goal_tracking':
        return 'Goal Progress';
      default:
        return 'Predictive Insight';
    }
  }

  /**
   * Generate behavioral insights using the UserBehaviorService
   */
  private async generateBehavioralInsights(
    userId: string, 
    userProfile: UserProfile
  ): Promise<IAIInsight[]> {
    const behavioralInsights: IAIInsight[] = [];

    try {
      // Get behavioral insights from the service
      const insights = userBehaviorService.getBehavioralInsights(userId);
      
      // Get optimal timing
      const timing = userBehaviorService.getOptimalTiming(userId);
      
      // Only generate insights if timing is optimal
      if (timing.shouldSend && insights.length > 0) {
        for (const insight of insights) {
          const insightId = `behavioral_${uuidv4()}`;
          
          const aiInsight = new AIInsight({
            userId,
            insightId,
            type: 'agentic_analysis',
            priority: 'info',
            title: 'Behavioral Adaptation',
            content: insight,
            generatedAt: new Date(),
            userType: userProfile.userType,
            spendingPersonality: userProfile.spendingPersonality,
            relatedTransactions: [],
            isActive: true,
            data: {
              templateType: 'behavioral',
              timingReason: timing.reason,
              generatedAt: new Date()
            }
          });

          behavioralInsights.push(aiInsight);
        }
      }

      // Add adaptive threshold insights
      const thresholds = userBehaviorService.getAdaptiveThresholds(userId);
      const userProfileData = userBehaviorService.getUserProfile(userId);
      
      if (userProfileData && userProfileData.sensitivityLevel !== 'medium') {
        const thresholdInsightId = `adaptive_${uuidv4()}`;
        
        const thresholdInsight = new AIInsight({
          userId,
          insightId: thresholdInsightId,
          type: 'agentic_analysis',
          priority: 'info',
          title: 'Adaptive Thresholds',
          content: `I've adjusted alert sensitivity based on your behavior. Budget alerts now trigger at ${thresholds.budgetOverrunThreshold.toFixed(0)}% and transaction warnings at ${thresholds.burnRiskThreshold} transactions.`,
          generatedAt: new Date(),
          userType: userProfile.userType,
          spendingPersonality: userProfile.spendingPersonality,
          relatedTransactions: [],
          isActive: true,
          data: {
            templateType: 'adaptive_thresholds',
            sensitivityLevel: userProfileData.sensitivityLevel,
            thresholds,
            generatedAt: new Date()
          }
        });

        behavioralInsights.push(thresholdInsight);
      }

    } catch (error) {
      console.error('Error generating behavioral insights:', error);
    }

    return behavioralInsights;
  }

  private async getBudgetDataForUser(spendingPersonality: string, userId: string): Promise<Record<string, { budgetCap: number }> | undefined> {
    // Get user's custom budget caps from database
    const Budget = require('../models/Budget').default;
    const userBudgets = await Budget.find({ userId });
    
    // Get default budget caps for the persona
    const budgetData = getBudgetForPersona(spendingPersonality);
    if (!budgetData) {
      return undefined;
    }

    // Merge custom budgets with defaults
    const budgetCaps: Record<string, { budgetCap: number }> = {};
    
    // Start with default caps
    budgetData.categories.forEach(cat => {
      budgetCaps[cat.category] = { budgetCap: cat.budgetCap };
    });
    
    // Override with user's custom caps
    userBudgets.forEach((budget: any) => {
      budgetCaps[budget.category] = { budgetCap: budget.budgetCap };
    });

    return budgetCaps;
  }

  private normalizeCategory(category: string, spendingPersonality: string): string {
    const categoryMappings = {
      'Heavy Spender': {
        'entertainment': 'Entertainment',
        'food & dining': 'Dining',
        'food': 'Dining',
        'dining': 'Dining',
        'groceries': 'Groceries',
        'shopping': 'Shopping',
        'transport': 'Transport'
      },
      'Medium Spender': {
        'food': 'Food',
        'groceries': 'Groceries',
        'savings': 'Savings',
        'shopping': 'Shopping',
        'transport': 'Transport'
      },
      'Max Saver': {
        'transport': 'Transport',
        'groceries': 'Groceries',
        'travel': 'Travel',
        'utilities': 'Utilities',
        'savings': 'Savings'
      }
    };
    
    const mapping = categoryMappings[spendingPersonality as keyof typeof categoryMappings];
    if (!mapping) return category;
    
    const normalizedCategory = mapping[category.toLowerCase() as keyof typeof mapping];
    return normalizedCategory || category;
  }
}

export default new AgenticInsightService(); 