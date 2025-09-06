/**
 * Integration tests for different user scenarios in the VEDA Educational Content Agent
 */

import { EducationalAgent } from '../../EducationalAgent';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  ContentType,
  LearningSession
} from '../../types';

describe('VEDA Educational Agent - User Scenarios', () => {
  let educationalAgent: EducationalAgent;

  beforeEach(() => {
    educationalAgent = new EducationalAgent();
  });

  describe('Beginner User Journey', () => {
    it('should guide a beginner user through their first learning experience', async () => {
      // Create a beginner user profile
      const beginnerProfile: UserProfile = {
        id: 'beginner_user_001',
        literacyLevel: LiteracyLevel.BEGINNER,
        language: 'en',
        preferences: {
          difficulty: 'beginner',
          learningStyle: 'visual',
          topics: ['health'],
          notifications: true
        },
        progress: {
          totalPoints: 0,
          level: 1,
          badges: [],
          completedModules: [],
          streak: 0,
          lastActivity: new Date()
        },
        learningHistory: []
      };

      // Simulate verification results for health misinformation
      const healthMisinformation: VerificationResult[] = [
        {
          id: 'health_claim_001',
          content: 'Drinking hot water with lemon cures all diseases instantly.',
          verdict: 'false',
          confidence: 95,
          evidence: [
            {
              type: 'fact_check',
              description: 'No scientific evidence supports this claim',
              reliability: 98,
              source: 'Mayo Clinic'
            }
          ],
          source: 'social_media',
          timestamp: new Date(),
          category: MisinformationCategory.HEALTH
        }
      ];

      // Process verification results and generate educational content
      const session = await educationalAgent.processVerificationResults({
        userId: beginnerProfile.id,
        verificationResults: healthMisinformation,
        contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
      });

      // Verify beginner-appropriate content was generated
      expect(session.content.length).toBeGreaterThan(0);
      expect(session.content[0].difficulty).toBe(LiteracyLevel.BEGINNER);
      expect(session.content[0].content).toContain('This information is FALSE');
      expect(session.content[0].content).toContain('What this means:');

      // Verify quiz was generated with appropriate difficulty
      expect(session.quizzes.length).toBeGreaterThan(0);
      expect(session.quizzes[0].difficulty).toBe(LiteracyLevel.BEGINNER);
      expect(session.quizzes[0].passingScore).toBe(60);

      // Verify recommendations were generated
      expect(session.recommendations.length).toBeGreaterThan(0);

      // Complete the quiz session
      const quizResults = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 80,
          answers: { 'q1': 'false' },
          timeSpent: 180
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, quizResults);

      // Verify user progress was updated
      expect(updatedProfile.progress.totalPoints).toBeGreaterThan(0);
      expect(updatedProfile.progress.badges.length).toBeGreaterThan(0);
      expect(updatedProfile.learningHistory.length).toBe(1);
      expect(updatedProfile.learningHistory[0].score).toBe(80);
    });
  });

  describe('Intermediate User Progression', () => {
    it('should help an intermediate user improve their verification skills', async () => {
      // Create an intermediate user with some learning history
      const intermediateProfile: UserProfile = {
        id: 'intermediate_user_001',
        literacyLevel: LiteracyLevel.INTERMEDIATE,
        language: 'en',
        preferences: {
          difficulty: 'intermediate',
          learningStyle: 'interactive',
          topics: ['science', 'technology'],
          notifications: true
        },
        progress: {
          totalPoints: 250,
          level: 4,
          badges: [
            {
              id: 'first_quiz',
              name: 'First Steps',
              description: 'Completed your first quiz',
              icon: '🎯',
              earnedAt: new Date(),
              category: 'achievement' as any
            }
          ],
          completedModules: ['module_health_basics'],
          streak: 3,
          lastActivity: new Date()
        },
        learningHistory: [
          {
            id: 'session_001',
            moduleId: 'module_health_basics',
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
            score: 75,
            completed: true,
            interactions: []
          }
        ]
      };

      // Simulate science misinformation
      const scienceMisinformation: VerificationResult[] = [
        {
          id: 'science_claim_001',
          content: 'Climate change is a hoax created by scientists for funding.',
          verdict: 'false',
          confidence: 98,
          evidence: [
            {
              type: 'source_analysis',
              description: 'Overwhelming scientific consensus supports climate change',
              reliability: 99,
              source: 'IPCC Reports'
            },
            {
              type: 'fact_check',
              description: 'Multiple independent studies confirm climate change',
              reliability: 97,
              source: 'Nature Climate Change'
            }
          ],
          source: 'news_article',
          timestamp: new Date(),
          category: MisinformationCategory.SCIENCE
        }
      ];

      // Generate adaptive quiz based on user's weak areas
      const adaptiveQuiz = await educationalAgent.generateAdaptiveQuiz(intermediateProfile.id);

      expect(adaptiveQuiz).toBeDefined();
      expect(adaptiveQuiz.title).toBe('Personalized Learning Quiz');
      expect(adaptiveQuiz.questions.length).toBeGreaterThan(0);

      // Process verification results
      const session = await educationalAgent.processVerificationResults({
        userId: intermediateProfile.id,
        verificationResults: scienceMisinformation,
        contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
      });

      // Verify intermediate-appropriate content
      expect(session.content[0].difficulty).toBe(LiteracyLevel.INTERMEDIATE);
      expect(session.content[0].content).toContain('Verified as FALSE');
      expect(session.content[0].content).toContain('Analysis Summary');

      // Complete session with high score
      const quizResults = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 95,
          answers: { 'q1': 'false', 'q2': 'true' },
          timeSpent: 240
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, quizResults);

      // Verify progression
      expect(updatedProfile.progress.totalPoints).toBeGreaterThan(250);
      expect(updatedProfile.progress.badges.length).toBeGreaterThan(1);
      expect(updatedProfile.learningHistory.length).toBe(2);
    });
  });

  describe('Advanced User Mastery', () => {
    it('should provide advanced users with complex scenarios and critical thinking challenges', async () => {
      // Create an advanced user with extensive learning history
      const advancedProfile: UserProfile = {
        id: 'advanced_user_001',
        literacyLevel: LiteracyLevel.ADVANCED,
        language: 'en',
        preferences: {
          difficulty: 'advanced',
          learningStyle: 'interactive',
          topics: ['politics', 'science', 'technology', 'economy'],
          notifications: true
        },
        progress: {
          totalPoints: 1200,
          level: 8,
          badges: [
            {
              id: 'quiz_master',
              name: 'Quiz Master',
              description: 'Completed 10 quizzes',
              icon: '🏆',
              earnedAt: new Date(),
              category: 'achievement' as any
            },
            {
              id: 'streak_7',
              name: 'Consistent Learner',
              description: 'Maintained a 7-day learning streak',
              icon: '🔥',
              earnedAt: new Date(),
              category: 'skill' as any
            }
          ],
          completedModules: ['module_health_basics', 'module_science_verification', 'module_political_fact_checking'],
          streak: 12,
          lastActivity: new Date()
        },
        learningHistory: Array.from({ length: 15 }, (_, i) => ({
          id: `session_${i}`,
          moduleId: `module_${i}`,
          startTime: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
          score: 85 + Math.floor(Math.random() * 15),
          completed: true,
          interactions: []
        }))
      };

      // Simulate complex political misinformation
      const politicalMisinformation: VerificationResult[] = [
        {
          id: 'political_claim_001',
          content: 'The election was stolen through widespread voter fraud using voting machines.',
          verdict: 'false',
          confidence: 92,
          evidence: [
            {
              type: 'source_analysis',
              description: 'Multiple independent audits found no evidence of widespread fraud',
              reliability: 96,
              source: 'Bipartisan Policy Center'
            },
            {
              type: 'fact_check',
              description: 'Voting machine security experts confirm systems are secure',
              reliability: 94,
              source: 'MIT Technology Review'
            }
          ],
          source: 'news_article',
          timestamp: new Date(),
          category: MisinformationCategory.POLITICS
        }
      ];

      // Process verification results
      const session = await educationalAgent.processVerificationResults({
        userId: advancedProfile.id,
        verificationResults: politicalMisinformation,
        contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
      });

      // Verify advanced content
      expect(session.content[0].difficulty).toBe(LiteracyLevel.ADVANCED);
      expect(session.content[0].content).toContain('VERIFIED: FALSE');
      expect(session.content[0].content).toContain('Methodological Considerations');
      expect(session.content[0].content).toContain('Comprehensive Analysis');

      // Verify advanced quiz with scenarios
      expect(session.quizzes[0].difficulty).toBe(LiteracyLevel.ADVANCED);
      expect(session.quizzes[0].passingScore).toBe(80);

      // Complete session
      const quizResults = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 100,
          answers: { 'q1': 'false', 'q2': 'true', 'q3': 'false' },
          timeSpent: 180
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, quizResults);

      // Verify advanced user progression
      expect(updatedProfile.progress.totalPoints).toBeGreaterThan(1200);
      expect(updatedProfile.progress.badges.length).toBeGreaterThan(2);
    });
  });

  describe('Multi-Language Support', () => {
    it('should handle users with different language preferences', async () => {
      const spanishUser: UserProfile = {
        id: 'spanish_user_001',
        literacyLevel: LiteracyLevel.INTERMEDIATE,
        language: 'es',
        preferences: {
          difficulty: 'intermediate',
          learningStyle: 'interactive',
          topics: ['health'],
          notifications: true
        },
        progress: {
          totalPoints: 100,
          level: 2,
          badges: [],
          completedModules: [],
          streak: 1,
          lastActivity: new Date()
        },
        learningHistory: []
      };

      const healthClaim: VerificationResult[] = [
        {
          id: 'health_claim_es_001',
          content: 'El agua con limón cura todas las enfermedades.',
          verdict: 'false',
          confidence: 90,
          evidence: [
            {
              type: 'fact_check',
              description: 'No hay evidencia científica que respalde esta afirmación',
              reliability: 95,
              source: 'Clínica Mayo'
            }
          ],
          source: 'social_media',
          timestamp: new Date(),
          category: MisinformationCategory.HEALTH
        }
      ];

      const session = await educationalAgent.processVerificationResults({
        userId: spanishUser.id,
        verificationResults: healthClaim,
        contentType: [ContentType.EXPLANATION]
      });

      expect(session.content[0].language).toBe('es');
      expect(session.content[0].difficulty).toBe(LiteracyLevel.INTERMEDIATE);
    });
  });

  describe('Adaptive Learning Path', () => {
    it('should adapt content based on user performance patterns', async () => {
      const strugglingUser: UserProfile = {
        id: 'struggling_user_001',
        literacyLevel: LiteracyLevel.INTERMEDIATE,
        language: 'en',
        preferences: {
          difficulty: 'intermediate',
          learningStyle: 'visual',
          topics: ['health', 'science'],
          notifications: true
        },
        progress: {
          totalPoints: 200,
          level: 3,
          badges: [],
          completedModules: [],
          streak: 1,
          lastActivity: new Date()
        },
        learningHistory: [
          {
            id: 'session_001',
            moduleId: 'module_health_basics',
            startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
            score: 45, // Low score
            completed: true,
            interactions: []
          },
          {
            id: 'session_002',
            moduleId: 'module_science_basics',
            startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
            score: 50, // Low score
            completed: true,
            interactions: []
          }
        ]
      };

      // Generate adaptive quiz to address weak areas
      const adaptiveQuiz = await educationalAgent.generateAdaptiveQuiz(strugglingUser.id);

      expect(adaptiveQuiz.questions.length).toBeGreaterThan(0);
      expect(adaptiveQuiz.title).toBe('Personalized Learning Quiz');

      // Get personalized recommendations
      const recommendations = await educationalAgent.getPersonalizedRecommendations(strugglingUser.id);

      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should include recommendations for improving basic skills
      const basicSkillsRec = recommendations.find(r => r.id === 'improve_basics');
      expect(basicSkillsRec).toBeDefined();
      expect(basicSkillsRec?.title).toContain('Foundation');
    });
  });

  describe('Gamification and Engagement', () => {
    it('should maintain user engagement through gamification elements', async () => {
      const engagedUser: UserProfile = {
        id: 'engaged_user_001',
        literacyLevel: LiteracyLevel.INTERMEDIATE,
        language: 'en',
        preferences: {
          difficulty: 'intermediate',
          learningStyle: 'interactive',
          topics: ['health', 'science', 'technology'],
          notifications: true
        },
        progress: {
          totalPoints: 500,
          level: 5,
          badges: [
            {
              id: 'first_quiz',
              name: 'First Steps',
              description: 'Completed your first quiz',
              icon: '🎯',
              earnedAt: new Date(),
              category: 'achievement' as any
            },
            {
              id: 'quiz_master',
              name: 'Quiz Master',
              description: 'Completed 10 quizzes',
              icon: '🏆',
              earnedAt: new Date(),
              category: 'achievement' as any
            }
          ],
          completedModules: ['module_health_basics', 'module_science_verification'],
          streak: 7,
          lastActivity: new Date()
        },
        learningHistory: Array.from({ length: 12 }, (_, i) => ({
          id: `session_${i}`,
          moduleId: `module_${i}`,
          startTime: new Date(Date.now() - (12 - i) * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - (12 - i) * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
          score: 80 + Math.floor(Math.random() * 20),
          completed: true,
          interactions: []
        }))
      };

      // Generate challenges for the user
      const challenges = await educationalAgent.getPersonalizedRecommendations(engagedUser.id);

      expect(challenges.length).toBeGreaterThan(0);

      // Complete a perfect quiz to test badge system
      const session = await educationalAgent.startLearningSession(engagedUser.id, 'quiz');
      
      const perfectResults = {
        quizResults: {
          quizId: session.quizzes[0].id,
          score: 100,
          answers: { 'q1': 'true', 'q2': 'false' },
          timeSpent: 120
        }
      };

      const updatedProfile = await educationalAgent.completeLearningSession(session.id, perfectResults);

      // Should have earned perfect score badge
      const perfectBadge = updatedProfile.progress.badges.find(b => b.id === 'perfect_score');
      expect(perfectBadge).toBeDefined();
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle users with incomplete or corrupted data gracefully', async () => {
      const corruptedUser: UserProfile = {
        id: 'corrupted_user_001',
        literacyLevel: LiteracyLevel.BEGINNER,
        language: 'en',
        preferences: {
          difficulty: 'beginner',
          learningStyle: 'interactive',
          topics: [],
          notifications: true
        },
        progress: {
          totalPoints: -50, // Invalid negative points
          level: 0, // Invalid level
          badges: [],
          completedModules: ['invalid_module'],
          streak: -1, // Invalid negative streak
          lastActivity: new Date()
        },
        learningHistory: [
          {
            id: 'corrupted_session',
            moduleId: 'invalid_module',
            startTime: new Date(),
            endTime: new Date(Date.now() - 1000), // End before start
            score: 150, // Invalid score > 100
            completed: false,
            interactions: []
          }
        ]
      };

      // Should handle corrupted data gracefully
      const session = await educationalAgent.startLearningSession(corruptedUser.id, 'quiz');
      expect(session).toBeDefined();

      const recommendations = await educationalAgent.getPersonalizedRecommendations(corruptedUser.id);
      expect(recommendations).toBeDefined();
    });

    it('should handle network failures and timeouts gracefully', async () => {
      // Simulate processing with empty results
      const session = await educationalAgent.processVerificationResults({
        userId: 'test_user',
        verificationResults: [],
        contentType: [ContentType.EXPLANATION]
      });

      expect(session).toBeDefined();
      expect(session.content).toHaveLength(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent users efficiently', async () => {
      const userIds = Array.from({ length: 10 }, (_, i) => `concurrent_user_${i}`);
      const sessions = await Promise.all(
        userIds.map(userId => 
          educationalAgent.startLearningSession(userId, 'quiz')
        )
      );

      expect(sessions).toHaveLength(10);
      sessions.forEach(session => {
        expect(session).toBeDefined();
        expect(session.userId).toMatch(/^concurrent_user_\d+$/);
      });

      // Clean up sessions
      sessions.forEach(session => {
        educationalAgent.cleanupExpiredSessions();
      });
    });

    it('should handle large verification result sets', async () => {
      const largeResultSet: VerificationResult[] = Array.from({ length: 50 }, (_, i) => ({
        id: `result_${i}`,
        content: `Test content ${i}`,
        verdict: i % 3 === 0 ? 'true' : i % 3 === 1 ? 'false' : 'uncertain',
        confidence: 70 + (i % 30),
        evidence: [
          {
            type: 'fact_check',
            description: `Evidence ${i}`,
            reliability: 80 + (i % 20),
            source: `Source ${i}`
          }
        ],
        source: 'test',
        timestamp: new Date(),
        category: MisinformationCategory.GENERAL
      }));

      const session = await educationalAgent.processVerificationResults({
        userId: 'test_user_large',
        verificationResults: largeResultSet,
        contentType: [ContentType.EXPLANATION, ContentType.QUIZ]
      });

      expect(session).toBeDefined();
      expect(session.content.length).toBeGreaterThan(0);
      expect(session.quizzes.length).toBeGreaterThan(0);
    });
  });
});