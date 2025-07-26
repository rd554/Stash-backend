import { IUser } from '../models/User'
import { IAIInsight } from '../models/AIInsight'

interface UserResponse {
  insightId: string
  userId: string
  response: 'accepted' | 'ignored' | 'snoozed' | 'dismissed'
  timestamp: Date
  insightType: string
  insightPriority: string
}

interface UserBehaviorProfile {
  userId: string
  responsePatterns: {
    [insightType: string]: {
      accepted: number
      ignored: number
      snoozed: number
      dismissed: number
      total: number
    }
  }
  activeHours: {
    [hour: string]: number // Hour of day (0-23) -> response count
  }
  preferredInsightTypes: string[]
  sensitivityLevel: 'low' | 'medium' | 'high'
  lastActiveTime: Date
  averageResponseTime: number // in minutes
}

interface AdaptiveThresholds {
  budgetOverrunThreshold: number // Percentage above which to trigger alerts
  burnRiskThreshold: number // Number of transactions before warning
  savingsGoalThreshold: number // Percentage below which to trigger alerts
  responseTimeThreshold: number // Minutes before considering user inactive
}

export class UserBehaviorService {
  private userProfiles: Map<string, UserBehaviorProfile> = new Map()
  private userResponses: UserResponse[] = []

  /**
   * Record user response to an insight
   */
  async recordUserResponse(
    userId: string,
    insightId: string,
    response: UserResponse['response'],
    insightType: string,
    insightPriority: string
  ): Promise<void> {
    const userResponse: UserResponse = {
      insightId,
      userId,
      response,
      timestamp: new Date(),
      insightType,
      insightPriority
    }

    this.userResponses.push(userResponse)
    await this.updateUserProfile(userId, userResponse)
  }

  /**
   * Update user behavior profile based on response
   */
  private async updateUserProfile(userId: string, response: UserResponse): Promise<void> {
    let profile = this.userProfiles.get(userId)
    
    if (!profile) {
      profile = {
        userId,
        responsePatterns: {},
        activeHours: {},
        preferredInsightTypes: [],
        sensitivityLevel: 'medium',
        lastActiveTime: new Date(),
        averageResponseTime: 0
      }
      this.userProfiles.set(userId, profile)
    }

    // Update response patterns
    if (!profile.responsePatterns[response.insightType]) {
      profile.responsePatterns[response.insightType] = {
        accepted: 0,
        ignored: 0,
        snoozed: 0,
        dismissed: 0,
        total: 0
      }
    }

    profile.responsePatterns[response.insightType][response.response]++
    profile.responsePatterns[response.insightType].total++

    // Update active hours
    const hour = response.timestamp.getHours().toString()
    profile.activeHours[hour] = (profile.activeHours[hour] || 0) + 1

    // Update last active time
    profile.lastActiveTime = response.timestamp

    // Update average response time (simplified calculation)
    const now = new Date()
    const responseTime = (now.getTime() - response.timestamp.getTime()) / (1000 * 60) // in minutes
    profile.averageResponseTime = (profile.averageResponseTime + responseTime) / 2

    // Update sensitivity level based on response patterns
    profile.sensitivityLevel = this.calculateSensitivityLevel(profile)

    // Update preferred insight types
    profile.preferredInsightTypes = this.calculatePreferredTypes(profile)

    this.userProfiles.set(userId, profile)
  }

  /**
   * Calculate user sensitivity level based on response patterns
   */
  private calculateSensitivityLevel(profile: UserBehaviorProfile): 'low' | 'medium' | 'high' {
    const totalResponses = Object.values(profile.responsePatterns)
      .reduce((sum, pattern) => sum + pattern.total, 0)

    if (totalResponses < 5) return 'medium' // Default for new users

    const ignoredRate = Object.values(profile.responsePatterns)
      .reduce((sum, pattern) => sum + pattern.ignored, 0) / totalResponses

    const acceptedRate = Object.values(profile.responsePatterns)
      .reduce((sum, pattern) => sum + pattern.accepted, 0) / totalResponses

    if (ignoredRate > 0.7) return 'low' // User ignores most insights
    if (acceptedRate > 0.6) return 'high' // User accepts most insights
    return 'medium'
  }

  /**
   * Calculate preferred insight types based on acceptance rate
   */
  private calculatePreferredTypes(profile: UserBehaviorProfile): string[] {
    const typeAcceptance: { [type: string]: number } = {}

    Object.entries(profile.responsePatterns).forEach(([type, pattern]) => {
      if (pattern.total > 0) {
        typeAcceptance[type] = pattern.accepted / pattern.total
      }
    })

    return Object.entries(typeAcceptance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)
  }

