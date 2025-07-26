import express, { Request, Response } from 'express';

const router = express.Router();

// Get current system date
router.get('/date', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const serverTime = new Date().toISOString();
    
    res.status(200).json({
      success: true,
      data: {
        currentDate,
        serverTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  } catch (error) {
    console.error('Get system date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        uptime: `${Math.floor(uptime)} seconds`,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 