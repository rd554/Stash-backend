import express, { Request, Response } from 'express';
import agenticInsightService from '../services/agenticInsightService';
import userBehaviorService from '../services/userBehaviorService';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Salary from '../models/Salary';

const router = express.Router();

// Get active insights for user
router.get('/:userId/insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 3 } = req.query;

    const insights = await agenticInsightService.getActiveInsightsForUser(
      userId, 
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights'
    });
  }
});

// Generate insights for user (triggered by new transaction)
router.post('/:userId/generate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { transactionData } = req.body;

    // Get user profile
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's salary
    const salaryRecord = await Salary.findOne({ userId });
    const salary = salaryRecord?.salary || 100000; // Default salary
    
    console.log('🔍 AGENTIC INSIGHTS DEBUG: User ID:', userId);
    console.log('🔍 AGENTIC INSIGHTS DEBUG: Salary record found:', !!salaryRecord);
    console.log('🔍 AGENTIC INSIGHTS DEBUG: Salary being used:', salary);
    console.log('🔍 AGENTIC INSIGHTS DEBUG: User spending personality:', user.spendingPersonality);

    // Get all transactions (persona + manual) like the dashboard does
    const transactionService = require('../services/transactionService').default;
    const getPersonaType = (personality: string): string => {
      switch (personality) {
        case 'Heavy Spender': return 'heavy'
        case 'Medium Spender': return 'medium'
        case 'Max Saver': return 'max'
        default: return 'medium'
      }
    }
    
    const personaType = getPersonaType(user.spendingPersonality);
    const personaTransactions = transactionService.getLatestTransactions(personaType, 100);
    
    // Get manual transactions from database
    const manualTransactions = await Transaction.find({ 
      userId, 
      isSimulated: false 
    }).sort({ date: -1 });
    
    // Combine persona and manual transactions
    const allTransactions = [
      ...personaTransactions,
      ...manualTransactions.map(tx => ({
        id: (tx._id as any).toString(),
        date: tx.date.toISOString().split('T')[0],
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category.toLowerCase(),
        paymentMethod: tx.paymentMode,
        isManual: true
      }))
    ];
    
    // Sort by date, newest first
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log('🔍 AGENTIC INSIGHTS DEBUG: All transactions count:', sortedTransactions.length);
    console.log('🔍 AGENTIC INSIGHTS DEBUG: Persona transactions:', personaTransactions.length);
    console.log('🔍 AGENTIC INSIGHTS DEBUG: Manual transactions:', manualTransactions.length);
    console.log('🔍 AGENTIC INSIGHTS DEBUG: Sample transactions:', sortedTransactions.slice(0, 5).map(tx => ({
      category: tx.category,
      amount: tx.amount,
      date: tx.date,
      isManual: 'isManual' in tx && tx.isManual
    })));

    // Convert to TransactionData format
    const transactionDataList = sortedTransactions.map(tx => ({
      id: tx.id,
      amount: tx.amount,
      category: tx.category,
      merchant: tx.merchant,
      date: tx.date,
      paymentMethod: tx.paymentMethod
    }));

    // Add new transaction if provided
    if (transactionData) {
      transactionDataList.unshift({
        id: transactionData.id || 'new_transaction',
        amount: transactionData.amount,
        category: transactionData.category,
        merchant: transactionData.merchant,
        date: transactionData.date,
        paymentMethod: transactionData.paymentMethod
      });
    }

    const userProfile = {
      userId,
      userType: user.userType || 'test',
      spendingPersonality: user.spendingPersonality,
      salary
    };

    // Generate insights
    const insights = await agenticInsightService.generateInsightsForUser(
      userId,
      transactionDataList,
      userProfile
    );

    res.json({
      success: true,
      data: {
        insights,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

// Update insight response
router.put('/:userId/insights/:insightId/response', async (req: Request, res: Response) => {
  try {
    const { userId, insightId } = req.params;
    const { response } = req.body;

    const updatedInsight = await agenticInsightService.updateInsightResponse(
      insightId,
      userId,
      response
    );

    if (!updatedInsight) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
    }

    // Record user response for behavioral tracking
    await userBehaviorService.recordUserResponse(
      userId,
      insightId,
      response,
      updatedInsight.type,
      updatedInsight.priority
    );

    res.json({
      success: true,
      data: updatedInsight
    });
  } catch (error) {
    console.error('Error updating insight response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update insight response'
    });
  }
});

// Deactivate insight
router.delete('/:userId/insights/:insightId', async (req: Request, res: Response) => {
  try {
    const { userId, insightId } = req.params;

    const success = await agenticInsightService.deactivateInsight(insightId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
    }

    res.json({
      success: true,
      message: 'Insight deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating insight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate insight'
    });
  }
});

// Get insight history for user
router.get('/:userId/insights/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const insights = await agenticInsightService.getActiveInsightsForUser(
      userId, 
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching insight history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insight history'
    });
  }
});

// Get user behavior profile
router.get('/:userId/behavior', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const profile = userBehaviorService.getUserProfile(userId);
    const responses = userBehaviorService.getUserResponses(userId);
    const thresholds = userBehaviorService.getAdaptiveThresholds(userId);
    const timing = userBehaviorService.getOptimalTiming(userId);

    res.json({
      success: true,
      data: {
        profile,
        responses,
        thresholds,
        timing
      }
    });
  } catch (error) {
    console.error('Error fetching user behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user behavior'
    });
  }
});

export default router; 