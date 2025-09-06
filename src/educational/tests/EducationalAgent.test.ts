/**
 * Unit tests for EducationalAgent
 */

import { EducationalAgent } from '../EducationalAgent';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  ContentType,
  LearningSession
} from '../types';

describe('EducationalAgent', () => {
  let educationalAgent: EducationalAgent;
  let mockUserProfile: UserProfile;
  let mockVerificationResults: VerificationResult[];

  beforeEach(() => {
    educationalAgent = new EducationalAgent();
    
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

    mockVerificationResults = [
      {
        id: 'result_1',
        content: 'This is a test health claim that is false.',
        verdict: 'false',
        confidence: 85,
        evidence: [
          {
            type: 'fact_check',
            description: 'Fact-checked by multiple sources',
            reliability: 95,
            source: 'Snopes.com'
          }
        ],
        source: 'social_media',
        timestamp: new Date(),
        category: MisinformationCategory.HEALTH
      }
    ];
  });

  describe('processVerificationResults', () => {
    it('should process verification results and generate educational content', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session_\d+_user_123$/);
      expect(session.userId).toBe('user_123');
      expect(session.startTime).toBeDefined();
      expect(session.content).toBeDefined();
      expect(session.quizzes).toBeDefined();
      expect(session.recommendations).toBeDefined();
    });

    it('should generate explanations when requested', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.EXPLANATION],
        options: { includeExplanations: true }
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session.content.length).toBeGreaterThan(0);
      expect(session.content[0].type).toBe('explanation');
    });

    it('should generate quizzes when requested', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.QUIZ],
        options: { includeQuizzes: true }
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session.quizzes.length).toBeGreaterThan(0);
      expect(session.quizzes[0].questions).toBeDefined();
    });

    it('should generate recommendations when requested', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.RECOMMENDATION],
        options: { includeRecommendations: true }
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session.recommendations.length).toBeGreaterThan(0);
      expect(session.recommendations[0].title).toBeDefined();
    });

    it('should respect content generation options', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.QUIZ],
        options: { 
          includeQuizzes: true,
          includeExplanations: false,
          includeRecommendations: false,
          quizCount: 3
        }
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session.content.length).toBe(0);
      expect(session.quizzes.length).toBeGreaterThan(0);
      expect(session.recommendations.length).toBe(0);
    });

    it('should track session analytics when enabled', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.EXPLANATION]
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session.analytics.length).toBeGreaterThan(0);
      expect(session.analytics[0].event).toBe('session_start');
    });
  });

  describe('startLearningSession', () => {
    it('should start a new learning session', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'exploration');

      expect(session).toBeDefined();
      expect(session.userId).toBe('user_123');
      expect(session.startTime).toBeDefined();
      expect(session.endTime).toBeUndefined();
    });

    it('should generate quiz session when requested', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');

      expect(session.quizzes.length).toBeGreaterThan(0);
    });

    it('should generate tutorial session when requested', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'tutorial');

      expect(session.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate exploration session by default', async () => {
      const session = await educationalAgent.startLearningSession('user_123');

      expect(session.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('completeLearningSession', () => {
    it('should complete a learning session and update user progress', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      const results = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 85,
          answers: { 'q1': 'true' },
          timeSpent: 300
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, results);

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.learningHistory.length).toBeGreaterThan(0);
      expect(updatedProfile.learningHistory[0].score).toBe(85);
    });

    it('should update gamification when enabled', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      const results = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 100,
          answers: { 'q1': 'true' },
          timeSpent: 200
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, results);

      expect(updatedProfile.progress.totalPoints).toBeGreaterThan(mockUserProfile.progress.totalPoints);
    });

    it('should track session completion analytics', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      const results = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 75,
          answers: { 'q1': 'false' },
          timeSpent: 400
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, results);

      expect(updatedProfile).toBeDefined();
      // Session should be removed from active sessions
      expect(educationalAgent.getActiveSessions('user_123')).toHaveLength(0);
    });

    it('should throw error for non-existent session', async () => {
      const results = {
        quizResults: {
          quizId: 'non_existent',
          score: 85,
          answers: {},
          timeSpent: 300
        }
      };

      await expect(
        educationalAgent.completeLearningSession('non_existent_session', results)
      ).rejects.toThrow('Session non_existent_session not found');
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('should generate personalized recommendations', async () => {
      const recommendations = await educationalAgent.getPersonalizedRecommendations('user_123');

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should generate recommendations with context', async () => {
      const context = {
        currentEvent: 'health_crisis',
        trendingTopics: ['vaccines', 'health'],
        userGoals: ['improve_verification_skills']
      };

      const recommendations = await educationalAgent.getPersonalizedRecommendations('user_123', context);

      expect(recommendations).toBeDefined();
    });
  });

  describe('generateAdaptiveQuiz', () => {
    it('should generate adaptive quiz for user', async () => {
      const quiz = await educationalAgent.generateAdaptiveQuiz('user_123');

      expect(quiz).toBeDefined();
      expect(quiz.id).toMatch(/^adaptive_quiz_\d+_user_123$/);
      expect(quiz.questions).toBeDefined();
    });
  });

  describe('trackInteraction', () => {
    it('should track user interaction within session', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      
      const interaction = {
        type: 'quiz_answer' as const,
        timestamp: new Date(),
        data: { questionId: 'q1', answer: 'true' }
      };

      educationalAgent.trackInteraction(session.id, interaction);

      expect(session.interactions.length).toBe(1);
      expect(session.interactions[0]).toEqual(interaction);
    });

    it('should handle tracking for non-existent session', () => {
      const interaction = {
        type: 'quiz_answer' as const,
        timestamp: new Date(),
        data: { questionId: 'q1', answer: 'true' }
      };

      // Should not throw error
      expect(() => {
        educationalAgent.trackInteraction('non_existent', interaction);
      }).not.toThrow();
    });
  });

  describe('getUserProgressAnalytics', () => {
    it('should generate progress analytics for user', async () => {
      const analytics = await educationalAgent.getUserProgressAnalytics('user_123', 'month');

      expect(analytics).toBeDefined();
      expect(analytics.userId).toBe('user_123');
      expect(analytics.period).toBe('month');
      expect(analytics.totalSessions).toBeDefined();
      expect(analytics.averageScore).toBeDefined();
      expect(analytics.completedModules).toBeDefined();
      expect(analytics.timeSpent).toBeDefined();
      expect(analytics.improvementAreas).toBeDefined();
    });

    it('should generate analytics for different timeframes', async () => {
      const weekAnalytics = await educationalAgent.getUserProgressAnalytics('user_123', 'week');
      const yearAnalytics = await educationalAgent.getUserProgressAnalytics('user_123', 'year');

      expect(weekAnalytics.period).toBe('week');
      expect(yearAnalytics.period).toBe('year');
    });
  });

  describe('exportContent', () => {
    it('should export session as HTML', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      const html = educationalAgent.exportContent(session.id, 'html');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(session.id);
    });

    it('should export session as JSON', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      const json = educationalAgent.exportContent(session.id, 'json');

      expect(() => JSON.parse(json)).not.toThrow();
      const parsedSession = JSON.parse(json);
      expect(parsedSession.id).toBe(session.id);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        educationalAgent.exportContent('non_existent', 'html');
      }).toThrow('Session non_existent not found');
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions for user', async () => {
      const session1 = await educationalAgent.startLearningSession('user_123', 'quiz');
      const session2 = await educationalAgent.startLearningSession('user_123', 'tutorial');

      const activeSessions = educationalAgent.getActiveSessions('user_123');

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.id)).toContain(session1.id);
      expect(activeSessions.map(s => s.id)).toContain(session2.id);
    });

    it('should return empty array for user with no active sessions', () => {
      const activeSessions = educationalAgent.getActiveSessions('user_456');

      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');
      
      // Manually set session start time to be old
      session.startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      educationalAgent.cleanupExpiredSessions();

      const activeSessions = educationalAgent.getActiveSessions('user_123');
      expect(activeSessions).toHaveLength(0);
    });

    it('should not clean up active sessions', async () => {
      const session = await educationalAgent.startLearningSession('user_123', 'quiz');

      educationalAgent.cleanupExpiredSessions();

      const activeSessions = educationalAgent.getActiveSessions('user_123');
      expect(activeSessions).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid user ID gracefully', async () => {
      const request = {
        userId: '',
        verificationResults: mockVerificationResults,
        contentType: [ContentType.EXPLANATION]
      };

      await expect(
        educationalAgent.processVerificationResults(request)
      ).rejects.toThrow();
    });

    it('should handle empty verification results', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: [],
        contentType: [ContentType.EXPLANATION]
      };

      const session = await educationalAgent.processVerificationResults(request);

      expect(session).toBeDefined();
      expect(session.content).toHaveLength(0);
    });

    it('should handle invalid content types', async () => {
      const request = {
        userId: 'user_123',
        verificationResults: mockVerificationResults,
        contentType: ['invalid_type' as any]
      };

      await expect(
        educationalAgent.processVerificationResults(request)
      ).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        enableGamification: false,
        enablePersonalization: false,
        enableAnalytics: false,
        maxRecommendations: 5
      };

      const customAgent = new EducationalAgent(customConfig);

      expect(customAgent).toBeDefined();
    });

    it('should use default configuration when none provided', () => {
      const defaultAgent = new EducationalAgent();

      expect(defaultAgent).toBeDefined();
    });
  });
});