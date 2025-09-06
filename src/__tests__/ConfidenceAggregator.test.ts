import { ConfidenceAggregator } from '../agents/ConfidenceAggregator';
import { FactChecker } from '../agents/FactChecker';
import { Evidence, SourceType, Verdict } from '../types';
import { APIConfig } from '../types';

const mockConfig: APIConfig = {
  gemini: {
    apiKey: 'test-key',
    baseUrl: 'https://test-api.com',
    model: 'test-model'
  },
  indiaFactCheck: {
    apiKey: 'test-key',
    baseUrl: 'https://test-api.com'
  },
  timeout: 5000,
  maxRetries: 1
};

describe('ConfidenceAggregator', () => {
  let aggregator: ConfidenceAggregator;
  let mockFactChecker: FactChecker;

  beforeEach(() => {
    mockFactChecker = new FactChecker(mockConfig);
    aggregator = new ConfidenceAggregator(mockFactChecker);
  });

  describe('Basic Aggregation', () => {
    test('should aggregate single evidence correctly', () => {
      const evidence: Evidence[] = [
        {
          source: 'Test Source',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.finalScore).toBeCloseTo(0.8, 1);
      expect(result.breakdown.length).toBe(1);
      expect(result.reasoning).toBeDefined();
    });

    test('should handle empty evidence array', () => {
      const result = aggregator.aggregateConfidence([]);

      expect(result.finalScore).toBe(0);
      expect(result.breakdown.length).toBe(0);
      expect(result.reasoning).toContain('No evidence available');
    });
  });

  describe('Source Weighting', () => {
    test('should weight official sources higher', () => {
      const evidence: Evidence[] = [
        {
          source: 'Social Media',
          sourceType: SourceType.SOCIAL_MEDIA,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.9
        },
        {
          source: 'Official Report',
          sourceType: SourceType.OFFICIAL,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.7
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      // Official source should contribute more despite lower confidence
      const officialBreakdown = result.breakdown.find(b => b.sourceType === SourceType.OFFICIAL);
      const socialBreakdown = result.breakdown.find(b => b.sourceType === SourceType.SOCIAL_MEDIA);

      expect(officialBreakdown!.contribution).toBeGreaterThan(socialBreakdown!.contribution);
    });

    test('should apply correct source weights', () => {
      const evidence: Evidence[] = [
        {
          source: 'Official',
          sourceType: SourceType.OFFICIAL,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 1.0
        },
        {
          source: 'Major News',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 1.0
        },
        {
          source: 'Social Media',
          sourceType: SourceType.SOCIAL_MEDIA,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 1.0
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      const officialBreakdown = result.breakdown.find(b => b.sourceType === SourceType.OFFICIAL);
      const newsBreakdown = result.breakdown.find(b => b.sourceType === SourceType.MAJOR_NEWS);
      const socialBreakdown = result.breakdown.find(b => b.sourceType === SourceType.SOCIAL_MEDIA);

      expect(officialBreakdown!.weight).toBe(1.0);
      expect(newsBreakdown!.weight).toBe(0.8);
      expect(socialBreakdown!.weight).toBe(0.5);
    });
  });

  describe('Verdict Handling', () => {
    test('should convert verdicts to scores correctly', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 1.0
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.FALSE,
          confidenceScore: 1.0
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      // Should result in a score around 0.5 due to conflicting verdicts
      expect(result.finalScore).toBeCloseTo(0.5, 1);
    });

    test('should handle partially true verdicts', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.PARTIALLY_TRUE,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.finalScore).toBeCloseTo(0.48, 1); // 0.6 * 0.8
    });

    test('should handle misleading verdicts', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.MISLEADING,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.finalScore).toBeCloseTo(0.24, 1); // 0.3 * 0.8
    });
  });

  describe('Temporal Analysis', () => {
    test('should analyze temporal patterns in evidence', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date('2024-01-01T14:00:00Z'),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.reasoning).toContain('day');
    });

    test('should detect long-term evidence spans', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date('2024-02-01T10:00:00Z'),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.reasoning).toContain('month');
    });
  });

  describe('Conflict Analysis', () => {
    test('should detect conflicting evidence', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.FALSE,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.reasoning).toContain('conflict');
    });

    test('should handle mixed evidence with uncertain verdicts', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.UNCERTAIN,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);

      expect(result.reasoning).toContain('uncertain');
    });
  });

  describe('Verdict-Specific Confidence', () => {
    test('should calculate confidence for specific verdicts', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.9
        }
      ];

      const trueConfidence = aggregator.calculateVerdictConfidence(evidence, Verdict.TRUE);
      const falseConfidence = aggregator.calculateVerdictConfidence(evidence, Verdict.FALSE);

      expect(trueConfidence).toBeGreaterThan(falseConfidence);
    });

    test('should get verdict breakdown', () => {
      const evidence: Evidence[] = [
        {
          source: 'Source 1',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source 2',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.FALSE,
          confidenceScore: 0.6
        }
      ];

      const breakdown = aggregator.getVerdictBreakdown(evidence);

      expect(breakdown.has(Verdict.TRUE)).toBe(true);
      expect(breakdown.has(Verdict.FALSE)).toBe(true);
      expect(breakdown.get(Verdict.TRUE)).toBeGreaterThan(breakdown.get(Verdict.FALSE)!);
    });
  });

  describe('Configuration', () => {
    test('should allow custom source weights', () => {
      const customWeights = {
        [SourceType.OFFICIAL]: 0.9,
        [SourceType.MAJOR_NEWS]: 0.7
      };

      const customAggregator = new ConfidenceAggregator(mockFactChecker, customWeights);
      const weights = customAggregator.getSourceWeights();

      expect(weights[SourceType.OFFICIAL]).toBe(0.9);
      expect(weights[SourceType.MAJOR_NEWS]).toBe(0.7);
    });

    test('should update source weights', () => {
      const newWeights = {
        [SourceType.OFFICIAL]: 0.95
      };

      aggregator.updateSourceWeights(newWeights);
      const weights = aggregator.getSourceWeights();

      expect(weights[SourceType.OFFICIAL]).toBe(0.95);
    });
  });
});