  /**
   * Get adaptive thresholds for a user
   */
  getAdaptiveThresholds(userId: string): AdaptiveThresholds {
    const profile = this.userProfiles.get(userId)
    
    if (!profile) {
      return {
        budgetOverrunThreshold: 100, // Default: alert at 100% of budget
        burnRiskThreshold: 5, // Default: alert after 5 transactions
        savingsGoalThreshold: 50, // Default: alert if below 50% of goal
        responseTimeThreshold: 60 // Default: 60 minutes
      }
    }

    // Adjust thresholds based on sensitivity level
    const sensitivityMultiplier = {
      low: 1.5, // Less sensitive - higher thresholds
      medium: 1.0, // Normal sensitivity
      high: 0.7 // More sensitive - lower thresholds
    }[profile.sensitivityLevel]

    return {
      budgetOverrunThreshold: 100 * sensitivityMultiplier,
      burnRiskThreshold: Math.max(3, Math.round(5 * sensitivityMultiplier)),
      savingsGoalThreshold: 50 * sensitivityMultiplier,
      responseTimeThreshold: 60 * sensitivityMultiplier
    }
  }

  /**
   * Check if user is likely to be active now
   */
  isUserLikelyActive(userId: string): boolean {
    const profile = this.userProfiles.get(userId)
    if (!profile) return true // Default to true for new users

    const currentHour = new Date().getHours().toString()
    const hourActivity = profile.activeHours[currentHour] || 0
    const totalActivity = Object.values(profile.activeHours).reduce((sum, count) => sum + count, 0)
    
    if (totalActivity === 0) return true

    const activityRate = hourActivity / totalActivity
    return activityRate > 0.1 // User is likely active if this hour has >10% of their activity
  }

  /**
   * Get optimal timing for sending insights
   */
  getOptimalTiming(userId: string): { shouldSend: boolean; reason: string } {
    const profile = this.userProfiles.get(userId)
    if (!profile) return { shouldSend: true, reason: 'New user - default timing' }

    const now = new Date()
    const timeSinceLastActive = (now.getTime() - profile.lastActiveTime.getTime()) / (1000 * 60) // in minutes
    
    // Don't send if user was recently active (within response time threshold)
    if (timeSinceLastActive < profile.averageResponseTime) {
      return { shouldSend: false, reason: 'User recently active' }
    }

    // Check if user is likely to be active now
    const isActive = this.isUserLikelyActive(userId)
    if (!isActive) {
      return { shouldSend: false, reason: 'User typically inactive at this time' }
    }

    return { shouldSend: true, reason: 'Optimal timing detected' }
  }

  /**
   * Get behavioral insights for a user
   */
  getBehavioralInsights(userId: string): string[] {
    const profile = this.userProfiles.get(userId)
    if (!profile) return []

    const insights: string[] = []

    // Analyze response patterns
    Object.entries(profile.responsePatterns).forEach(([type, pattern]) => {
      if (pattern.total >= 3) { // Need minimum responses for analysis
        const ignoredRate = pattern.ignored / pattern.total
        const acceptedRate = pattern.accepted / pattern.total

        if (ignoredRate > 0.8) {
          insights.push(`You often ignore ${type} alerts. I'll adjust the frequency and timing.`)
        } else if (acceptedRate > 0.7) {
          insights.push(`You respond well to ${type} insights. I'll prioritize similar recommendations.`)
        }
      }
    })

    // Analyze timing patterns
    const peakHours = Object.entries(profile.activeHours)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)

    if (peakHours.length > 0) {
      insights.push(`I notice you're most active around ${peakHours.join(', ')}. I'll time insights accordingly.`)
    }

    // Analyze sensitivity
    if (profile.sensitivityLevel === 'low') {
      insights.push('I\'ve reduced alert sensitivity since you prefer fewer notifications.')
    } else if (profile.sensitivityLevel === 'high') {
      insights.push('I\'ve increased alert sensitivity since you respond well to proactive guidance.')
    }

    return insights
  }

  /**
   * Get user behavior profile
   */
  getUserProfile(userId: string): UserBehaviorProfile | null {
    return this.userProfiles.get(userId) || null
  }

  /**
   * Get all user responses
   */
  getUserResponses(userId: string): UserResponse[] {
    return this.userResponses.filter(response => response.userId === userId)
  }
}

export default new UserBehaviorService() 