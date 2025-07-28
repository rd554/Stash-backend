import User from '../models/User';
import Transaction from '../models/Transaction';
import ChatMessage from '../models/ChatMessage';
import Nudge from '../models/Nudge';
import { config } from '../config/env';

interface SessionData {
  username: string;
  originalPersonality: string;
  temporaryPersonality: string;
  startTime: number;
  expiryTime: number;
}

interface ActivityTracker {
  lastActivity: number;
  lastLogin: number;
  sessionActive: boolean;
}

export class TestUserResetService {
  private static readonly TEST_USERS = ['test1', 'test2', 'test3'];
  private static readonly SESSION_DURATION = config.testUserSessionHours * 60 * 60 * 1000; // Convert hours to ms
  private static readonly GLOBAL_INACTIVITY_THRESHOLD = config.testUserInactivityHours * 60 * 60 * 1000; // Convert hours to ms
  private static activityTracker: Map<string, ActivityTracker> = new Map();

  /**
   * Track user activity for reset decisions
   */
  static trackActivity(username: string, activityType: 'login' | 'api_call' = 'api_call'): void {
    const now = Date.now();
    const existing = this.activityTracker.get(username) || {
      lastActivity: now,
      lastLogin: now,
      sessionActive: false
    };

    existing.lastActivity = now;
    if (activityType === 'login') {
      existing.lastLogin = now;
      existing.sessionActive = true;
    }

    this.activityTracker.set(username, existing);
    console.log(`📊 Activity tracked for ${username}: ${activityType} at ${new Date(now).toISOString()}`);
  }

  /**
   * Check if a user's 48-hour session has expired
   */
  static async checkSessionExpiry(username: string): Promise<{ expired: boolean; sessionData?: SessionData }> {
    try {
      // Check if there's an active session in localStorage equivalent (we'll simulate this)
      // In practice, this would check the session storage mechanism you're using
      
      const user = await User.findOne({ username });
      if (!user) {
        return { expired: true };
      }

      // Get activity data
      const activity = this.activityTracker.get(username);
      if (!activity) {
        return { expired: true };
      }

      // Check if session is older than configured hours
      const hoursSinceLogin = (Date.now() - activity.lastLogin) / (1000 * 60 * 60);
      const sessionExpired = hoursSinceLogin > config.testUserSessionHours;

      if (sessionExpired) {
        console.log(`⏰ ${username} session expired: ${hoursSinceLogin.toFixed(1)} hours since login`);
        return { expired: true };
      }

      return { expired: false };
    } catch (error) {
      console.error(`Error checking session expiry for ${username}:`, error);
      return { expired: true };
    }
  }

  /**
   * Clear data for a specific user
   */
  static async clearUserData(username: string): Promise<void> {
    try {
      console.log(`🧹 Clearing data for user: ${username}`);

      // Clear user profile (will be recreated on next onboarding)
      await User.deleteOne({ username });

      // Clear manual transactions
      await Transaction.deleteMany({ userId: username });

      // Clear chat messages
      await ChatMessage.deleteMany({ userId: username });

      // Clear nudges
      await Nudge.deleteMany({ userId: username });

      // Clear activity tracking
      this.activityTracker.delete(username);

      console.log(`✅ Successfully cleared all data for ${username}`);
    } catch (error) {
      console.error(`❌ Error clearing data for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Clear all test users data
   */
  static async clearAllTestUsers(): Promise<void> {
    try {
      console.log('🧹 Clearing all test user data...');

      // Clear all test users
      await User.deleteMany({ username: { $in: this.TEST_USERS } });

      // Clear all test user transactions
      await Transaction.deleteMany({ userId: { $in: this.TEST_USERS } });

      // Clear all test user chat messages
      await ChatMessage.deleteMany({ userId: { $in: this.TEST_USERS } });

      // Clear all test user nudges
      await Nudge.deleteMany({ userId: { $in: this.TEST_USERS } });

      // Clear activity tracking for all test users
      this.TEST_USERS.forEach(username => {
        this.activityTracker.delete(username);
      });

      console.log('✅ Successfully cleared all test user data');
    } catch (error) {
      console.error('❌ Error clearing all test user data:', error);
      throw error;
    }
  }

  /**
   * Check global activity across all test users
   */
  static getLastGlobalActivity(): number {
    let lastActivity = 0;

    this.TEST_USERS.forEach(username => {
      const activity = this.activityTracker.get(username);
      if (activity && activity.lastActivity > lastActivity) {
        lastActivity = activity.lastActivity;
      }
    });

    return lastActivity || 0;
  }

  /**
   * Main reset logic - called on server startup
   */
  static async manageTestUsers(): Promise<void> {
    try {
      console.log('🔍 Starting test user management...');

      // Check each test user for session expiry
      for (const username of this.TEST_USERS) {
        const sessionCheck = await this.checkSessionExpiry(username);
        
        if (sessionCheck.expired) {
          console.log(`⏰ ${username} session expired - clearing individual data`);
          await this.clearUserData(username);
        } else {
          console.log(`✅ ${username} session active - preserving data`);
        }
      }

      // Check for global inactivity
      const lastGlobalActivity = this.getLastGlobalActivity();
      const globalInactiveHours = (Date.now() - lastGlobalActivity) / (1000 * 60 * 60);

      if (lastGlobalActivity === 0 || globalInactiveHours > 24) {
        console.log(`🌟 Global inactivity detected: ${globalInactiveHours.toFixed(1)} hours - performing full reset`);
        await this.clearAllTestUsers();
      } else {
        console.log(`⏳ Global activity recent: ${globalInactiveHours.toFixed(1)} hours ago - preserving data`);
      }

      console.log('✅ Test user management completed');
    } catch (error) {
      console.error('❌ Error in test user management:', error);
    }
  }

  /**
   * Manual reset endpoint handler
   */
  static async forceReset(): Promise<{ success: boolean; message: string }> {
    try {
      await this.clearAllTestUsers();
      return {
        success: true,
        message: 'All test user data has been reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to reset test user data: ${error}`
      };
    }
  }

  /**
   * Get current status of all test users
   */
  static async getStatus(): Promise<any> {
    const status = {
      testUsers: {},
      globalActivity: {
        lastActivity: this.getLastGlobalActivity(),
        hoursSinceLastActivity: (Date.now() - this.getLastGlobalActivity()) / (1000 * 60 * 60)
      }
    };

    for (const username of this.TEST_USERS) {
      const user = await User.findOne({ username });
      const activity = this.activityTracker.get(username);
      const sessionCheck = await this.checkSessionExpiry(username);

      (status.testUsers as any)[username] = {
        exists: !!user,
        lastActivity: activity?.lastActivity || 0,
        lastLogin: activity?.lastLogin || 0,
        sessionExpired: sessionCheck.expired,
        hoursSinceLogin: activity ? (Date.now() - activity.lastLogin) / (1000 * 60 * 60) : 0
      };
    }

    return status;
  }
} 