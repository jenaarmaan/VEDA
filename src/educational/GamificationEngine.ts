/**
 * GamificationEngine - Manages points, badges, progression, and user engagement
 */

import {
  UserProfile,
  UserProgress,
  Badge,
  BadgeCategory,
  LearningSession,
  UserInteraction,
  LiteracyLevel,
  GamificationConfig,
  AnalyticsData
} from './types';

export class GamificationEngine {
  private config: GamificationConfig;
  private badgeDefinitions: Map<string, BadgeDefinition> = new Map();

  constructor(config?: Partial<GamificationConfig>) {
    this.config = {
      pointsPerQuiz: 50,
      pointsPerCorrectAnswer: 10,
      pointsPerStreak: 5,
      badgeThresholds: {
        first_quiz: 1,
        quiz_master: 10,
        perfect_score: 1,
        streak_7: 7,
        streak_30: 30,
        category_expert: 5,
        speed_demon: 1,
        critical_thinker: 20
      },
      levelThresholds: [100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500],
      streakRewards: [10, 25, 50, 100, 200, 500],
      ...config
    };

    this.initializeBadgeDefinitions();
  }

  /**
   * Calculate points for a completed quiz
   */
  public calculateQuizPoints(
    session: LearningSession,
    userProfile: UserProfile
  ): number {
    if (!session.score) return 0;

    let points = this.config.pointsPerQuiz;
    
    // Bonus points for perfect score
    if (session.score === 100) {
      points += this.config.pointsPerCorrectAnswer * 2;
    } else {
      // Points based on percentage correct
      points += Math.floor((session.score / 100) * this.config.pointsPerCorrectAnswer * 5);
    }

    // Streak bonus
    const streakBonus = this.calculateStreakBonus(userProfile.progress.streak);
    points += streakBonus;

    // Difficulty multiplier
    const difficultyMultiplier = this.getDifficultyMultiplier(userProfile.literacyLevel);
    points = Math.floor(points * difficultyMultiplier);

    return points;
  }

  /**
   * Update user progress with new points and check for level up
   */
  public updateProgress(
    userProfile: UserProfile,
    points: number,
    session: LearningSession
  ): UserProgress {
    const newProgress = { ...userProfile.progress };
    newProgress.totalPoints += points;
    newProgress.lastActivity = new Date();

    // Check for level up
    const newLevel = this.calculateLevel(newProgress.totalPoints);
    const leveledUp = newLevel > newProgress.level;
    newProgress.level = newLevel;

    // Update streak
    newProgress.streak = this.updateStreak(newProgress.streak, session);

    // Check for new badges
    const newBadges = this.checkForNewBadges(userProfile, session, newProgress);
    newProgress.badges.push(...newBadges);

    // Add completed module
    if (session.completed && !newProgress.completedModules.includes(session.moduleId)) {
      newProgress.completedModules.push(session.moduleId);
    }

    return newProgress;
  }

