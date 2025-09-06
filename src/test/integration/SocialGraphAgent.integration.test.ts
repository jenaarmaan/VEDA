/**
 * Integration tests for SocialGraphAgent with mocked social data
 */

import { SocialGraphAgent } from '../../components/SocialGraphAgent';
import { SocialGraphAgentConfig } from '../../types/api';
import { SocialPlatform } from '../../types';
import { 
  mockDataCollection, 
  mockBotUser, 
  mockBotPosts, 
  mockCoordinatedUsers, 
  mockCoordinatedPosts 
} from '../mocks/socialData';

describe('SocialGraphAgent Integration Tests', () => {
  let agent: SocialGraphAgent;
  let config: SocialGraphAgentConfig;

  beforeEach(() => {
    config = {
      dataFetcher: {
        defaultTimeWindow: 24,
        maxResults: 1000,
        enableCaching: false, // Disable caching for tests
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
          pageRankIterations: 20,
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

  describe('End-to-End Analysis Pipeline', () => {
    it('should perform complete analysis with normal social data', async () => {
      // Mock the data fetcher to return test data
      const mockFetchSocialData = jest.fn().mockResolvedValue([mockDataCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test misinformation query',
        [SocialPlatform.TWITTER]
      );

      // Verify response structure
      expect(result).toBeDefined();
      expect(result.propagationGraph).toBeDefined();
      expect(result.propagationGraph.nodes.length).toBeGreaterThan(0);
      expect(result.propagationGraph.edges.length).toBeGreaterThan(0);
      expect(result.propagationGraph.metadata.totalNodes).toBeGreaterThan(0);
      expect(result.propagationGraph.metadata.totalEdges).toBeGreaterThan(0);

      // Verify analysis results
      expect(result.analysis).toBeDefined();
      expect(result.analysis.networkMetrics.size).toBeGreaterThan(0);
      expect(result.analysis.communities).toBeDefined();
      expect(result.analysis.viralityMetrics.size).toBeGreaterThan(0);
      expect(result.analysis.botDetection.size).toBeGreaterThan(0);
      expect(result.analysis.coordinationAnalysis).toBeDefined();
      expect(result.analysis.misinformationPathways).toBeDefined();

      // Verify summary
      expect(result.analysis.summary).toBeDefined();
      expect(result.analysis.summary.totalUsers).toBeGreaterThan(0);
      expect(result.analysis.summary.totalPosts).toBeGreaterThan(0);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.analysis.summary.riskLevel);
      expect(Array.isArray(result.analysis.summary.keyFindings)).toBe(true);
      expect(Array.isArray(result.analysis.summary.recommendations)).toBe(true);

      // Verify metadata
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.nodesProcessed).toBeGreaterThan(0);
      expect(result.metadata.edgesProcessed).toBeGreaterThan(0);
      expect(Array.isArray(result.metadata.algorithmsUsed)).toBe(true);
      expect(result.metadata.algorithmsUsed.length).toBeGreaterThan(0);
    });

    it('should detect bot-like behavior in suspicious data', async () => {
      // Create collection with bot-like user
      const botCollection = {
        ...mockDataCollection,
        users: [...mockDataCollection.users, mockBotUser],
        posts: [...mockDataCollection.posts, ...mockBotPosts]
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([botCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test bot detection query',
        [SocialPlatform.TWITTER]
      );

      // Should detect bot behavior
      const botMetrics = result.analysis.botDetection.get('botuser1');
      expect(botMetrics).toBeDefined();
      expect(botMetrics!.botScore).toBeGreaterThan(0.5);

      // Should flag the bot account
      expect(result.flaggedAccounts).toContain('botuser1');

      // Should have higher risk level
      expect(['medium', 'high', 'critical']).toContain(result.analysis.summary.riskLevel);
    });

    it('should detect coordinated behavior', async () => {
      // Create collection with coordinated users
      const coordinatedCollection = {
        ...mockDataCollection,
        users: [...mockDataCollection.users, ...mockCoordinatedUsers],
        posts: [...mockDataCollection.posts, ...mockCoordinatedPosts]
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([coordinatedCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test coordination detection query',
        [SocialPlatform.TWITTER]
      );

      // Should detect coordination
      expect(result.analysis.coordinationAnalysis.length).toBeGreaterThan(0);

      const coordination = result.analysis.coordinationAnalysis[0];
      expect(coordination.coordinationScore).toBeGreaterThan(0.5);
      expect(coordination.participants.length).toBeGreaterThan(1);
      expect(coordination.contentSimilarity).toBeGreaterThan(0.5);

      // Should flag coordinated accounts
      expect(result.flaggedAccounts.length).toBeGreaterThan(0);
    });

    it('should identify viral content', async () => {
      // Create collection with high-engagement posts
      const viralCollection = {
        ...mockDataCollection,
        posts: mockDataCollection.posts.map(post => ({
          ...post,
          likeCount: post.likeCount * 10,
          shareCount: post.shareCount * 10,
          retweetCount: (post.retweetCount || 0) * 10,
          commentCount: post.commentCount * 10
        }))
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([viralCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test viral content query',
        [SocialPlatform.TWITTER]
      );

      // Should identify viral posts
      const viralPosts = Array.from(result.analysis.viralityMetrics.values())
        .filter(metrics => metrics.viralityScore > 0.5);

      expect(viralPosts.length).toBeGreaterThan(0);

      // Should have higher overall virality score
      expect(result.viralityScore).toBeGreaterThan(0.3);
    });

    it('should identify misinformation pathways', async () => {
      // Create collection with suspicious content
      const misinformationCollection = {
        ...mockDataCollection,
        posts: mockDataCollection.posts.map(post => ({
          ...post,
          content: 'FAKE NEWS: ' + post.content,
          likeCount: post.likeCount * 5,
          shareCount: post.shareCount * 5
        }))
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([misinformationCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test misinformation detection query',
        [SocialPlatform.TWITTER]
      );

      // Should identify misinformation pathways
      expect(result.analysis.misinformationPathways.length).toBeGreaterThan(0);

      const pathway = result.analysis.misinformationPathways[0];
      expect(pathway.reach).toBeGreaterThan(0);
      expect(pathway.credibility).toBeLessThan(0.5);
      expect(pathway.interventionPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Platform Analysis', () => {
    it('should handle data from multiple platforms', async () => {
      const twitterCollection = {
        ...mockDataCollection,
        platform: SocialPlatform.TWITTER
      };

      const facebookCollection = {
        ...mockDataCollection,
        platform: SocialPlatform.FACEBOOK,
        users: mockDataCollection.users.map(user => ({
          ...user,
          id: 'fb_' + user.id,
          platform: SocialPlatform.FACEBOOK
        })),
        posts: mockDataCollection.posts.map(post => ({
          ...post,
          id: 'fb_' + post.id,
          authorId: 'fb_' + post.authorId,
          platform: SocialPlatform.FACEBOOK
        }))
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([twitterCollection, facebookCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test multi-platform query',
        [SocialPlatform.TWITTER, SocialPlatform.FACEBOOK]
      );

      // Should include data from both platforms
      expect(result.propagationGraph.metadata.platforms).toContain('twitter');
      expect(result.propagationGraph.metadata.platforms).toContain('facebook');
      expect(result.propagationGraph.metadata.totalNodes).toBeGreaterThan(mockDataCollection.users.length + mockDataCollection.posts.length);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle small datasets', async () => {
      const smallCollection = {
        ...mockDataCollection,
        users: [mockDataCollection.users[0]],
        posts: [mockDataCollection.posts[0]],
        interactions: [mockDataCollection.interactions[0]]
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([smallCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test small dataset query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      expect(result.propagationGraph.metadata.totalNodes).toBe(2); // 1 user + 1 post
      expect(result.analysis.summary.totalUsers).toBe(1);
      expect(result.analysis.summary.totalPosts).toBe(1);
    });

    it('should handle datasets with no interactions', async () => {
      const noInteractionCollection = {
        ...mockDataCollection,
        interactions: []
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([noInteractionCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test no interactions query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      expect(result.propagationGraph.metadata.totalEdges).toBe(0);
      expect(result.analysis.summary.riskLevel).toBe('low');
    });

    it('should handle mixed genuine and bot networks', async () => {
      const mixedCollection = {
        ...mockDataCollection,
        users: [...mockDataCollection.users, mockBotUser],
        posts: [...mockDataCollection.posts, ...mockBotPosts]
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([mixedCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test mixed network query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      
      // Should detect both genuine and bot behavior
      const genuineUsers = Array.from(result.analysis.botDetection.values())
        .filter(metrics => metrics.botScore < 0.5);
      const botUsers = Array.from(result.analysis.botDetection.values())
        .filter(metrics => metrics.botScore >= 0.5);

      expect(genuineUsers.length).toBeGreaterThan(0);
      expect(botUsers.length).toBeGreaterThan(0);
    });

    it('should handle highly viral content', async () => {
      const viralCollection = {
        ...mockDataCollection,
        posts: mockDataCollection.posts.map(post => ({
          ...post,
          likeCount: 10000,
          shareCount: 5000,
          retweetCount: 2000,
          commentCount: 1000
        }))
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([viralCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await agent.analyzeSocialGraph(
        'test viral content query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      expect(result.viralityScore).toBeGreaterThan(0.8);
      expect(result.analysis.summary.viralPosts).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets within reasonable time', async () => {
      // Create a larger dataset
      const largeUsers = Array.from({ length: 100 }, (_, i) => ({
        ...mockDataCollection.users[0],
        id: `user_${i}`,
        username: `user_${i}`
      }));

      const largePosts = Array.from({ length: 200 }, (_, i) => ({
        ...mockDataCollection.posts[0],
        id: `post_${i}`,
        authorId: `user_${i % 100}`
      }));

      const largeCollection = {
        ...mockDataCollection,
        users: largeUsers,
        posts: largePosts
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([largeCollection]);
      (agent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const startTime = Date.now();
      const result = await agent.analyzeSocialGraph(
        'test large dataset query',
        [SocialPlatform.TWITTER]
      );
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.metadata.processingTime).toBeLessThan(10000);
    });

    it('should respect graph size limits', async () => {
      const limitedConfig = {
        ...config,
        graphBuilder: {
          ...config.graphBuilder,
          maxGraphSize: 10
        }
      };

      const limitedAgent = new SocialGraphAgent(limitedConfig);

      const largeCollection = {
        ...mockDataCollection,
        users: Array.from({ length: 50 }, (_, i) => ({
          ...mockDataCollection.users[0],
          id: `user_${i}`,
          username: `user_${i}`
        })),
        posts: Array.from({ length: 50 }, (_, i) => ({
          ...mockDataCollection.posts[0],
          id: `post_${i}`,
          authorId: `user_${i}`
        }))
      };

      const mockFetchSocialData = jest.fn().mockResolvedValue([largeCollection]);
      (limitedAgent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await limitedAgent.analyzeSocialGraph(
        'test limited graph size query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      expect(result.propagationGraph.metadata.totalNodes).toBeLessThanOrEqual(10);
    });
  });

  describe('Analysis Options', () => {
    it('should respect disabled analysis options', async () => {
      const limitedConfig = {
        ...config,
        analysisOptions: {
          includeBotDetection: false,
          includeCommunityDetection: false,
          includeViralityAnalysis: false,
          includeCoordinationAnalysis: false,
          includeMisinformationPathways: false
        }
      };

      const limitedAgent = new SocialGraphAgent(limitedConfig);

      const mockFetchSocialData = jest.fn().mockResolvedValue([mockDataCollection]);
      (limitedAgent as any).dataFetcher.fetchSocialData = mockFetchSocialData;

      const result = await limitedAgent.analyzeSocialGraph(
        'test limited analysis query',
        [SocialPlatform.TWITTER]
      );

      expect(result).toBeDefined();
      expect(result.analysis.botDetection.size).toBe(0);
      expect(result.analysis.communities.length).toBe(0);
      expect(result.analysis.viralityMetrics.size).toBe(0);
      expect(result.analysis.coordinationAnalysis.length).toBe(0);
      expect(result.analysis.misinformationPathways.length).toBe(0);
    });
  });
});