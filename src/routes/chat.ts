import { Router, Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage';
import Transaction from '../models/Transaction';
import User from '../models/User';
import gpt4Service, { UserContext, ChatContext } from '../services/gpt4Service';

const router = Router();

// Get chat history
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const messages = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message and get AI response
router.post('/:userId/message', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Save user message
    const userMessage = new ChatMessage({
      userId,
      message,
      isUser: true,
      timestamp: new Date()
    });
    
    await userMessage.save();
    
    // Get user context for AI response
    const user = await User.findOne({ username: userId });
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(10);
    
    // Get chat history for context
    const chatHistory = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    
    // Prepare user context for GPT-4
    const userContext: UserContext = {
      name: user?.name || 'User',
      age: user?.age || 25,
      spendingPersonality: user?.spendingPersonality || 'Medium Spender',
      recentTransactions: recentTransactions.map(txn => ({
        amount: txn.amount,
        category: txn.category,
        merchant: txn.merchant,
        date: txn.date
      })),
      financialGoals: [], // Will be added in future updates
      monthlyIncome: undefined // Will be added in future updates
    };
    
    // Prepare chat context
    const chatContext: ChatContext = {
      userMessage: message,
      userContext,
      chatHistory: chatHistory.reverse() // Chronological order
    };
    
    // Generate AI response using GPT-4 service
    const aiResponse = await gpt4Service.generateResponse(chatContext);
    
    // Save AI response
    const aiMessage = new ChatMessage({
      userId,
      message: aiResponse,
      isUser: false,
      timestamp: new Date()
    });
    
    await aiMessage.save();
    
    res.json({
      success: true,
      userMessage,
      aiMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Clear chat history
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    await ChatMessage.deleteMany({ userId });
    
    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 