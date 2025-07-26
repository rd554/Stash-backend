import { Router, Request, Response } from 'express';
import Nudge from '../models/Nudge';
import Transaction from '../models/Transaction';
import User from '../models/User';
import nudgeService from '../services/nudgeService';

const router = Router();

// Get user nudges
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { unreadOnly = false } = req.query;
    
    let query: any = { userId };
    if (unreadOnly === 'true') {
      query = { ...query, isRead: false };
    }
    
    const nudges = await Nudge.find(query)
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      nudges,
      unreadCount: await Nudge.countDocuments({ userId, isRead: false })
    });
  } catch (error) {
    console.error('Get nudges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark nudge as read
router.patch('/:nudgeId/read', async (req: Request, res: Response) => {
  try {
    const { nudgeId } = req.params;
    
    const nudge = await Nudge.findByIdAndUpdate(
      nudgeId,
      { isRead: true },
      { new: true }
    );
    
    if (!nudge) {
      return res.status(404).json({ error: 'Nudge not found' });
    }
    
    res.json({
      success: true,
      nudge,
      message: 'Nudge marked as read'
    });
  } catch (error) {
    console.error('Mark nudge read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all nudges as read for a user
router.patch('/:userId/read-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await Nudge.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} nudges as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all nudges read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Respond to nudge
router.patch('/:nudgeId/respond', async (req: Request, res: Response) => {
  try {
    const { nudgeId } = req.params;
    const { response } = req.body;
    
    if (!response || !['accepted', 'ignored', 'snoozed'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response type' });
    }
    
    const nudge = await Nudge.findByIdAndUpdate(
      nudgeId,
      { userResponse: response, isRead: true },
      { new: true }
    );
    
    if (!nudge) {
      return res.status(404).json({ error: 'Nudge not found' });
    }
    
    res.json({
      success: true,
      nudge,
      message: 'Response recorded successfully'
    });
  } catch (error) {
    console.error('Respond to nudge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate advanced nudges based on spending patterns
router.post('/:userId/generate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Use the advanced nudge service to generate intelligent nudges
    const nudgeTriggers = await nudgeService.generateNudges(userId);
    
    const nudges = [];
    
    // Save each nudge to the database
    for (const nudgeTrigger of nudgeTriggers) {
      const nudge = new Nudge({
        userId,
        message: nudgeTrigger.message,
        type: nudgeTrigger.type,
        severity: nudgeTrigger.severity,
        actionRequired: nudgeTrigger.actionRequired,
        data: nudgeTrigger.data,
        isRead: false
      });
      
      await nudge.save();
      nudges.push(nudge);
    }
    
    res.json({
      success: true,
      nudges,
      message: `Generated ${nudges.length} intelligent nudges based on your spending patterns`
    });
  } catch (error) {
    console.error('Generate nudges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Delete nudge
router.delete('/:nudgeId', async (req: Request, res: Response) => {
  try {
    const { nudgeId } = req.params;
    
    const nudge = await Nudge.findByIdAndDelete(nudgeId);
    
    if (!nudge) {
      return res.status(404).json({ error: 'Nudge not found' });
    }
    
    res.json({
      success: true,
      message: 'Nudge deleted successfully'
    });
  } catch (error) {
    console.error('Delete nudge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 