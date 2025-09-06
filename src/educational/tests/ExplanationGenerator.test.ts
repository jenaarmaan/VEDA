/**
 * Unit tests for ExplanationGenerator
 */

import { ExplanationGenerator } from '../ExplanationGenerator';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  Evidence
} from '../types';

describe('ExplanationGenerator', () => {
  let explanationGenerator: ExplanationGenerator;
  let mockUserProfile: UserProfile;
  let mockVerificationResult: VerificationResult;

  beforeEach(() => {
    explanationGenerator = new ExplanationGenerator();
    
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

    mockVerificationResult = {
      id: 'result_123',
      content: 'This is a test verification result about health information.',
      verdict: 'false',
      confidence: 85,
      evidence: [
        {
          type: 'fact_check',
          description: 'Multiple fact-checking organizations have debunked this claim',
          reliability: 95,
          source: 'Snopes.com'
        }
      ],
      source: 'social_media',
      timestamp: new Date(),
      category: MisinformationCategory.HEALTH
    };
  });

  describe('generateExplanation', () => {
    it('should generate explanation for intermediate level user', () => {
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        mockUserProfile
      );

      expect(explanation).toBeDefined();
      expect(explanation.id).toBe('explanation_result_123');
      expect(explanation.type).toBe('explanation');
      expect(explanation.difficulty).toBe(LiteracyLevel.INTERMEDIATE);
      expect(explanation.language).toBe('en');
      expect(explanation.category).toBe(MisinformationCategory.HEALTH);
      expect(explanation.content).toContain('Verified as FALSE');
      expect(explanation.content).toContain('85%');
      expect(explanation.metadata.estimatedTime).toBeGreaterThan(0);
    });

    it('should generate explanation for beginner level user', () => {
      const beginnerProfile = { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER };
      
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        beginnerProfile
      );

      expect(explanation.difficulty).toBe(LiteracyLevel.BEGINNER);
      expect(explanation.content).toContain('This information is FALSE');
      expect(explanation.content).toContain('What this means:');
    });

    it('should generate explanation for advanced level user', () => {
      const advancedProfile = { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED };
      
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        advancedProfile
      );

      expect(explanation.difficulty).toBe(LiteracyLevel.ADVANCED);
      expect(explanation.content).toContain('VERIFIED: FALSE');
      expect(explanation.content).toContain('Methodological Considerations');
    });

    it('should handle true verdict correctly', () => {
      const trueResult = { ...mockVerificationResult, verdict: 'true' as const };
      
      const explanation = explanationGenerator.generateExplanation(
        trueResult,
        mockUserProfile
      );

      expect(explanation.content).toContain('Verified as TRUE');
    });

    it('should handle uncertain verdict correctly', () => {
      const uncertainResult = { ...mockVerificationResult, verdict: 'uncertain' as const };
      
      const explanation = explanationGenerator.generateExplanation(
        uncertainResult,
        mockUserProfile
      );

      expect(explanation.content).toContain('Verification INCONCLUSIVE');
    });

    it('should include evidence in explanation when available', () => {
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        mockUserProfile
      );

      expect(explanation.content).toContain('Supporting Evidence');
      expect(explanation.content).toContain('Multiple fact-checking organizations');
    });

    it('should handle missing evidence gracefully', () => {
      const resultWithoutEvidence = { ...mockVerificationResult, evidence: [] };
      
      const explanation = explanationGenerator.generateExplanation(
        resultWithoutEvidence,
        mockUserProfile
      );

      expect(explanation).toBeDefined();
      expect(explanation.content).not.toContain('Supporting Evidence');
    });

    it('should calculate reading time correctly', () => {
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        mockUserProfile
      );

      expect(explanation.metadata.estimatedTime).toBeGreaterThan(0);
      expect(typeof explanation.metadata.estimatedTime).toBe('number');
    });

    it('should extract tags correctly', () => {
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        mockUserProfile
      );

      expect(explanation.metadata.tags).toContain('health');
      expect(explanation.metadata.tags).toContain('false');
      expect(explanation.metadata.tags).toContain('fact_check');
    });
  });

  describe('generateBatchExplanations', () => {
    it('should generate multiple explanations', () => {
      const results = [
        mockVerificationResult,
        { ...mockVerificationResult, id: 'result_456', verdict: 'true' as const }
      ];

      const explanations = explanationGenerator.generateBatchExplanations(
        results,
        mockUserProfile
      );

      expect(explanations).toHaveLength(2);
      expect(explanations[0].id).toBe('explanation_result_123');
      expect(explanations[1].id).toBe('explanation_result_456');
    });

    it('should handle empty results array', () => {
      const explanations = explanationGenerator.generateBatchExplanations(
        [],
        mockUserProfile
      );

      expect(explanations).toHaveLength(0);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for multiple results', () => {
      const results = [
        { ...mockVerificationResult, verdict: 'true' as const },
        { ...mockVerificationResult, id: 'result_456', verdict: 'false' as const },
        { ...mockVerificationResult, id: 'result_789', verdict: 'uncertain' as const }
      ];

      const summary = explanationGenerator.generateSummary(results, mockUserProfile);

      expect(summary).toContain('3');
      expect(summary).toContain('1'); // true count
      expect(summary).toContain('1'); // false count
      expect(summary).toContain('1'); // uncertain count
    });

    it('should handle empty results for summary', () => {
      const summary = explanationGenerator.generateSummary([], mockUserProfile);

      expect(summary).toContain('0');
    });
  });

  describe('error handling', () => {
    it('should handle invalid user profile gracefully', () => {
      const invalidProfile = { ...mockUserProfile, literacyLevel: 'invalid' as any };
      
      expect(() => {
        explanationGenerator.generateExplanation(mockVerificationResult, invalidProfile);
      }).toThrow();
    });

    it('should handle missing verification result data', () => {
      const incompleteResult = {
        id: 'incomplete',
        content: '',
        verdict: 'uncertain' as const,
        confidence: 0,
        evidence: [],
        source: '',
        timestamp: new Date(),
        category: MisinformationCategory.GENERAL
      };

      const explanation = explanationGenerator.generateExplanation(
        incompleteResult,
        mockUserProfile
      );

      expect(explanation).toBeDefined();
      expect(explanation.content).toContain('Verification INCONCLUSIVE');
    });
  });

  describe('language support', () => {
    it('should handle different languages', () => {
      const spanishProfile = { ...mockUserProfile, language: 'es' };
      
      // Should fallback to English if Spanish template not available
      const explanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        spanishProfile
      );

      expect(explanation).toBeDefined();
      expect(explanation.language).toBe('es');
    });
  });

  describe('content quality', () => {
    it('should generate appropriate title based on user level', () => {
      const beginnerExplanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.BEGINNER }
      );

      const advancedExplanation = explanationGenerator.generateExplanation(
        mockVerificationResult,
        { ...mockUserProfile, literacyLevel: LiteracyLevel.ADVANCED }
      );

      expect(beginnerExplanation.title).toContain('true or false');
      expect(advancedExplanation.title).toContain('Comprehensive Verification Report');
    });

    it('should include learning tips appropriate for verdict', () => {
      const trueExplanation = explanationGenerator.generateExplanation(
        { ...mockVerificationResult, verdict: 'true' as const },
        mockUserProfile
      );

      const falseExplanation = explanationGenerator.generateExplanation(
        { ...mockVerificationResult, verdict: 'false' as const },
        mockUserProfile
      );

      expect(trueExplanation.content).toContain('Good job checking');
      expect(falseExplanation.content).toContain('misinformation');
    });
  });
});