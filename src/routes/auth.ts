import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// Test user login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Validate test user credentials
    const validUsers = ['test1', 'test2', 'test3'];
    const validPassword = 'test@123';
    
    if (!validUsers.includes(username) || password !== validPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Check if user exists in database
    let user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found. Please complete onboarding first.' 
      });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        age: user.age,
        theme: user.theme,
        spendingPersonality: user.spendingPersonality
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (for onboarding)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, name, age, theme, spendingPersonality } = req.body;
    
    // Validate required fields
    if (!username || !name || !age || !theme || !spendingPersonality) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      name,
      age: parseInt(age),
      theme,
      spendingPersonality
    });
    
    await user.save();
    
    res.status(201).json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        age: user.age,
        theme: user.theme,
        spendingPersonality: user.spendingPersonality
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        age: user.age,
        theme: user.theme,
        spendingPersonality: user.spendingPersonality
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user theme
router.patch('/theme/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { theme } = req.body;
    
    if (!theme || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    
    const user = await User.findOneAndUpdate(
      { username },
      { theme },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      theme: user.theme,
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user spending personality
router.patch('/personality/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { spendingPersonality } = req.body;
    
    // Validate spending personality
    const validPersonalities = ['Heavy Spender', 'Medium Spender', 'Max Saver'];
    if (!validPersonalities.includes(spendingPersonality)) {
      return res.status(400).json({ 
        error: 'Invalid spending personality' 
      });
    }
    
    // Update user's spending personality
    const user = await User.findOneAndUpdate(
      { username },
      { spendingPersonality },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        age: user.age,
        theme: user.theme,
        spendingPersonality: user.spendingPersonality
      },
      message: 'Spending personality updated successfully'
    });
  } catch (error) {
    console.error('Update personality error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 