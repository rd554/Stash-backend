import { Router, Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { getTransactionDataByPersonality, convertToTransactionModel } from '../utils/transactionData';
import notificationService from '../services/notificationService';
import transactionService from '../services/transactionService';
import { AgenticInsightService } from '../services/agenticInsightService';

const router = Router();

// Get user transactions
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));
    
    const total = await Transaction.countDocuments({ userId });
    
    res.json({
      success: true,
      transactions,
      total,
      hasMore: total > parseInt(offset as string) + transactions.length
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent transactions (persona + new manual transactions)
router.get('/:userId/recent', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get user to determine persona type
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Map user spending personality to persona type
    const getPersonaType = (personality: string): string => {
      switch (personality) {
        case 'Heavy Spender': return 'heavy'
        case 'Medium Spender': return 'medium'
        case 'Max Saver': return 'max'
        default: return 'medium'
      }
    }
    
    const personaType = getPersonaType(user.spendingPersonality);
    const personaTransactions = transactionService.getLatestTransactions(
      personaType, 
      10 // Get last 10 persona transactions
    );
    
    // Get new manual transactions from database
    const manualTransactions = await Transaction.find({ 
      userId, 
      isSimulated: false 
    }).sort({ date: -1 }).limit(10);
    
    // Combine persona and manual transactions
    const allTransactions = [
      ...personaTransactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category,
        paymentMode: tx.paymentMethod || 'Card' // Normalize to paymentMode for frontend
      })),
      ...manualTransactions.map(tx => ({
        id: (tx._id as any).toString(),
        date: tx.date.toISOString().split('T')[0],
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category,
        paymentMode: tx.paymentMode || 'Unknown', // Already correct field name
        isManual: true
      }))
    ];
    
    // Sort by date, newest first
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 10); // Get top 10 most recent
    
    res.json({
      success: true,
      transactions: sortedTransactions
    });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest transactions for a persona type
