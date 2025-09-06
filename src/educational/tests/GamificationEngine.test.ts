/**
 * Unit tests for GamificationEngine
 */

import { GamificationEngine } from '../GamificationEngine';
import {
  UserProfile,
  LearningSession,
  LiteracyLevel,
  BadgeCategory,
  UserProgress
} from '../types';

describe('GamificationEngine', () => {
  let gamificationEngine: GamificationEngine;
  let mockUserProfile: UserProfile;
  let mockLearningSession: LearningSession;

  beforeEach(() => {
    gamificationEngine = new GamificationEngine();
    
    mockUserProfile = {
      id: 'user_123',
      literacyLevel: LiteracyLevel.INTERMEDIATE,
      language: 'en',
      preferences: {
        difficulty: 'intermediate',
        learningStyle: 'interactive',
        topics: ['health', 'science'],
        notifications: true
      },
      progress: {
        totalPoints: 150,
        level: 3,
        badges: [],
        completedModules: [],
        streak: 5,
        lastActivity: new Date()
      },
      learningHistory: []
    };

    mockLearningSession = {
      id: 'session_123',
      moduleId: 'module_health_quiz',
      startTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      endTime: new Date(),
      score: 85,
      completed: true,
      interactions: []
    };
  });

  describe('calculateQuizPoints', () => {
    it('should calculate points for completed quiz', () => {
      const points = gamificationEngine.calculateQuizPoints(mockLearningSession, mockUserProfile);

      expect(points).toBeGreaterThan(0);
      expect(typeof points).toBe('number');
    });

    it('should award base points for quiz completion', () => {
      const points = gamificationEngine.calculateQuizPoints(mockLearningSession, mockUserProfile);

      expect(points).toBeGreaterThanOrEqual(50); // Base points per quiz
    });

    it('should award bonus points for perfect score', () => {
      const perfectSession = { ...mockLearningSession, score: 100 };
      const points = gamificationEngine.calculateQuizPoints(perfectSession, mockUserProfile);

      expect(points).toBeGreaterThan(50);
    });

    it('should award points based on score percentage', () => {
      const lowScoreSession = { ...mockLearningSession, score: 60 };
      const highScoreSession = { ...mockLearningSession, score: 90 };

      const lowPoints = gamificationEngine.calculateQuizPoints(lowScoreSession, mockUserProfile);
      const highPoints = gamificationEngine.calculateQuizPoints(highScoreSession, mockUserProfile);

      expect(highPoints).toBeGreaterThan(lowPoints);
    });

    it('should award streak bonus points', () => {
      const highStreakProfile = { ...mockUserProfile, progress: { ...mockUserProfile.progress, streak: 10 } };
      const points = gamificationEngine.calculateQuizPoints(mockLearningSession, highStreakProfile);

      expect(points).toBeGreaterThan(50);
    });

    it('should apply difficulty multiplier for advanced users', () => {
      const advancedProfile = { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED };
      const beginnerProfile = { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER };

      const advancedPoints = gamificationEngine.calculateQuizPoints(mockLearningSession, advancedProfile);
      const beginnerPoints = gamificationEngine.calculateQuizPoints(mockLearningSession, beginnerProfile);

      expect(advancedPoints).toBeGreaterThan(beginnerPoints);
    });

    it('should return 0 points for incomplete session', () => {
      const incompleteSession = { ...mockLearningSession, score: undefined };
      const points = gamificationEngine.calculateQuizPoints(incompleteSession, mockUserProfile);

      expect(points).toBe(0);
    });
  });

  describe('updateProgress', () => {
    it('should update user progress with new points', () => {
      const points = 100;
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, points, mockLearningSession);

      expect(newProgress.totalPoints).toBe(mockUserProfile.progress.totalPoints + points);
      expect(newProgress.lastActivity).toBeDefined();
    });

    it('should check for level up', () => {
      const highPoints = 1000;
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, highPoints, mockLearningSession);

      expect(newProgress.level).toBeGreaterThanOrEqual(mockUserProfile.progress.level);
    });

    it('should update streak correctly', () => {
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, 50, mockLearningSession);

      expect(newProgress.streak).toBeGreaterThanOrEqual(mockUserProfile.progress.streak);
    });

    it('should add completed module to list', () => {
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, 50, mockLearningSession);

      expect(newProgress.completedModules).toContain(mockLearningSession.moduleId);
    });

    it('should not add duplicate completed modules', () => {
      const profileWithModule = {
        ...mockUserProfile,
        progress: {
          ...mockUserProfile.progress,
          completedModules: [mockLearningSession.moduleId]
        }
      };

      const newProgress = gamificationEngine.updateProgress(profileWithModule, 50, mockLearningSession);

      const moduleCount = newProgress.completedModules.filter(id => id === mockLearningSession.moduleId).length;
      expect(moduleCount).toBe(1);
    });
  });

  describe('checkForNewBadges', () => {
    it('should award first quiz badge', () => {
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, 50, mockLearningSession);
      const newBadges = gamificationEngine.checkForNewBadges(mockUserProfile, mockLearningSession, newProgress);

      const firstQuizBadge = newBadges.find(badge => badge.id === 'first_quiz');
      expect(firstQuizBadge).toBeDefined();
      expect(firstQuizBadge?.name).toBe('First Steps');
    });

    it('should award perfect score badge for 100% score', () => {
      const perfectSession = { ...mockLearningSession, score: 100 };
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, 50, perfectSession);
      const newBadges = gamificationEngine.checkForNewBadges(mockUserProfile, perfectSession, newProgress);

      const perfectBadge = newBadges.find(badge => badge.id === 'perfect_score');
      expect(perfectBadge).toBeDefined();
      expect(perfectBadge?.name).toBe('Perfect Score');
    });

    it('should award streak badges', () => {
      const highStreakProfile = {
        ...mockUserProfile,
        progress: { ...mockUserProfile.progress, streak: 7 }
      };

      const newProgress = gamificationEngine.updateProgress(highStreakProfile, 50, mockLearningSession);
      const newBadges = gamificationEngine.checkForNewBadges(highStreakProfile, mockLearningSession, newProgress);

      const streakBadge = newBadges.find(badge => badge.id === 'streak_7');
      expect(streakBadge).toBeDefined();
      expect(streakBadge?.name).toBe('Consistent Learner');
    });

    it('should not award duplicate badges', () => {
      const profileWithBadge = {
        ...mockUserProfile,
        progress: {
          ...mockUserProfile.progress,
          badges: [{
            id: 'first_quiz',
            name: 'First Steps',
            description: 'Completed your first quiz',
            icon: '🎯',
            earnedAt: new Date(),
            category: BadgeCategory.ACHIEVEMENT
          }]
        }
      };

      const newProgress = gamificationEngine.updateProgress(profileWithBadge, 50, mockLearningSession);
      const newBadges = gamificationEngine.checkForNewBadges(profileWithBadge, mockLearningSession, newProgress);

      const firstQuizBadge = newBadges.find(badge => badge.id === 'first_quiz');
      expect(firstQuizBadge).toBeUndefined();
    });

    it('should award badges with correct properties', () => {
      const newProgress = gamificationEngine.updateProgress(mockUserProfile, 50, mockLearningSession);
      const newBadges = gamificationEngine.checkForNewBadges(mockUserProfile, mockLearningSession, newProgress);

      if (newBadges.length > 0) {
        const badge = newBadges[0];
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(badge.earnedAt).toBeDefined();
        expect(badge.category).toBeDefined();
      }
    });
  });

  describe('generateLeaderboard', () => {
    it('should generate leaderboard from user profiles', () => {
      const users = [
        mockUserProfile,
        { ...mockUserProfile, id: 'user_456', progress: { ...mockUserProfile.progress, totalPoints: 300 } },
        { ...mockUserProfile, id: 'user_789', progress: { ...mockUserProfile.progress, totalPoints: 200 } }
      ];

      const leaderboard = gamificationEngine.generateLeaderboard(users, 'all');

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].points).toBe(300);
      expect(leaderboard[1].points).toBe(200);
      expect(leaderboard[2].points).toBe(150);
    });

    it('should limit leaderboard to top 100', () => {
      const users = Array.from({ length: 150 }, (_, i) => ({
        ...mockUserProfile,
        id: `user_${i}`,
        progress: { ...mockUserProfile.progress, totalPoints: i }
      }));

      const leaderboard = gamificationEngine.generateLeaderboard(users, 'all');

      expect(leaderboard).toHaveLength(100);
    });

    it('should include correct user information', () => {
      const leaderboard = gamificationEngine.generateLeaderboard([mockUserProfile], 'all');

      expect(leaderboard[0].userId).toBe('user_123');
      expect(leaderboard[0].username).toBeDefined();
      expect(leaderboard[0].points).toBe(150);
      expect(leaderboard[0].level).toBe(3);
      expect(leaderboard[0].badges).toBe(0);
      expect(leaderboard[0].streak).toBe(5);
    });
  });

  describe('generateAchievementSummary', () => {
    it('should generate achievement summary', () => {
      const summary = gamificationEngine.generateAchievementSummary(mockUserProfile);

      expect(summary.currentLevel).toBe(3);
      expect(summary.totalPoints).toBe(150);
      expect(summary.pointsToNextLevel).toBeDefined();
      expect(summary.nextLevelPoints).toBeDefined();
      expect(summary.totalBadges).toBe(0);
      expect(summary.currentStreak).toBe(5);
      expect(summary.completedModules).toBe(0);
      expect(summary.recentBadges).toBeDefined();
      expect(summary.achievements).toBeDefined();
    });

    it('should calculate points to next level correctly', () => {
      const summary = gamificationEngine.generateAchievementSummary(mockUserProfile);

      expect(summary.pointsToNextLevel).toBeGreaterThan(0);
      expect(summary.pointsToNextLevel).toBe(summary.nextLevelPoints - summary.totalPoints);
    });

    it('should include recent badges', () => {
      const profileWithBadges = {
        ...mockUserProfile,
        progress: {
          ...mockUserProfile.progress,
          badges: [
            {
              id: 'badge_1',
              name: 'Test Badge',
              description: 'Test badge description',
              icon: '🏆',
              earnedAt: new Date(Date.now() - 1000),
              category: BadgeCategory.ACHIEVEMENT
            },
            {
              id: 'badge_2',
              name: 'Test Badge 2',
              description: 'Test badge description 2',
              icon: '🎯',
              earnedAt: new Date(Date.now() - 2000),
              category: BadgeCategory.ACHIEVEMENT
            }
          ]
        }
      };

      const summary = gamificationEngine.generateAchievementSummary(profileWithBadges);

      expect(summary.recentBadges).toHaveLength(2);
      expect(summary.recentBadges[0].id).toBe('badge_1'); // Most recent first
    });
  });

  describe('generateChallenges', () => {
    it('should generate challenges for user', () => {
      const challenges = gamificationEngine.generateChallenges(mockUserProfile);

      expect(challenges).toBeDefined();
      expect(Array.isArray(challenges)).toBe(true);
    });

    it('should include daily quiz challenge', () => {
      const challenges = gamificationEngine.generateChallenges(mockUserProfile);

      const dailyChallenge = challenges.find(c => c.id === 'daily_quiz');
      expect(dailyChallenge).toBeDefined();
      expect(dailyChallenge?.title).toBe('Daily Quiz Challenge');
      expect(dailyChallenge?.type).toBe('daily');
    });

    it('should include streak challenges for low streak users', () => {
      const challenges = gamificationEngine.generateChallenges(mockUserProfile);

      const streakChallenge = challenges.find(c => c.id === 'streak_7');
      expect(streakChallenge).toBeDefined();
      expect(streakChallenge?.type).toBe('streak');
    });

    it('should include category challenges', () => {
      const challenges = gamificationEngine.generateChallenges(mockUserProfile);

      const categoryChallenge = challenges.find(c => c.type === 'category');
      if (categoryChallenge) {
        expect(categoryChallenge.target).toBe(5);
        expect(categoryChallenge.reward).toBe(75);
      }
    });

    it('should generate challenges with correct structure', () => {
      const challenges = gamificationEngine.generateChallenges(mockUserProfile);

      challenges.forEach(challenge => {
        expect(challenge.id).toBeDefined();
        expect(challenge.title).toBeDefined();
        expect(challenge.description).toBeDefined();
        expect(challenge.type).toBeDefined();
        expect(challenge.target).toBeGreaterThan(0);
        expect(challenge.current).toBeGreaterThanOrEqual(0);
        expect(challenge.reward).toBeGreaterThan(0);
        expect(challenge.category).toBeDefined();
      });
    });
  });

  describe('trackInteraction', () => {
    it('should track user interaction', () => {
      const interaction = {
        type: 'quiz_answer' as const,
        timestamp: new Date(),
        data: { questionId: 'q1', answer: 'true' }
      };

      const analyticsData = gamificationEngine.trackInteraction(mockUserProfile, interaction);

      expect(analyticsData.userId).toBe('user_123');
      expect(analyticsData.event).toBe('quiz_answer');
      expect(analyticsData.data).toEqual(interaction.data);
    });
  });

  describe('error handling', () => {
    it('should handle invalid user profile gracefully', () => {
      const invalidProfile = { ...mockUserProfile, literacyLevel: 'invalid' as any };

      expect(() => {
        gamificationEngine.calculateQuizPoints(mockLearningSession, invalidProfile);
      }).toThrow();
    });

    it('should handle missing session data', () => {
      const incompleteSession = {
        id: 'incomplete',
        moduleId: 'test',
        startTime: new Date(),
        completed: false,
        interactions: []
      };

      const points = gamificationEngine.calculateQuizPoints(incompleteSession as any, mockUserProfile);

      expect(points).toBe(0);
    });

    it('should handle empty user list for leaderboard', () => {
      const leaderboard = gamificationEngine.generateLeaderboard([], 'all');

      expect(leaderboard).toHaveLength(0);
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        pointsPerQuiz: 100,
        pointsPerCorrectAnswer: 20,
        levelThresholds: [200, 500, 1000]
      };

      const customEngine = new GamificationEngine(customConfig);
      const points = customEngine.calculateQuizPoints(mockLearningSession, mockUserProfile);

      expect(points).toBeGreaterThanOrEqual(100);
    });

    it('should use default configuration when none provided', () => {
      const defaultEngine = new GamificationEngine();
      const points = defaultEngine.calculateQuizPoints(mockLearningSession, mockUserProfile);

      expect(points).toBeGreaterThanOrEqual(50); // Default base points
    });
  });
});