import { ContentAnalysisAgent } from '../agents/ContentAnalysisAgent';
import { ClaimExtractor } from '../agents/ClaimExtractor';
import { FactChecker } from '../agents/FactChecker';
import { ConfidenceAggregator } from '../agents/ConfidenceAggregator';
import { ReportGenerator } from '../agents/ReportGenerator';
import { APIConfig, Evidence, SourceType, Verdict } from '../types';

// Mock configuration for testing
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

describe('ContentAnalysisAgent', () => {
  let agent: ContentAnalysisAgent;

  beforeEach(() => {
    agent = new ContentAnalysisAgent(mockConfig);
  });

  describe('Conflicting Evidence Scenarios', () => {
    test('should handle conflicting reports about Mumbai fire casualties', async () => {
      const inputText = 'A house fire in Mumbai killed five people. Later reports say only three died and two were injured.';
      
      // Mock the fact checker to return conflicting evidence
      const mockFactChecker = agent['factChecker'] as any;
      mockFactChecker.checkClaim = jest.fn().mockImplementation((claim: string) => {
        if (claim.includes('five people')) {
          return Promise.resolve([
            {
              source: 'Initial Report',
              sourceType: SourceType.SOCIAL_MEDIA,
              timestamp: new Date('2024-01-01T10:00:00Z'),
              verdict: Verdict.TRUE,
              confidenceScore: 0.7,
              title: 'Initial casualty report',
              summary: 'Early reports indicated five fatalities'
            }
          ]);
        } else if (claim.includes('three died and two were injured')) {
          return Promise.resolve([
            {
              source: 'Official Update',
              sourceType: SourceType.OFFICIAL,
              timestamp: new Date('2024-01-01T14:00:00Z'),
              verdict: Verdict.TRUE,
              confidenceScore: 0.9,
              title: 'Official casualty update',
              summary: 'Official sources confirm three deaths and two injuries'
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await agent.analyzeContent(inputText);

      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.reports.length).toBeGreaterThan(0);
      
      // Should have evidence from both conflicting reports
      const allEvidence = result.reports.flatMap(report => report.evidence);
      expect(allEvidence.length).toBeGreaterThanOrEqual(2);
      
      // Should have both social media and official sources
      const sourceTypes = new Set(allEvidence.map(ev => ev.sourceType));
      expect(sourceTypes.has(SourceType.SOCIAL_MEDIA)).toBe(true);
      expect(sourceTypes.has(SourceType.OFFICIAL)).toBe(true);
    });

    test('should boost confidence for later official updates', async () => {
      const inputText = 'A house fire in Mumbai killed five people. Later reports say only three died and two were injured.';
      
      const mockFactChecker = agent['factChecker'] as any;
      mockFactChecker.checkClaim = jest.fn().mockImplementation((claim: string) => {
        if (claim.includes('five people')) {
          return Promise.resolve([
            {
              source: 'Social Media Report',
              sourceType: SourceType.SOCIAL_MEDIA,
              timestamp: new Date('2024-01-01T10:00:00Z'),
              verdict: Verdict.TRUE,
              confidenceScore: 0.6,
              title: 'Social media report',
              summary: 'Unverified social media report'
            }
          ]);
        } else if (claim.includes('three died and two were injured')) {
          return Promise.resolve([
            {
              source: 'Fire Department Official',
              sourceType: SourceType.OFFICIAL,
              timestamp: new Date('2024-01-01T14:00:00Z'),
              verdict: Verdict.TRUE,
              confidenceScore: 0.95,
              title: 'Official fire department statement',
              summary: 'Official confirmation from fire department'
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await agent.analyzeContent(inputText);

      // Find the report with official evidence
      const officialReport = result.reports.find(report => 
        report.evidence.some(ev => ev.sourceType === SourceType.OFFICIAL)
      );

      expect(officialReport).toBeDefined();
      expect(officialReport!.confidenceScore).toBeGreaterThan(0.8);
      expect(officialReport!.finalVerdict).toBe(Verdict.TRUE);
    });

    test('should handle evolving information with temporal analysis', async () => {
      const inputText = 'Breaking: Fire in Mumbai building. Update: 5 casualties confirmed. Latest: Official count is 3 dead, 2 injured.';
      
      const mockFactChecker = agent['factChecker'] as any;
      mockFactChecker.checkClaim = jest.fn().mockImplementation((claim: string) => {
        const evidence: Evidence[] = [];
        
        if (claim.includes('Fire in Mumbai')) {
          evidence.push({
            source: 'Breaking News',
            sourceType: SourceType.MAJOR_NEWS,
            timestamp: new Date('2024-01-01T09:00:00Z'),
            verdict: Verdict.TRUE,
            confidenceScore: 0.8,
            title: 'Breaking news report',
            summary: 'Initial report of fire incident'
          });
        }
        
        if (claim.includes('5 casualties')) {
          evidence.push({
            source: 'News Update',
            sourceType: SourceType.MAJOR_NEWS,
            timestamp: new Date('2024-01-01T11:00:00Z'),
            verdict: Verdict.PARTIALLY_TRUE,
            confidenceScore: 0.7,
            title: 'Casualty update',
            summary: 'Early casualty count'
          });
        }
        
        if (claim.includes('3 dead, 2 injured')) {
          evidence.push({
            source: 'Official Statement',
            sourceType: SourceType.OFFICIAL,
            timestamp: new Date('2024-01-01T15:00:00Z'),
            verdict: Verdict.TRUE,
            confidenceScore: 0.95,
            title: 'Final official count',
            summary: 'Official final casualty count'
          });
        }
        
        return Promise.resolve(evidence);
      });

      const result = await agent.analyzeContent(inputText);

      expect(result.reports.length).toBeGreaterThan(0);
      
      // Check that temporal analysis is included in explanations
      const hasTemporalAnalysis = result.reports.some(report => 
        report.explanation.includes('span') || report.explanation.includes('day')
      );
      expect(hasTemporalAnalysis).toBe(true);
    });
  });

  describe('Claim Extraction', () => {
    test('should extract claims from fire incident text', async () => {
      const inputText = 'A house fire in Mumbai killed five people yesterday.';
      
      const result = await agent.analyzeContent(inputText);
      
      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.claims[0].text).toContain('fire');
      expect(result.claims[0].entityType).toBeDefined();
    });

    test('should extract multiple claims from complex text', async () => {
      const inputText = 'A house fire in Mumbai killed five people. The fire started at 2 AM. Firefighters arrived within 10 minutes.';
      
      const result = await agent.analyzeContent(inputText);
      
      expect(result.claims.length).toBeGreaterThan(1);
    });
  });

  describe('Confidence Aggregation', () => {
    test('should properly weight official sources higher', () => {
      const aggregator = new ConfidenceAggregator(agent['factChecker']);
      
      const evidence: Evidence[] = [
        {
          source: 'Social Media',
          sourceType: SourceType.SOCIAL_MEDIA,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
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
      
      // Official source should contribute more despite lower confidence score
      expect(result.finalScore).toBeGreaterThan(0.7);
      expect(result.breakdown.length).toBe(2);
    });

    test('should handle conflicting verdicts', () => {
      const aggregator = new ConfidenceAggregator(agent['factChecker']);
      
      const evidence: Evidence[] = [
        {
          source: 'Source A',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.TRUE,
          confidenceScore: 0.8
        },
        {
          source: 'Source B',
          sourceType: SourceType.MAJOR_NEWS,
          timestamp: new Date(),
          verdict: Verdict.FALSE,
          confidenceScore: 0.8
        }
      ];

      const result = aggregator.aggregateConfidence(evidence);
      
      expect(result.finalScore).toBeLessThan(0.8); // Should be reduced due to conflict
      expect(result.reasoning).toContain('conflict');
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive reports', async () => {
      const inputText = 'A house fire in Mumbai killed five people.';
      
      const result = await agent.analyzeContent(inputText);
      
      expect(result.reports.length).toBeGreaterThan(0);
      
      const report = result.reports[0];
      expect(report.claimId).toBeDefined();
      expect(report.claimText).toBeDefined();
      expect(report.finalVerdict).toBeDefined();
      expect(report.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(report.explanation).toBeDefined();
      expect(report.timeline).toBeDefined();
    });

    test('should export results in different formats', () => {
      const mockResult = {
        inputText: 'Test text',
        claims: [],
        reports: [],
        overallConfidence: 0.5,
        processingTime: 1000,
        timestamp: new Date()
      };

      const jsonExport = agent.exportResult(mockResult, 'json');
      const textExport = agent.exportResult(mockResult, 'text');
      const bothExport = agent.exportResult(mockResult, 'both');

      expect(typeof jsonExport).toBe('string');
      expect(typeof textExport).toBe('string');
      expect(bothExport).toHaveProperty('json');
      expect(bothExport).toHaveProperty('text');
    });
  });

  describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      const inputText = 'A house fire in Mumbai killed five people.';
      
      // Mock fact checker to throw error
      const mockFactChecker = agent['factChecker'] as any;
      mockFactChecker.checkClaim = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await agent.analyzeContent(inputText);
      
      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.reports.length).toBeGreaterThan(0);
      // Should still have reports even with API failures
    });

    test('should handle empty input', async () => {
      const result = await agent.analyzeContent('');
      
      expect(result.claims.length).toBe(0);
      expect(result.reports.length).toBe(0);
      expect(result.overallConfidence).toBe(0);
    });
  });

  describe('Health Check', () => {
    test('should perform health check on all components', async () => {
      const health = await agent.healthCheck();
      
      expect(health).toHaveProperty('claimExtractor');
      expect(health).toHaveProperty('factChecker');
      expect(health).toHaveProperty('confidenceAggregator');
      expect(health).toHaveProperty('reportGenerator');
    });
  });
});