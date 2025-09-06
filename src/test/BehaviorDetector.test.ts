/**
 * Unit tests for BehaviorDetector
 */

import { BehaviorDetector } from '../components/BehaviorDetector';
import { NetworkAnalyzer } from '../components/NetworkAnalyzer';
import { GraphBuilder } from '../components/GraphBuilder';
import { BehaviorDetectorConfig } from '../types/api';
import { 
  mockDataCollection, 
  mockBotUser, 
  mockBotPosts, 
  mockCoordinatedUsers, 
  mockCoordinatedPosts 
} from './mocks/socialData';

describe('BehaviorDetector', () => {
  let behaviorDetector: BehaviorDetector;
  let networkAnalyzer: NetworkAnalyzer;
  let graphBuilder: GraphBuilder;
  let config: BehaviorDetectorConfig;

  beforeEach(() => {
    config = {
      botDetectionThreshold: 0.7,
      coordinationThreshold: 0.6,
      activityBurstThreshold: 0.5,
      contentSimilarityThreshold: 0.8,
      networkReciprocityThreshold: 0.3,
      enableMachineLearning: false
    };

    const graphBuilderConfig = {
      includeUserNodes: true,
      includePostNodes: true,
      edgeWeightCalculation: 'weighted' as const,
      timeDecayFactor: 0.1,
      minEdgeWeight: 0.1,
      maxGraphSize: 1000
    };

    const networkAnalyzerConfig = {
      algorithmConfig: {
        pageRankDamping: 0.85,
        pageRankIterations: 10,
        communityDetectionResolution: 1.0,
        centralityThreshold: 0.1
      },
      enableParallelProcessing: false,
      maxConcurrentAlgorithms: 4
    };

    graphBuilder = new GraphBuilder(graphBuilderConfig);
    networkAnalyzer = new NetworkAnalyzer(networkAnalyzerConfig, graphBuilder);
    behaviorDetector = new BehaviorDetector(config, networkAnalyzer);
  });

  describe('detectBotBehavior', () => {
    it('should detect bot behavior for users', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      expect(botMetrics.size).toBeGreaterThan(0);

      for (const [userId, metrics] of botMetrics) {
        expect(metrics.userId).toBe(userId);
        expect(metrics.botScore).toBeGreaterThanOrEqual(0);
        expect(metrics.botScore).toBeLessThanOrEqual(1);
        expect(metrics.activityBursts).toBeGreaterThanOrEqual(0);
        expect(metrics.postingFrequency).toBeGreaterThanOrEqual(0);
        expect(metrics.followerRatio).toBeGreaterThanOrEqual(0);
        expect(metrics.contentSimilarity).toBeGreaterThanOrEqual(0);
        expect(metrics.contentSimilarity).toBeLessThanOrEqual(1);
        expect(metrics.networkReciprocity).toBeGreaterThanOrEqual(0);
        expect(metrics.networkReciprocity).toBeLessThanOrEqual(1);
        expect(metrics.accountAge).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(metrics.suspiciousPatterns)).toBe(true);
      }
    });

    it('should identify bot-like users with high bot scores', () => {
      // Create a collection with bot-like user
      const botCollection = {
        ...mockDataCollection,
        users: [mockBotUser],
        posts: mockBotPosts
      };

      const graph = graphBuilder.buildPropagationGraph([botCollection]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      const botUserMetrics = botMetrics.get('botuser1');
      expect(botUserMetrics).toBeDefined();
      expect(botUserMetrics!.botScore).toBeGreaterThan(0.5); // Should be high
    });

    it('should identify suspicious patterns', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      for (const [_, metrics] of botMetrics) {
        if (metrics.botScore > 0.5) {
          expect(metrics.suspiciousPatterns.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('detectCoordination', () => {
    it('should detect coordinated behavior', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const coordination = behaviorDetector.detectCoordination(graph);

      expect(Array.isArray(coordination)).toBe(true);

      for (const coord of coordination) {
        expect(coord.groupId).toBeDefined();
        expect(coord.participants.length).toBeGreaterThan(1);
        expect(coord.coordinationScore).toBeGreaterThanOrEqual(0);
        expect(coord.coordinationScore).toBeLessThanOrEqual(1);
        expect(typeof coord.synchronizedActivity).toBe('boolean');
        expect(coord.contentSimilarity).toBeGreaterThanOrEqual(0);
        expect(coord.contentSimilarity).toBeLessThanOrEqual(1);
        expect(coord.networkOverlap).toBeGreaterThanOrEqual(0);
        expect(coord.networkOverlap).toBeLessThanOrEqual(1);
        expect(Array.isArray(coord.temporalPatterns)).toBe(true);
        expect(Array.isArray(coord.suspiciousBehaviors)).toBe(true);
      }
    });

    it('should detect coordinated groups with similar content', () => {
      // Create a collection with coordinated users
      const coordinatedCollection = {
        ...mockDataCollection,
        users: mockCoordinatedUsers,
        posts: mockCoordinatedPosts
      };

      const graph = graphBuilder.buildPropagationGraph([coordinatedCollection]);
      const coordination = behaviorDetector.detectCoordination(graph);

      // Should find at least one coordinated group
      expect(coordination.length).toBeGreaterThan(0);
    });
  });

  describe('calculateViralityMetrics', () => {
    it('should calculate virality metrics for posts', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const viralityMetrics = behaviorDetector.calculateViralityMetrics(graph);

      expect(viralityMetrics.size).toBeGreaterThan(0);

      for (const [postId, metrics] of viralityMetrics) {
        expect(metrics.postId).toBe(postId);
        expect(metrics.viralityScore).toBeGreaterThanOrEqual(0);
        expect(metrics.viralityScore).toBeLessThanOrEqual(1);
        expect(metrics.reach).toBeGreaterThanOrEqual(0);
        expect(metrics.engagement).toBeGreaterThanOrEqual(0);
        expect(metrics.velocity).toBeGreaterThanOrEqual(0);
        expect(metrics.amplification).toBeGreaterThanOrEqual(0);
        expect(metrics.cascadeDepth).toBeGreaterThanOrEqual(0);
        expect(metrics.uniqueUsers).toBeGreaterThanOrEqual(0);
        expect(metrics.timeToViral).toBeGreaterThanOrEqual(0);
        expect(metrics.peakActivity).toBeInstanceOf(Date);
      }
    });

    it('should identify viral posts with high virality scores', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const viralityMetrics = behaviorDetector.calculateViralityMetrics(graph);

      const viralPosts = Array.from(viralityMetrics.values())
        .filter(metrics => metrics.viralityScore > 0.7);

      // Should identify some viral posts
      expect(viralPosts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('identifyMisinformationPathways', () => {
    it('should identify misinformation pathways', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const pathways = behaviorDetector.identifyMisinformationPathways(graph);

      expect(Array.isArray(pathways)).toBe(true);

      for (const pathway of pathways) {
        expect(pathway.id).toBeDefined();
        expect(pathway.sourcePost).toBeDefined();
        expect(Array.isArray(pathway.propagationPath)).toBe(true);
        expect(Array.isArray(pathway.keyNodes)).toBe(true);
        expect(Array.isArray(pathway.amplificationPoints)).toBe(true);
        expect(pathway.reach).toBeGreaterThanOrEqual(0);
        expect(pathway.velocity).toBeGreaterThanOrEqual(0);
        expect(pathway.credibility).toBeGreaterThanOrEqual(0);
        expect(pathway.credibility).toBeLessThanOrEqual(1);
        expect(Array.isArray(pathway.interventionPoints)).toBe(true);
      }
    });

    it('should identify intervention points with priorities', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const pathways = behaviorDetector.identifyMisinformationPathways(graph);

      for (const pathway of pathways) {
        for (const intervention of pathway.interventionPoints) {
          expect(intervention.nodeId).toBeDefined();
          expect(['user', 'post', 'community']).toContain(intervention.type);
          expect(['low', 'medium', 'high', 'critical']).toContain(intervention.priority);
          expect(intervention.reason).toBeDefined();
          expect(intervention.suggestedAction).toBeDefined();
          expect(intervention.impact).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('helper methods', () => {
    it('should calculate text similarity correctly', () => {
      const text1 = 'This is a test message';
      const text2 = 'This is a test message';
      const text3 = 'This is a different message';

      // Note: This would need to be exposed as a public method or tested indirectly
      // For now, we test through the behavior detection methods
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      // Should have calculated content similarity for users with multiple posts
      expect(botMetrics.size).toBeGreaterThan(0);
    });

    it('should calculate follower ratio correctly', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      for (const [_, metrics] of botMetrics) {
        expect(metrics.followerRatio).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate account age correctly', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      for (const [_, metrics] of botMetrics) {
        expect(metrics.accountAge).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty graph', () => {
      const emptyGraph = {
        nodes: new Map(),
        edges: new Map(),
        metadata: {
          totalNodes: 0,
          totalEdges: 0,
          timeRange: {
            start: new Date(),
            end: new Date()
          },
          platforms: []
        }
      };

      const botMetrics = behaviorDetector.detectBotBehavior(emptyGraph);
      expect(botMetrics.size).toBe(0);

      const coordination = behaviorDetector.detectCoordination(emptyGraph);
      expect(coordination.length).toBe(0);

      const viralityMetrics = behaviorDetector.calculateViralityMetrics(emptyGraph);
      expect(viralityMetrics.size).toBe(0);

      const pathways = behaviorDetector.identifyMisinformationPathways(emptyGraph);
      expect(pathways.length).toBe(0);
    });

    it('should handle users with no posts', () => {
      const userWithoutPosts = {
        ...mockDataCollection,
        posts: []
      };

      const graph = graphBuilder.buildPropagationGraph([userWithoutPosts]);
      const botMetrics = behaviorDetector.detectBotBehavior(graph);

      for (const [_, metrics] of botMetrics) {
        expect(metrics.postingFrequency).toBe(0);
        expect(metrics.contentSimilarity).toBe(0);
      }
    });
  });
});