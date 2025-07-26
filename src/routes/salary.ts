import { Router, Request, Response } from 'express';
import Salary from '../models/Salary';

const router = Router();

// Get current salary for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const salaryRecord = await Salary.findOne({ userId }).sort({ createdAt: -1 });
    
    if (salaryRecord) {
      res.json({
        success: true,
        data: {
          salary: salaryRecord.salary,
          createdAt: salaryRecord.createdAt,
          updatedAt: salaryRecord.updatedAt
        }
      });
    } else {
      // Return default salary if no record exists
      res.json({
        success: true,
        data: {
          salary: 100000, // Default salary
          createdAt: null,
          updatedAt: null
        }
      });
    }
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update salary for a user
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { salary } = req.body;
    
    // Validate salary
    if (!salary || typeof salary !== 'number' || salary < 100000) {
      return res.status(400).json({ 
        error: 'Salary must be a number and at least ₹1,00,000' 
      });
    }
    
    // Create new salary record
    const newSalary = new Salary({
      userId,
      salary
    });
    
    await newSalary.save();
    
    res.json({
      success: true,
      data: {
        salary: newSalary.salary,
        createdAt: newSalary.createdAt,
        updatedAt: newSalary.updatedAt
      },
      message: 'Salary updated successfully'
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all salary records (monthly reset)
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await Salary.deleteMany({ userId });
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} salary records for monthly reset`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear salary records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 