/**
 * Unit tests for SocialGraphAgent
 */

import { SocialGraphAgent } from '../components/SocialGraphAgent';
import { SocialGraphAgentConfig } from '../types/api';
import { SocialPlatform } from '../types';
import { mockDataCollection } from './mocks/socialData';

// Mock the dependencies
jest.mock('../components/SocialDataFetcher');
jest.mock('../components/GraphBuilder');
jest.mock('../components/NetworkAnalyzer');
jest.mock('../components/BehaviorDetector');

describe('SocialGraphAgent', () => {
  let agent: SocialGraphAgent;
  let config: SocialGraphAgentConfig;

  beforeEach(() => {
    config = {
      dataFetcher: {
        defaultTimeWindow: 24,
        maxResults: 1000,
        enableCaching: true,
        cacheExpiry: 60
      },
      graphBuilder: {
        includeUserNodes: true,
        includePostNodes: true,
        edgeWeightCalculation: 'weighted',
        timeDecayFactor: 0.1,
        minEdgeWeight: 0.1,
        maxGraphSize: 1000
      },
      networkAnalyzer: {
        algorithmConfig: {
          pageRankDamping: 0.85,
          pageRankIterations: 10,
          communityDetectionResolution: 1.0,
          centralityThreshold: 0.1
        },
        enableParallelProcessing: false,
        maxConcurrentAlgorithms: 4
      },
      behaviorDetector: {
        botDetectionThreshold: 0.7,
        coordinationThreshold: 0.6,
        activityBurstThreshold: 0.5,
        contentSimilarityThreshold: 0.8,
        networkReciprocityThreshold: 0.3,
        enableMachineLearning: false
      },
      analysisOptions: {
        includeBotDetection: true,
        includeCommunityDetection: true,
        includeViralityAnalysis: true,
        includeCoordinationAnalysis: true,
        includeMisinformationPathways: true
      },
      outputFormat: 'json',
      enableLogging: false,
      logLevel: 'info'
    };

    agent = new SocialGraphAgent(config);
  });

  describe('constructor', () => {
    it('should initialize with configuration', () => {
      expect(agent).toBeDefined();
      expect(agent.getConfig()).toEqual(config);
    });
  });

  describe('analyzeSocialGraph', () => {
    it('should perform complete analysis pipeline', async () => {
      // Mock the data fetcher to return test data
      const mockFetchSocialData = jest.fn().mockResolvedValue([mockDataCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      // Mock the graph builder
      const mockGraph = {
        nodes: new Map([['user1', { id: 'user1', type: 'user', data: {}, timestamp: new Date() }]]),
        edges: new Map([['edge1', { source: 'user1', target: 'post1', type: 'likes', weight: 1, timestamp: new Date() }]]),
        metadata: {
          totalNodes: 1,
          totalEdges: 1,
          timeRange: { start: new Date(), end: new Date() },
          platforms: ['twitter']
        }
      };
      const mockBuildPropagationGraph = jest.fn().mockReturnValue(mockGraph);
      (agent as any).graphBuilder.buildPropagationGraph = mockBuildPropagationGraph;

      // Mock the network analyzer
      const mockNetworkMetrics = new Map([['user1', {
        nodeId: 'user1',
        degree: 1,
        inDegree: 0,
        outDegree: 1,
        betweennessCentrality: 0,
        closenessCentrality: 0,
        eigenvectorCentrality: 0,
        pageRank: 0.5,
        clusteringCoefficient: 0
      }]]);
      const mockAnalyzeNetworkMetrics = jest.fn().mockReturnValue(mockNetworkMetrics);
      (agent as any).networkAnalyzer.analyzeNetworkMetrics = mockAnalyzeNetworkMetrics;

      const mockDetectCommunities = jest.fn().mockReturnValue([]);
      (agent as any).networkAnalyzer.detectCommunities = mockDetectCommunities;

      // Mock the behavior detector
      const mockBotDetection = new Map([['user1', {
        userId: 'user1',
        botScore: 0.3,
        activityBursts: 0,
        postingFrequency: 1,
        followerRatio: 2,
        contentSimilarity: 0.1,
        networkReciprocity: 0.5,
        accountAge: 365,
        verificationStatus: false,
        suspiciousPatterns: []
      }]]);
      const mockDetectBotBehavior = jest.fn().mockReturnValue(mockBotDetection);
      (agent as any).behaviorDetector.detectBotBehavior = mockDetectBotBehavior;

      const mockCalculateViralityMetrics = jest.fn().mockReturnValue(new Map());
      (agent as any).behaviorDetector.calculateViralityMetrics = mockCalculateViralityMetrics;

      const mockDetectCoordination = jest.fn().mockReturnValue([]);
      (agent as any).behaviorDetector.detectCoordination = mockDetectCoordination;

      const mockIdentifyMisinformationPathways = jest.fn().mockReturnValue([]);
      (agent as any).behaviorDetector.identifyMisinformationPathways = mockIdentifyMisinformationPathways;

      const result = await agent.analyzeSocialGraph(
        'test query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      expect(result.propagationGraph).toBeDefined();
      expect(result.viralityScore).toBeGreaterThanOrEqual(0);
      expect(result.communities).toBeDefined();
      expect(result.flaggedAccounts).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.nodesProcessed).toBe(1);
      expect(result.metadata.edgesProcessed).toBe(1);
      expect(Array.isArray(result.metadata.algorithmsUsed)).toBe(true);
    });

    it('should handle empty data collection', async () => {
      const mockFetchSocialData = jest.fn().mockResolvedValue([]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      await expect(
        agent.analyzeSocialGraph('test query', [SocialPlatform.TWITTER])
      ).rejects.toThrow('No data collected from any platform');
    });

    it('should handle empty graph', async () => {
      const mockFetchSocialData = jest.fn().mockResolvedValue([mockDataCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const mockEmptyGraph = {
        nodes: new Map(),
        edges: new Map(),
        metadata: {
          totalNodes: 0,
          totalEdges: 0,
          timeRange: { start: new Date(), end: new Date() },
          platforms: []
        }
      };
      const mockBuildPropagationGraph = jest.fn().mockReturnValue(mockEmptyGraph);
      (agent as any).graphBuilder.buildPropagationGraph = mockBuildPropagationGraph;

      await expect(
        agent.analyzeSocialGraph('test query', [SocialPlatform.TWITTER])
      ).rejects.toThrow('No nodes found in the propagation graph');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        enableLogging: true,
        logLevel: 'debug' as const
      };

      agent.updateConfig(newConfig);

      const updatedConfig = agent.getConfig();
      expect(updatedConfig.enableLogging).toBe(true);
      expect(updatedConfig.logLevel).toBe('debug');
    });

    it('should reinitialize components when config changes', () => {
      const newConfig = {
        dataFetcher: {
          ...config.dataFetcher,
          maxResults: 500
        }
      };

      agent.updateConfig(newConfig);

      // Components should be reinitialized
      expect(agent.getConfig().dataFetcher.maxResults).toBe(500);
    });
  });

  describe('statistics and health check', () => {
    it('should return statistics', () => {
      const stats = agent.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.dataFetcher).toBeDefined();
      expect(stats.graphBuilder).toBeDefined();
      expect(stats.networkAnalyzer).toBeDefined();
      expect(stats.behaviorDetector).toBeDefined();
    });

    it('should perform health check', async () => {
      const health = await agent.healthCheck();
      
      expect(health).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.components).toBeDefined();
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should clear caches', () => {
      expect(() => agent.clearCaches()).not.toThrow();
    });
  });

  describe('analysis options', () => {
    it('should respect analysis options', async () => {
      const mockFetchSocialData = jest.fn().mockResolvedValue([mockDataCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const mockGraph = {
        nodes: new Map([['user1', { id: 'user1', type: 'user', data: {}, timestamp: new Date() }]]),
        edges: new Map(),
        metadata: {
          totalNodes: 1,
          totalEdges: 0,
          timeRange: { start: new Date(), end: new Date() },
          platforms: ['twitter']
        }
      };
      const mockBuildPropagationGraph = jest.fn().mockReturnValue(mockGraph);
      (agent as any).graphBuilder.buildPropagationGraph = mockBuildPropagationGraph;

      const mockNetworkMetrics = new Map();
      const mockAnalyzeNetworkMetrics = jest.fn().mockReturnValue(mockNetworkMetrics);
      (agent as any).networkAnalyzer.analyzeNetworkMetrics = mockAnalyzeNetworkMetrics;

      const mockDetectCommunities = jest.fn().mockReturnValue([]);
      (agent as any).networkAnalyzer.detectCommunities = mockDetectCommunities;

      const mockBotDetection = new Map();
      const mockDetectBotBehavior = jest.fn().mockReturnValue(mockBotDetection);
      (agent as any).behaviorDetector.detectBotBehavior = mockDetectBotBehavior;

      const mockCalculateViralityMetrics = jest.fn().mockReturnValue(new Map());
      (agent as any).behaviorDetector.calculateViralityMetrics = mockCalculateViralityMetrics;

      const mockDetectCoordination = jest.fn().mockReturnValue([]);
      (agent as any).behaviorDetector.detectCoordination = mockDetectCoordination;

      const mockIdentifyMisinformationPathways = jest.fn().mockReturnValue([]);
      (agent as any).behaviorDetector.identifyMisinformationPathways = mockIdentifyMisinformationPathways;

      const options = {
        includeBotDetection: false,
        includeCommunityDetection: false,
        includeViralityAnalysis: false,
        includeCoordinationAnalysis: false,
        includeMisinformationPathways: false
      };

      await agent.analyzeSocialGraph(
        'test query',
        [SocialPlatform.TWITTER],
        options
      );

      // Should not call disabled analysis methods
      expect(mockDetectBotBehavior).not.toHaveBeenCalled();
      expect(mockDetectCommunities).not.toHaveBeenCalled();
      expect(mockCalculateViralityMetrics).not.toHaveBeenCalled();
      expect(mockDetectCoordination).not.toHaveBeenCalled();
      expect(mockIdentifyMisinformationPathways).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle data fetching errors', async () => {
      const mockFetchSocialData = jest.fn().mockRejectedValue(new Error('API Error'));
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      await expect(
        agent.analyzeSocialGraph('test query', [SocialPlatform.TWITTER])
      ).rejects.toThrow('API Error');
    });

    it('should handle analysis errors gracefully', async () => {
      const mockFetchSocialData = jest.fn().mockResolvedValue([mockDataCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const mockBuildPropagationGraph = jest.fn().mockImplementation(() => {
        throw new Error('Graph building failed');
      });
      (agent as any).graphBuilder.buildPropagationGraph = mockBuildPropagationGraph;

      await expect(
        agent.analyzeSocialGraph('test query', [SocialPlatform.TWITTER])
      ).rejects.toThrow('Graph building failed');
    });
  });
});