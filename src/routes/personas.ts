import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get transactions for a specific persona up to a specific date
router.get('/:userType/transactions/:currentDate', async (req: Request, res: Response) => {
  try {
    const { userType, currentDate } = req.params;
    
    // Validate user type
    const validUserTypes = ['heavy', 'medium', 'max'];
    if (!validUserTypes.includes(userType.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid user type. Must be heavy, medium, or max' 
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(currentDate)) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
    // Load persona data
    const personaFileName = getUserTypeFileName(userType);
    const personaDataPath = path.join(__dirname, '../../data/personas', personaFileName);
    
    if (!fs.existsSync(personaDataPath)) {
      return res.status(404).json({ 
        error: `Persona data not found for ${userType}` 
      });
    }
    
    const personaData = JSON.parse(fs.readFileSync(personaDataPath, 'utf8'));
    
    // Filter transactions up to current date
    const filteredTransactions = personaData.filter((transaction: any) => {
      return transaction.date <= currentDate;
    });
    
    // Sort by date
    filteredTransactions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.status(200).json({
      success: true,
      data: {
        transactions: filteredTransactions,
        userType: userType,
        currentDate: currentDate,
        totalTransactions: filteredTransactions.length,
        totalAmount: filteredTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      }
    });
  } catch (error) {
    console.error('Get persona transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available persona types
router.get('/types', async (req: Request, res: Response) => {
  try {
    const personaTypes = [
      {
        id: 'heavy',
        name: 'Heavy Spender',
        description: 'High spending on entertainment, dining, and shopping'
      },
      {
        id: 'medium',
        name: 'Medium Spender', 
        description: 'Balanced spending with regular savings'
      },
      {
        id: 'max',
        name: 'Max Saver',
        description: 'Minimal spending focused on essentials and savings'
      }
    ];
    
    res.status(200).json({
      success: true,
      data: { personaTypes }
    });
  } catch (error) {
    console.error('Get persona types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to map user type to file name
function getUserTypeFileName(userType: string): string {
  const mapping: { [key: string]: string } = {
    'heavy': 'heavy-spender.json',
    'medium': 'medium-spender.json',
    'max': 'max-saver.json'
  };
  
  return mapping[userType.toLowerCase()] || 'medium-spender.json';
}

export default router; 