router.get('/latest/:personaType', async (req: Request, res: Response) => {
  try {
    const { personaType } = req.params;
    const { limit = 10 } = req.query;
    
    const latestTransactions = transactionService.getLatestTransactions(personaType, parseInt(limit as string));
    
    const totalAmount = latestTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    res.json({
      success: true,
      data: {
        transactions: latestTransactions,
        personaType,
        totalTransactions: latestTransactions.length,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Get latest transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new transaction
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date, merchant, amount, category, paymentMode } = req.body;
    
    // Validate required fields
    if (!date || !merchant || !amount || !category || !paymentMode) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }
    
    const transaction = new Transaction({
      userId,
      date: new Date(date),
      merchant,
      amount: parseFloat(amount),
      category,
      paymentMode,
      isSimulated: false
    });
    
    await transaction.save();
    
    // Send real-time notification for new transaction
    await notificationService.monitorTransaction(userId, transaction);
    
    // Trigger insight generation for the new transaction
    try {
      const user = await User.findOne({ username: userId });
      if (user) {
        const userProfile = {
          userId,
          userType: user.userType || 'test',
          spendingPersonality: user.spendingPersonality,
          salary: 100000 // Default salary
        };
        
        // Get all recent transactions for proper budget analysis
        const recentTransactions = await Transaction.find({ userId })
          .sort({ date: -1 })
          .limit(50)
          .exec();
        
        const allTransactionData = recentTransactions.map(tx => ({
          id: (tx._id as any).toString(),
          amount: tx.amount,
          category: tx.category,
          merchant: tx.merchant,
          date: tx.date.toISOString(),
          paymentMethod: tx.paymentMode
        }));
        
        console.log('🔍 Generating insights for transaction:', {
          userId,
          category: transaction.category,
          amount: transaction.amount,
          totalTransactions: allTransactionData.length
        });
        
        const agenticService = new AgenticInsightService();
        await agenticService.generateInsightsForUser(
          userId,
          allTransactionData, // Pass all recent transactions
          userProfile
        );
        
        console.log('✅ Insights generated successfully for new transaction');
      }
    } catch (insightError) {
      console.error('❌ Error generating insights for new transaction:', insightError);
      // Don't fail the transaction creation if insight generation fails
    }
    
    res.status(201).json({
      success: true,
      transaction,
      message: 'Transaction added successfully'
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup test transactions
router.delete('/:userId/cleanup', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchants } = req.body;
    
    if (!merchants || !Array.isArray(merchants)) {
      return res.status(400).json({ 
        error: 'Merchants array is required' 
      });
    }
    
    const result = await Transaction.deleteMany({
      userId,
      merchant: { $in: merchants }
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} test transactions`
    });
  } catch (error) {
    console.error('Cleanup transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate transactions based on personality
router.post('/:userId/simulate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { spendingPersonality } = req.body;
    
    if (!spendingPersonality) {
      return res.status(400).json({ 
        error: 'Spending personality is required' 
      });
    }
    
    // Get transaction data based on personality
    const transactionData = getTransactionDataByPersonality(spendingPersonality);
    
    // Convert to transaction models
    const transactions = transactionData.map(data => 
      convertToTransactionModel(data, userId)
    );
    
    // Save to database
    const savedTransactions = await Transaction.insertMany(transactions);
    
    res.status(201).json({
      success: true,
      transactions: savedTransactions,
      count: savedTransactions.length,
      message: `Simulated ${savedTransactions.length} transactions for ${spendingPersonality}`
    });
  } catch (error) {
    console.error('Simulate transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all transactions for budget calculation (persona + new manual transactions)
router.get('/:userId/budget', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get persona transactions from service
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Map user spending personality to persona type
    const getPersonaType = (personality: string): string => {
      switch (personality) {
        case 'Heavy Spender': return 'heavy'
        case 'Medium Spender': return 'medium'
        case 'Max Saver': return 'max'
        default: return 'medium'
      }
    }
    
    const personaType = getPersonaType(user.spendingPersonality)
    console.log('User personality:', user.spendingPersonality, '-> Persona type:', personaType)
    
    const personaTransactions = transactionService.getLatestTransactions(
      personaType, 
      100 // Get more transactions for budget calculation
    );
    
    // Get new manual transactions from database
    const manualTransactions = await Transaction.find({ 
      userId, 
      isSimulated: false 
    }).sort({ date: -1 });
    
    // Combine persona and manual transactions
    const allTransactions = [
      ...personaTransactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category,
        paymentMode: tx.paymentMethod // Normalize to paymentMode for frontend
      })),
      ...manualTransactions.map(tx => ({
        id: (tx._id as any).toString(),
        date: tx.date.toISOString().split('T')[0],
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category,
        paymentMode: tx.paymentMode, // Already correct field name
        isManual: true
      }))
    ];
    
    // Sort by date, newest first
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    console.log('Combined transactions sorted by date:');
    sortedTransactions.slice(0, 5).forEach((tx, index) => {
      const isManual = 'isManual' in tx && tx.isManual;
      console.log(`${index + 1}. ${tx.merchant} - ${tx.date} - ${isManual ? 'Manual' : 'Persona'}`);
    });
    
    res.json({
      success: true,
      data: {
        transactions: sortedTransactions,
        manualCount: manualTransactions.length,
        personaCount: personaTransactions.length,
        totalCount: allTransactions.length
      }
    });
  } catch (error) {
    console.error('Get budget transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all manual transactions (monthly reset)
router.delete('/:userId/manual', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await Transaction.deleteMany({ 
      userId, 
      isSimulated: false 
    });
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} manual transactions for monthly reset`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear manual transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findByIdAndDelete(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction statistics
router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { date: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
        break;
      case 'year':
        dateFilter = { date: { $gte: new Date(now.getFullYear(), 0, 1) } };
        break;
    }
    
    const transactions = await Transaction.find({ userId, ...dateFilter });
    
    const totalSpent = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const categoryStats = transactions.reduce((acc, txn) => {
      acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    res.json({
      success: true,
      stats: {
        totalSpent,
        transactionCount: transactions.length,
        topCategories,
        averageTransaction: transactions.length > 0 ? totalSpent / transactions.length : 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest transactions for a persona type
router.get('/latest/:personaType', async (req: Request, res: Response) => {
  try {
    const { personaType } = req.params
    const limit = parseInt(req.query.limit as string) || 10
    
    // Map persona types
    const personaMapping: { [key: string]: string } = {
      'heavy': 'heavy',
      'medium': 'medium',
      'max': 'max',
      'Heavy Spender': 'heavy',
      'Medium Spender': 'medium',
      'Max Saver': 'max'
    }
    
    const mappedPersona = personaMapping[personaType] || 'medium'
    
    const transactions = transactionService.getLatestTransactions(mappedPersona, limit)
    
    // Transform transactions to match frontend expectations
    const transformedTransactions = transactions.map(tx => ({
      ...tx,
      paymentMode: tx.paymentMethod, // Map paymentMethod to paymentMode
      userId: 'persona', // Add required userId field
      isSimulated: true, // Mark as simulated since it's persona data
      createdAt: new Date(tx.date) // Add createdAt field
    }))
    
    res.json({
      success: true,
      data: {
        transactions: transformedTransactions,
        personaType: mappedPersona,
        totalTransactions: transformedTransactions.length,
        totalAmount: transformedTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      }
    })
  } catch (error) {
    console.error('Get latest transactions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get weekly transactions for a persona type
router.get('/weekly/:personaType', async (req: Request, res: Response) => {
  try {
    const { personaType } = req.params
    
    // Map persona types
    const personaMapping: { [key: string]: string } = {
      'heavy': 'heavy',
      'medium': 'medium',
      'max': 'max',
      'Heavy Spender': 'heavy',
      'Medium Spender': 'medium',
      'Max Saver': 'max'
    }
    
    const mappedPersona = personaMapping[personaType] || 'medium'
    
    const weeklyData = transactionService.getWeeklyTransactions(mappedPersona)
    
    // Convert to the format expected by WeeklySpending component
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Get the date range from the weekly data
    const dateKeys = Object.keys(weeklyData).sort()
    const weeklyDataArray = dateKeys.map((dateStr, index) => {
      const date = new Date(dateStr)
      const dayName = days[date.getDay()]
      
      return {
        day: dayName,
        amount: weeklyData[dateStr] || 0,
        date: dateStr,
        percentage: 0 // Will be calculated below
      }
    })
    
    // Calculate percentages for bar chart scaling
    const maxAmount = Math.max(...weeklyDataArray.map(d => d.amount), 1)
    weeklyDataArray.forEach(data => {
      data.percentage = (data.amount / maxAmount) * 100
    })
    
    res.json({
      success: true,
      data: weeklyDataArray
    })
  } catch (error) {
    console.error('Get weekly transactions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get weekly transactions for a specific user (Last Friday to this Thursday) - Combined persona + user transactions
router.get('/:userId/weekly', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    // Get user profile to determine persona type
    const user = await User.findOne({ username: userId })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Map user persona to transaction service persona type
    const personaMapping: { [key: string]: string } = {
      'Heavy Spender': 'heavy',
      'Medium Spender': 'medium',
      'Max Saver': 'max'
    }
    const personaType = personaMapping[user.spendingPersonality] || 'medium'
    
    // Calculate the date range: Last 7 days (including today)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    // Calculate 6 days ago (so we get 7 days total including today)
    const sixDaysAgo = new Date(today)
    sixDaysAgo.setDate(today.getDate() - 6) // 6 days back from today = 7 days total
    sixDaysAgo.setHours(0, 0, 0, 0) // Start of that day
    
    console.log('Weekly date range:', {
      sixDaysAgo: sixDaysAgo.toISOString(),
      today: today.toISOString(),
      userId,
      personaType,
      todayDayOfWeek: today.getDay(),
      sixDaysAgoDayOfWeek: sixDaysAgo.getDay()
    })
    
    // 1. Get persona transactions for this date range
    const personaTransactions = transactionService.getTransactionsByDateRangeAndCategory(
      personaType,
      sixDaysAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      user.spendingPersonality
    )
    
    console.log('Found persona transactions for weekly view:', personaTransactions.length)
    
    // 2. Get user-specific transactions for this date range
    const userTransactions = await Transaction.find({
      userId,
      date: {
        $gte: sixDaysAgo,
        $lte: today
      }
    }).sort({ date: 1 })
    
    console.log('Found user transactions for weekly view:', userTransactions.length)
    
    // 3. Combine both transaction sources
    const allTransactions = [
      ...personaTransactions.map(tx => ({
        ...tx,
        date: tx.date,
        amount: tx.amount
      })),
      ...userTransactions.map(tx => ({
        ...tx,
        date: tx.date.toISOString().split('T')[0], // Convert MongoDB date to string format
        amount: tx.amount
      }))
    ]
    
    console.log('Total combined transactions for weekly view:', allTransactions.length)
    console.log('Sample combined transactions:', allTransactions.slice(0, 3).map(tx => ({
      date: tx.date,
      amount: tx.amount,
      merchant: tx.merchant || 'N/A'
    })))
    
    // Group transactions by day of week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyData: { [key: string]: number } = {}
    
    // Initialize all days with 0
    days.forEach(day => {
      weeklyData[day] = 0
    })
    
    // Sum up transactions by day
    allTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date)
      const dayIndex = transactionDate.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
      // Map JavaScript day index to our day names array (Mon, Tue, ..., Sun)
      const dayName = dayIndex === 0 ? 'Sun' : days[dayIndex - 1]
      weeklyData[dayName] += transaction.amount
    })
    
    // Convert to the format expected by WeeklySpending component
    const weeklyDataArray = days.map(day => {
      const amount = weeklyData[day] || 0
      return {
        day,
        amount,
        date: day, // Using day name as date for simplicity
        percentage: 0 // Will be calculated below
      }
    })
    
    // Calculate percentages for bar chart scaling
    const maxAmount = Math.max(...weeklyDataArray.map(d => d.amount), 1)
    weeklyDataArray.forEach(data => {
      data.percentage = (data.amount / maxAmount) * 100
    })
    
    console.log('Weekly data array (combined):', weeklyDataArray)
    
    res.json({
      success: true,
      data: weeklyDataArray
    })
  } catch (error) {
    console.error('Get user weekly transactions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get transaction stats for a persona type
router.get('/stats/:personaType', async (req: Request, res: Response) => {
  try {
    const { personaType } = req.params
    const days = parseInt(req.query.days as string) || 30
    
    // Map persona types
    const personaMapping: { [key: string]: string } = {
      'heavy': 'heavy',
      'medium': 'medium',
      'max': 'max',
      'Heavy Spender': 'heavy',
      'Medium Spender': 'medium',
      'Max Saver': 'max'
    }
    
    const mappedPersona = personaMapping[personaType] || 'medium'
    
    const stats = transactionService.getTransactionStats(mappedPersona, days)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Get transaction stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router; 