  /**
   * Check for new badges based on user activity
   */
  public checkForNewBadges(
    userProfile: UserProfile,
    session: LearningSession,
    newProgress: UserProgress
  ): Badge[] {
    const newBadges: Badge[] = [];
    const existingBadgeIds = new Set(userProfile.progress.badges.map(b => b.id));

    // Check each badge definition
    for (const [badgeId, definition] of this.badgeDefinitions) {
      if (existingBadgeIds.has(badgeId)) continue;

      if (this.shouldAwardBadge(definition, userProfile, session, newProgress)) {
        const badge: Badge = {
          id: badgeId,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          earnedAt: new Date(),
          category: definition.category
        };
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  /**
   * Generate leaderboard data
   */
  public generateLeaderboard(
    users: UserProfile[],
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all'
  ): LeaderboardEntry[] {
    const now = new Date();
    const cutoffDate = this.getCutoffDate(now, timeframe);

    return users
      .map(user => ({
        userId: user.id,
        username: this.getDisplayName(user),
        points: this.getPointsInTimeframe(user, cutoffDate),
        level: user.progress.level,
        badges: user.progress.badges.length,
        streak: user.progress.streak
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 100)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }

  /**
   * Generate achievement summary for user
   */
  public generateAchievementSummary(userProfile: UserProfile): AchievementSummary {
    const progress = userProfile.progress;
    const nextLevelPoints = this.getNextLevelPoints(progress.level);
    const pointsToNextLevel = nextLevelPoints - progress.totalPoints;

    return {
      currentLevel: progress.level,
      totalPoints: progress.totalPoints,
      pointsToNextLevel,
      nextLevelPoints,
      totalBadges: progress.badges.length,
      currentStreak: progress.streak,
      completedModules: progress.completedModules.length,
      recentBadges: progress.badges
        .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
        .slice(0, 5),
      achievements: this.calculateAchievements(userProfile)
    };
  }

  /**
   * Track user interaction for analytics
   */
  public trackInteraction(
    userProfile: UserProfile,
    interaction: UserInteraction
  ): AnalyticsData {
    return {
      userId: userProfile.id,
      sessionId: interaction.type,
      event: interaction.type,
      timestamp: interaction.timestamp,
      data: interaction.data
    };
  }

  /**
   * Generate personalized challenges for user
   */
  public generateChallenges(userProfile: UserProfile): Challenge[] {
    const challenges: Challenge[] = [];
    const progress = userProfile.progress;

    // Daily challenges
    challenges.push({
      id: 'daily_quiz',
      title: 'Daily Quiz Challenge',
      description: 'Complete one quiz today',
      type: 'daily',
      target: 1,
      current: this.getTodayQuizCount(userProfile),
      reward: 25,
      category: 'engagement'
    });

    // Streak challenges
    if (progress.streak < 7) {
      challenges.push({
        id: 'streak_7',
        title: '7-Day Streak',
        description: 'Maintain a 7-day learning streak',
        type: 'streak',
        target: 7,
        current: progress.streak,
        reward: 100,
        category: 'consistency'
      });
    }

    // Category challenges
    const categoryCounts = this.getCategoryCompletionCounts(userProfile);
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count < 5) {
        challenges.push({
          id: `category_${category}`,
          title: `${category} Expert`,
          description: `Complete 5 quizzes in ${category}`,
          type: 'category',
          target: 5,
          current: count,
          reward: 75,
          category: 'knowledge'
        });
      }
    });

    return challenges;
  }

  private initializeBadgeDefinitions(): void {
    // Achievement badges
    this.addBadgeDefinition({
      id: 'first_quiz',
      name: 'First Steps',
      description: 'Completed your first quiz',
      icon: '🎯',
      category: BadgeCategory.ACHIEVEMENT,
      condition: (user, session, progress) => progress.completedModules.length >= 1
    });

    this.addBadgeDefinition({
      id: 'quiz_master',
      name: 'Quiz Master',
      description: 'Completed 10 quizzes',
      icon: '🏆',
      category: BadgeCategory.ACHIEVEMENT,
      condition: (user, session, progress) => progress.completedModules.length >= 10
    });

    this.addBadgeDefinition({
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Achieved 100% on a quiz',
      icon: '💯',
      category: BadgeCategory.ACHIEVEMENT,
      condition: (user, session, progress) => session.score === 100
    });

    // Skill badges
    this.addBadgeDefinition({
      id: 'streak_7',
      name: 'Consistent Learner',
      description: 'Maintained a 7-day learning streak',
      icon: '🔥',
      category: BadgeCategory.SKILL,
      condition: (user, session, progress) => progress.streak >= 7
    });

    this.addBadgeDefinition({
      id: 'streak_30',
      name: 'Dedicated Scholar',
      description: 'Maintained a 30-day learning streak',
      icon: '⭐',
      category: BadgeCategory.SKILL,
      condition: (user, session, progress) => progress.streak >= 30
    });

    this.addBadgeDefinition({
      id: 'category_expert',
      name: 'Category Expert',
      description: 'Mastered a specific category',
      icon: '🎓',
      category: BadgeCategory.SKILL,
      condition: (user, session, progress) => this.getCategoryCompletionCounts(user)[session.moduleId] >= 5
    });

    // Milestone badges
    this.addBadgeDefinition({
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reached level 5',
      icon: '🌟',
      category: BadgeCategory.MILESTONE,
      condition: (user, session, progress) => progress.level >= 5
    });

    this.addBadgeDefinition({
      id: 'level_10',
      name: 'Expert',
      description: 'Reached level 10',
      icon: '👑',
      category: BadgeCategory.MILESTONE,
      condition: (user, session, progress) => progress.level >= 10
    });

    // Special badges
    this.addBadgeDefinition({
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Completed a quiz in record time',
      icon: '⚡',
      category: BadgeCategory.SPECIAL,
      condition: (user, session, progress) => this.isSpeedCompletion(session)
    });

    this.addBadgeDefinition({
      id: 'critical_thinker',
      name: 'Critical Thinker',
      description: 'Demonstrated excellent critical thinking skills',
      icon: '🧠',
      category: BadgeCategory.SPECIAL,
      condition: (user, session, progress) => this.hasHighCriticalThinkingScore(session)
    });
  }

  private addBadgeDefinition(definition: BadgeDefinition): void {
    this.badgeDefinitions.set(definition.id, definition);
  }

  private shouldAwardBadge(
    definition: BadgeDefinition,
    userProfile: UserProfile,
    session: LearningSession,
    newProgress: UserProgress
  ): boolean {
    return definition.condition(userProfile, session, newProgress);
  }

  private calculateLevel(totalPoints: number): number {
    let level = 1;
    for (const threshold of this.config.levelThresholds) {
      if (totalPoints >= threshold) {
        level++;
      } else {
        break;
      }
    }
    return level;
  }

  private calculateStreakBonus(streak: number): number {
    if (streak <= 1) return 0;
    
    const streakIndex = Math.min(streak - 2, this.config.streakRewards.length - 1);
    return this.config.streakRewards[streakIndex] || 0;
  }

  private getDifficultyMultiplier(level: LiteracyLevel): number {
    switch (level) {
      case LiteracyLevel.BEGINNER:
        return 1.0;
      case LiteracyLevel.INTERMEDIATE:
        return 1.2;
      case LiteracyLevel.ADVANCED:
        return 1.5;
      default:
        return 1.0;
    }
  }

  private updateStreak(currentStreak: number, session: LearningSession): number {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If session was completed today and streak is active, maintain or increase
    if (session.completed && this.isSameDay(session.endTime || new Date(), today)) {
      return currentStreak + 1;
    }

    // If no activity today, check if streak should be maintained
    if (this.isSameDay(session.startTime, today)) {
      return currentStreak;
    }

    // Streak broken
    return 0;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private getCutoffDate(now: Date, timeframe: string): Date {
    const cutoff = new Date(now);
    
    switch (timeframe) {
      case 'daily':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'weekly':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'monthly':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case 'all':
        cutoff.setFullYear(2000);
        break;
    }
    
    return cutoff;
  }

  private getPointsInTimeframe(user: UserProfile, cutoffDate: Date): number {
    // This would typically query a database for points earned after cutoffDate
    // For now, return total points as a placeholder
    return user.progress.totalPoints;
  }

  private getDisplayName(user: UserProfile): string {
    // This would typically come from user profile data
    return `User ${user.id.substring(0, 8)}`;
  }

  private getNextLevelPoints(currentLevel: number): number {
    if (currentLevel >= this.config.levelThresholds.length) {
      return this.config.levelThresholds[this.config.levelThresholds.length - 1];
    }
    return this.config.levelThresholds[currentLevel] || 0;
  }

  private calculateAchievements(userProfile: UserProfile): Achievement[] {
    const achievements: Achievement[] = [];
    const progress = userProfile.progress;

    // Level achievements
    achievements.push({
      id: 'level_progress',
      title: 'Level Progress',
      description: `Reached level ${progress.level}`,
      progress: progress.level,
      maxProgress: 20,
      completed: progress.level >= 20
    });

    // Badge achievements
    achievements.push({
      id: 'badge_collector',
      title: 'Badge Collector',
      description: 'Collect badges',
      progress: progress.badges.length,
      maxProgress: 20,
      completed: progress.badges.length >= 20
    });

    // Streak achievements
    achievements.push({
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Maintain learning streak',
      progress: progress.streak,
      maxProgress: 30,
      completed: progress.streak >= 30
    });

    return achievements;
  }

  private getTodayQuizCount(userProfile: UserProfile): number {
    const today = new Date();
    return userProfile.learningHistory.filter(session => 
      this.isSameDay(session.startTime, today) && session.completed
    ).length;
  }

  private getCategoryCompletionCounts(userProfile: UserProfile): Record<string, number> {
    const counts: Record<string, number> = {};
    
    userProfile.learningHistory.forEach(session => {
      if (session.completed) {
        // This would typically extract category from session data
        const category = 'general'; // Placeholder
        counts[category] = (counts[category] || 0) + 1;
      }
    });
    
    return counts;
  }

  private isSpeedCompletion(session: LearningSession): boolean {
    if (!session.endTime) return false;
    
    const duration = session.endTime.getTime() - session.startTime.getTime();
    const durationMinutes = duration / (1000 * 60);
    
    // Consider it speed completion if under 2 minutes
    return durationMinutes < 2;
  }

  private hasHighCriticalThinkingScore(session: LearningSession): boolean {
    // This would typically analyze the types of questions answered correctly
    // For now, consider high score as critical thinking
    return (session.score || 0) >= 90;
  }
}

// Additional interfaces for gamification
interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  condition: (user: UserProfile, session: LearningSession, progress: UserProgress) => boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  points: number;
  level: number;
  badges: number;
  streak: number;
}

interface AchievementSummary {
  currentLevel: number;
  totalPoints: number;
  pointsToNextLevel: number;
  nextLevelPoints: number;
  totalBadges: number;
  currentStreak: number;
  completedModules: number;
  recentBadges: Badge[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'streak' | 'category' | 'special';
  target: number;
  current: number;
  reward: number;
  category: 'engagement' | 'consistency' | 'knowledge' | 'skill';
}