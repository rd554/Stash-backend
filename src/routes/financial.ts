import { Router, Request, Response } from 'express';
import financialProfileService from '../services/financialProfileService';
import User from '../models/User'; // Added missing import for User model

const router = Router();

// Get user's financial metrics
router.get('/metrics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const metrics = await financialProfileService.calculateFinancialMetrics(userId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get financial metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budget overview
router.get('/budget/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const budgetOverview = await financialProfileService.calculateBudgetOverview(userId, user.spendingPersonality);
    
    res.json({
      success: true,
      data: budgetOverview
    });
  } catch (error) {
    console.error('Get budget overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get spending patterns
router.get('/patterns/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const patterns = await financialProfileService.analyzeSpendingPatterns(userId, parseInt(days as string));
    
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Get spending patterns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weekly spending data
router.get('/weekly/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const weeklyData = await financialProfileService.getWeeklySpending(userId);
    
    res.json({
      success: true,
      data: weeklyData
    });
  } catch (error) {
    console.error('Get weekly spending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI financial insights
router.get('/insights/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const insights = await financialProfileService.getFinancialInsights(userId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get financial insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's salary
router.patch('/salary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { salary } = req.body;
    
    if (!salary || salary < 100000) {
      return res.status(400).json({ 
        error: 'Salary must be at least ₹1,00,000' 
      });
    }
    
    // For now, we'll store this in user preferences
    // In a real app, you might want a separate UserPreferences model
    const user = await User.findOneAndUpdate(
      { username: userId },
      { $set: { salary: salary } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { salary: user.salary },
      message: 'Salary updated successfully'
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update budget cap for a category
router.patch('/budget/:userId/category/:category', async (req: Request, res: Response) => {
  try {
    const { userId, category } = req.params;
    const { budgetCap } = req.body;
    
    if (!budgetCap || budgetCap <= 0) {
      return res.status(400).json({ 
        error: 'Budget cap must be greater than 0' 
      });
    }
    
    // For localStorage approach, we just validate and return success
    // The frontend will handle storing in localStorage
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { category, budgetCap },
      message: 'Budget cap updated successfully'
    });
  } catch (error) {
    console.error('Update budget cap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 