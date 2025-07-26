import express, { Request, Response } from 'express';
import agenticChatbotService from '../services/agenticChatbotService';
import gpt4Service from '../services/gpt4Service';
import User from '../models/User';

const router = express.Router();

// Create chatbot context from insight
router.post('/:userId/context/insight', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { insightId } = req.body;

    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const context = await agenticChatbotService.createContextFromInsight(
      userId,
      insightId,
      user.userType || 'test',
      user.spendingPersonality
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        suggestedQuestion: context.suggestedQuestion,
        context: context.context
      }
    });
  } catch (error) {
    console.error('Error creating chatbot context from insight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chatbot context'
    });
  }
});

// Create chatbot context from notification
router.post('/:userId/context/notification', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { notificationId } = req.body;

    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const context = await agenticChatbotService.createContextFromNotification(
      userId,
      notificationId,
      user.userType || 'test',
      user.spendingPersonality
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        suggestedQuestion: context.suggestedQuestion,
        context: context.context
      }
    });
  } catch (error) {
    console.error('Error creating chatbot context from notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chatbot context'
    });
  }
});

// Create chatbot context for transaction analysis
router.post('/:userId/context/transaction', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { transactionData } = req.body;

    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const context = await agenticChatbotService.createContextForTransactionAnalysis(
      userId,
      transactionData.id,
      user.userType || 'test',
      user.spendingPersonality,
      transactionData
    );

    if (!context) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create context'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        suggestedQuestion: context.suggestedQuestion,
        context: context.context
      }
    });
  } catch (error) {
    console.error('Error creating chatbot context for transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chatbot context'
    });
  }
});

// Send message with context-aware response
router.post('/:userId/chat', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Check if this is a fallback sessionId (doesn't exist in database)
    const isFallbackSession = sessionId && sessionId.startsWith('fallback_');
    
    if (!isFallbackSession) {
      // Add user message to context for regular sessions
      await agenticChatbotService.addMessageToContext(
        userId,
        sessionId,
        message,
        true
      );
    }

    // Generate contextual prompt
    const contextualPrompt = await agenticChatbotService.generateContextualPrompt(
      userId,
      sessionId,
      message
    );

    // Get AI response using GPT-4
    const aiResponse = await gpt4Service.generateResponseFromPrompt(contextualPrompt);

    if (!isFallbackSession) {
      // Add AI response to context for regular sessions
      await agenticChatbotService.addMessageToContext(
        userId,
        sessionId,
        aiResponse,
        false,
        'ai_response'
      );
    }

    res.json({
      success: true,
      data: {
        message: aiResponse,
        sessionId
      }
    });
  } catch (error) {
    console.error('Error in chatbot chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// Get conversation history
router.get('/:userId/chat/:sessionId/history', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.params;

    const history = await agenticChatbotService.getConversationHistory(userId, sessionId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history'
    });
  }
});

// Get active context
router.get('/:userId/context/active', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;

    const context = await agenticChatbotService.getActiveContext(
      userId, 
      sessionId as string
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'No active context found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        context: context.context,
        transactionContext: context.transactionContext,
        suggestedQuestion: context.suggestedQuestion,
        recentBehavior: context.recentBehavior
      }
    });
  } catch (error) {
    console.error('Error fetching active context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active context'
    });
  }
});

// Deactivate context
router.delete('/:userId/context/:sessionId', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.params;

    const success = await agenticChatbotService.deactivateContext(userId, sessionId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Context not found'
      });
    }

    res.json({
      success: true,
      message: 'Context deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate context'
    });
  }
});

// Get user's chat contexts
router.get('/:userId/contexts', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const contexts = await agenticChatbotService.getUserContexts(
      userId, 
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: contexts
    });
  } catch (error) {
    console.error('Error fetching user contexts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user contexts'
    });
  }
});

export default router; 