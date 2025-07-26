import express, { Request, Response } from 'express';
import advancedAIService from '../services/advancedAIService';
import User from '../models/User';

const router = express.Router();

// Get AI-powered budget optimization recommendations
router.get('/:userId/budget-optimization', async (req: Request, res: Response) => {
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
    
    const optimizations = await advancedAIService.generateBudgetOptimization(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        optimizations,
        generatedAt: new Date(),
        totalPotentialSavings: optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching budget optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate budget optimization'
    });
  }
});

// Get personalized financial goals
router.get('/:userId/financial-goals', async (req: Request, res: Response) => {
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
    
    const goals = await advancedAIService.generateFinancialGoals(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        goals,
        generatedAt: new Date(),
        totalGoals: goals.length,
        highPriorityGoals: goals.filter(g => g.priority === 'high').length
      }
    });
  } catch (error) {
    console.error('Error fetching financial goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial goals'
    });
  }
});

// Get personalized insights
router.get('/:userId/personalized-insights', async (req: Request, res: Response) => {
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
    
    const insights = await advancedAIService.generatePersonalizedInsights(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        insights,
        generatedAt: new Date(),
        totalInsights: insights.length,
        averageConfidence: insights.length > 0 
          ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching personalized insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized insights'
    });
  }
});

// Get financial education content
router.get('/:userId/financial-education', async (req: Request, res: Response) => {
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
    
    const education = await advancedAIService.generateFinancialEducation(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        education,
        generatedAt: new Date(),
        totalTopics: education.length,
        averageRelevance: education.length > 0 
          ? education.reduce((sum, topic) => sum + topic.relevance, 0) / education.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching financial education:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial education'
    });
  }
});

// Get comprehensive Phase 4 report
router.get('/:userId/comprehensive-report', async (req: Request, res: Response) => {
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
    
    // Generate all Phase 4 data
    const [optimizations, goals, insights, education] = await Promise.all([
      advancedAIService.generateBudgetOptimization(userId),
      advancedAIService.generateFinancialGoals(userId),
      advancedAIService.generatePersonalizedInsights(userId),
      advancedAIService.generateFinancialEducation(userId)
    ]);
    
    const totalPotentialSavings = optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0);
    const highPriorityGoals = goals.filter(g => g.priority === 'high').length;
    const averageConfidence = insights.length > 0 
      ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length 
      : 0;
    const averageRelevance = education.length > 0 
      ? education.reduce((sum, topic) => sum + topic.relevance, 0) / education.length 
      : 0;
    
    res.json({
      success: true,
      data: {
        userId,
        summary: {
          totalPotentialSavings,
          highPriorityGoals,
          averageConfidence,
          averageRelevance,
          totalInsights: insights.length,
          totalEducationTopics: education.length
        },
        optimizations,
        goals,
        insights,
        education,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive report'
    });
  }
});

export default router; 