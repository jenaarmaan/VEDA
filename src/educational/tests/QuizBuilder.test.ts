/**
 * Unit tests for QuizBuilder
 */

import { QuizBuilder } from '../QuizBuilder';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  QuestionType,
  Quiz
} from '../types';

describe('QuizBuilder', () => {
  let quizBuilder: QuizBuilder;
  let mockUserProfile: UserProfile;
  let mockVerificationResults: VerificationResult[];

  beforeEach(() => {
    quizBuilder = new QuizBuilder();
    
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
      },
      {
        id: 'result_2',
        content: 'This is a true scientific fact.',
        verdict: 'true',
        confidence: 92,
        evidence: [
          {
            type: 'source_analysis',
            description: 'Verified by peer-reviewed research',
            reliability: 98,
            source: 'Nature.com'
          }
        ],
        source: 'news_article',
        timestamp: new Date(),
        category: MisinformationCategory.SCIENCE
      }
    ];
  });

  describe('generateQuiz', () => {
    it('should generate quiz with correct structure', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);

      expect(quiz).toBeDefined();
      expect(quiz.id).toMatch(/^quiz_\d+_user_123$/);
      expect(quiz.title).toBeDefined();
      expect(quiz.description).toBeDefined();
      expect(quiz.questions).toBeDefined();
      expect(quiz.difficulty).toBe(LiteracyLevel.INTERMEDIATE);
      expect(quiz.category).toBeDefined();
      expect(quiz.passingScore).toBeDefined();
      expect(quiz.metadata).toBeDefined();
    });

    it('should generate appropriate number of questions', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);

      expect(quiz.questions.length).toBeGreaterThan(0);
      expect(quiz.questions.length).toBeLessThanOrEqual(mockVerificationResults.length);
    });

    it('should respect question count option', () => {
      const quiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        mockUserProfile,
        { questionCount: 1 }
      );

      expect(quiz.questions).toHaveLength(1);
    });

    it('should generate questions with correct structure', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);
      const question = quiz.questions[0];

      expect(question.id).toMatch(/^q_result_\d+_/);
      expect(question.type).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
      expect(question.explanation).toBeDefined();
      expect(question.difficulty).toBe(LiteracyLevel.INTERMEDIATE);
      expect(question.points).toBeGreaterThan(0);
    });

    it('should calculate time limit based on questions and user level', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);

      expect(quiz.timeLimit).toBeDefined();
      expect(quiz.timeLimit).toBeGreaterThan(0);
    });

    it('should calculate passing score based on user level', () => {
      const beginnerQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER }
      );

      const advancedQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED }
      );

      expect(beginnerQuiz.passingScore).toBe(60);
      expect(advancedQuiz.passingScore).toBe(80);
    });

    it('should determine primary category correctly', () => {
      const healthResults = [
        { ...mockVerificationResults[0], category: MisinformationCategory.HEALTH },
        { ...mockVerificationResults[1], category: MisinformationCategory.HEALTH }
      ];

      const quiz = quizBuilder.generateQuiz(healthResults, mockUserProfile);

      expect(quiz.category).toBe(MisinformationCategory.HEALTH);
    });
  });

  describe('generateScenarioQuiz', () => {
    it('should generate scenario quiz with correct structure', () => {
      const scenarios = [
        {
          id: 'scenario_1',
          description: 'You see a health claim on social media. What should you do?',
          options: [
            'Share immediately',
            'Verify from reliable sources',
            'Ignore it',
            'Ask friends for their opinion'
          ],
          correctAnswer: 'Verify from reliable sources',
          explanation: 'Always verify health claims from reliable medical sources',
          category: MisinformationCategory.HEALTH,
          difficulty: LiteracyLevel.INTERMEDIATE
        }
      ];

      const quiz = quizBuilder.generateScenarioQuiz(scenarios, mockUserProfile);

      expect(quiz.id).toMatch(/^scenario_quiz_\d+_user_123$/);
      expect(quiz.title).toBe('Real-World Misinformation Scenarios');
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].type).toBe(QuestionType.SCENARIO);
    });
  });

  describe('generateAdaptiveQuiz', () => {
    it('should generate adaptive quiz for weak areas', () => {
      const weakAreas = ['basic_fact_checking', 'source_verification'];

      const quiz = quizBuilder.generateAdaptiveQuiz(mockUserProfile, weakAreas);

      expect(quiz.id).toMatch(/^adaptive_quiz_\d+_user_123$/);
      expect(quiz.title).toBe('Personalized Learning Quiz');
      expect(quiz.questions.length).toBeGreaterThan(0);
    });

    it('should respect question count option for adaptive quiz', () => {
      const weakAreas = ['basic_fact_checking'];

      const quiz = quizBuilder.generateAdaptiveQuiz(
        mockUserProfile,
        weakAreas,
        { questionCount: 3 }
      );

      expect(quiz.questions).toHaveLength(3);
    });
  });

  describe('exportQuizAsHTML', () => {
    it('should export quiz as HTML', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);
      const html = quizBuilder.exportQuizAsHTML(quiz, mockUserProfile);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(quiz.title);
      expect(html).toContain('quiz-container');
      expect(html).toContain('quiz-form');
    });

    it('should include quiz questions in HTML', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);
      const html = quizBuilder.exportQuizAsHTML(quiz, mockUserProfile);

      expect(html).toContain('question-container');
      expect(html).toContain('quiz-question');
    });
  });

  describe('exportQuizAsJSON', () => {
    it('should export quiz as valid JSON', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);
      const json = quizBuilder.exportQuizAsJSON(quiz);

      expect(() => JSON.parse(json)).not.toThrow();
      
      const parsedQuiz = JSON.parse(json);
      expect(parsedQuiz.id).toBe(quiz.id);
      expect(parsedQuiz.title).toBe(quiz.title);
      expect(parsedQuiz.questions).toHaveLength(quiz.questions.length);
    });
  });

  describe('question generation', () => {
    it('should generate multiple choice questions', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);
      const mcQuestion = quiz.questions.find(q => q.type === QuestionType.MULTIPLE_CHOICE);

      if (mcQuestion) {
        expect(mcQuestion.options).toBeDefined();
        expect(mcQuestion.options!.length).toBeGreaterThan(1);
        expect(mcQuestion.correctAnswer).toBeDefined();
      }
    });

    it('should generate true/false questions', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);
      const tfQuestion = quiz.questions.find(q => q.type === QuestionType.TRUE_FALSE);

      if (tfQuestion) {
        expect(tfQuestion.correctAnswer).toMatch(/^(true|false)$/);
      }
    });

    it('should generate scenario questions for advanced users', () => {
      const advancedProfile = { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED };
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, advancedProfile);
      const scenarioQuestion = quiz.questions.find(q => q.type === QuestionType.SCENARIO);

      // Scenario questions may or may not be generated based on random selection
      if (scenarioQuestion) {
        expect(scenarioQuestion.options).toBeDefined();
        expect(scenarioQuestion.correctAnswer).toBeDefined();
      }
    });

    it('should generate appropriate explanations for different user levels', () => {
      const beginnerQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER }
      );

      const advancedQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED }
      );

      const beginnerExplanation = beginnerQuiz.questions[0].explanation;
      const advancedExplanation = advancedQuiz.questions[0].explanation;

      expect(beginnerExplanation).toContain('Always check facts');
      expect(advancedExplanation).toContain('Comprehensive analysis');
    });
  });

  describe('error handling', () => {
    it('should handle empty verification results', () => {
      const quiz = quizBuilder.generateQuiz([], mockUserProfile);

      expect(quiz.questions).toHaveLength(0);
    });

    it('should handle invalid user profile', () => {
      const invalidProfile = { ...mockUserProfile, literacyLevel: 'invalid' as any };

      expect(() => {
        quizBuilder.generateQuiz(mockVerificationResults, invalidProfile);
      }).toThrow();
    });

    it('should handle missing quiz data gracefully', () => {
      const incompleteResults = [
        {
          id: 'incomplete',
          content: '',
          verdict: 'uncertain' as const,
          confidence: 0,
          evidence: [],
          source: '',
          timestamp: new Date(),
          category: MisinformationCategory.GENERAL
        }
      ];

      const quiz = quizBuilder.generateQuiz(incompleteResults, mockUserProfile);

      expect(quiz).toBeDefined();
      expect(quiz.questions.length).toBeGreaterThan(0);
    });
  });

  describe('content quality', () => {
    it('should generate appropriate titles based on user level', () => {
      const beginnerQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER }
      );

      const advancedQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED }
      );

      expect(beginnerQuiz.title).toContain('Quick Quiz');
      expect(advancedQuiz.title).toContain('Advanced Analysis Quiz');
    });

    it('should generate appropriate descriptions based on user level', () => {
      const beginnerQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER }
      );

      const advancedQuiz = quizBuilder.generateQuiz(
        mockVerificationResults,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED }
      );

      expect(beginnerQuiz.description).toContain('simple questions');
      expect(advancedQuiz.description).toContain('complex scenarios');
    });

    it('should calculate appropriate points for questions', () => {
      const quiz = quizBuilder.generateQuiz(mockVerificationResults, mockUserProfile);

      quiz.questions.forEach(question => {
        expect(question.points).toBeGreaterThan(0);
        expect(question.points).toBeLessThanOrEqual(50);
      });
    });
  });
});