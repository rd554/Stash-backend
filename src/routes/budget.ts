import express, { Request, Response } from 'express';
import Budget from '../models/Budget';
import User from '../models/User';
import { getBudgetForPersona } from '../utils/budgetData';

const router = express.Router();

// Get all budget caps for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get user to determine spending personality
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user's custom budget caps from database
    const userBudgets = await Budget.find({ userId });
    
    // Get default budget caps for the persona
    const defaultBudgetData = getBudgetForPersona(user.spendingPersonality);
    
    // Merge custom budgets with defaults
    const budgetCaps: { [category: string]: number } = {};
    
    // Start with default caps
    if (defaultBudgetData) {
      defaultBudgetData.categories.forEach(cat => {
        budgetCaps[cat.category] = cat.budgetCap;
      });
    }
    
    // Override with user's custom caps
    userBudgets.forEach(budget => {
      budgetCaps[budget.category] = budget.budgetCap;
    });

    res.json({
      success: true,
      data: {
        budgetCaps,
        spendingPersonality: user.spendingPersonality
      }
    });
  } catch (error) {
    console.error('Get budget caps error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update budget cap for a specific category
router.put('/:userId/:category', async (req: Request, res: Response) => {
  try {
    const { userId, category } = req.params;
    const { budgetCap } = req.body;
    
    if (!budgetCap || budgetCap < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Budget cap must be a positive number' 
      });
    }

    // Get user to determine spending personality
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update or create budget cap
    const budget = await Budget.findOneAndUpdate(
      { userId, category },
      { 
        userId, 
        category, 
        budgetCap, 
        spendingPersonality: user.spendingPersonality 
      },
      { upsert: true, new: true }
    );

    // Trigger insight regeneration after budget cap change
    try {
      const { AgenticInsightService } = require('../services/agenticInsightService');
      const agenticService = new AgenticInsightService();
      
      // Get user's recent transactions for insight generation
      const Transaction = require('../models/Transaction').default;
      const recentTransactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
      
      await agenticService.generateInsightsForUser(userId, recentTransactions, {
        userId,
        spendingPersonality: user.spendingPersonality,
        salary: user.salary || 200000,
        userType: 'test' // Add required userType field
      });
      
      console.log('Generated new insights after budget cap change for user:', userId);
    } catch (error) {
      console.error('Failed to generate insights after budget cap change:', error);
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Update budget cap error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Reset budget caps to defaults for a user
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Delete all custom budget caps for the user
    await Budget.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Budget caps reset to defaults'
    });
  } catch (error) {
    console.error('Reset budget caps error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router; 