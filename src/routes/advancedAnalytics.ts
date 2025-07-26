import express, { Request, Response } from 'express';
import advancedAnalyticsService from '../services/advancedAnalyticsService';
import User from '../models/User';

const router = express.Router();

// Get spending trends analysis
router.get('/:userId/trends', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { months = 3 } = req.query;

    // Verify user exists
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const trends = await advancedAnalyticsService.generateSpendingTrends(
      userId, 
      parseInt(months as string)
    );

    res.json({
      success: true,
      data: {
        userId,
        trends,
        analysisPeriod: `${months} months`,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching spending trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate spending trends'
    });
  }
});

// Get financial health score
router.get('/:userId/health-score', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const healthScore = await advancedAnalyticsService.calculateFinancialHealthScore(userId);

    res.json({
      success: true,
      data: {
        userId,
        healthScore,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error calculating financial health score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate financial health score'
    });
  }
});

// Get mood-spend correlation analysis
router.get('/:userId/mood-correlation', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const correlations = await advancedAnalyticsService.analyzeMoodSpendCorrelation(userId);

    res.json({
      success: true,
      data: {
        userId,
        correlations,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error analyzing mood-spend correlation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze mood-spend correlation'
    });
  }
});

// Get predictive spending patterns
router.get('/:userId/predictions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const predictions = await advancedAnalyticsService.generatePredictivePatterns(userId);

    res.json({
      success: true,
      data: {
        userId,
        predictions,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating predictive patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictive patterns'
    });
  }
});

// Get comprehensive analytics report
router.get('/:userId/report', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const report = await advancedAnalyticsService.generateAnalyticsReport(userId);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics report'
    });
  }
});

// Get category-wise insights
router.get('/:userId/category-insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get spending trends for category analysis
    const trends = await advancedAnalyticsService.generateSpendingTrends(userId, 1);
    
    if (trends.length === 0) {
      return res.json({
        success: true,
        data: {
          userId,
          categoryInsights: [],
          message: 'No transaction data available for analysis'
        }
      });
    }

    const latestTrend = trends[trends.length - 1];
    const categoryInsights = Object.entries(latestTrend.categoryBreakdown).map(([category, amount]) => {
      const percentage = (amount / latestTrend.totalSpent) * 100;
      
      let insight = 'Normal spending pattern';
      let recommendation = 'Continue monitoring';
      
      if (percentage > 40) {
        insight = 'High concentration in this category';
        recommendation = 'Consider diversifying spending';
      } else if (percentage < 10) {
        insight = 'Low spending in this category';
        recommendation = 'Good for budget management';
      }
      
      return {
        category,
        amount,
        percentage: Math.round(percentage * 100) / 100,
        insight,
        recommendation
      };
    });

    res.json({
      success: true,
      data: {
        userId,
        categoryInsights,
        totalSpent: latestTrend.totalSpent,
        period: latestTrend.period,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating category insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate category insights'
    });
  }
});

export default router; 