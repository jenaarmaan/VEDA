/**
 * Tests for RequestRouter component
 */

import { RequestRouter } from '../../components/RequestRouter';
import { VerificationRequest, ContentType, Priority } from '../../types';
import { agentRegistry } from '../../agents';
import { ContentAnalysisAgent } from '../../agents/examples/ContentAnalysisAgent';
import { SourceForensicsAgent } from '../../agents/examples/SourceForensicsAgent';
import { MultilingualAgent } from '../../agents/examples/MultilingualAgent';

describe('RequestRouter', () => {
  let requestRouter: RequestRouter;

  beforeEach(() => {
    // Clear and register test agents
    agentRegistry.getAllAgents().forEach(agent => {
      agentRegistry.unregisterAgent(agent.agentId);
    });

    agentRegistry.registerAgent(new ContentAnalysisAgent());
    agentRegistry.registerAgent(new SourceForensicsAgent());
    agentRegistry.registerAgent(new MultilingualAgent());

    requestRouter = new RequestRouter();
  });

  describe('Content Type Routing', () => {
    it('should route news articles to appropriate agents', async () => {
      const request: VerificationRequest = {
        id: 'test-1',
        content: 'Breaking news content',
        contentType: 'news_article',
        metadata: { source: 'reuters.com' },
        priority: 'high',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      expect(decision.selectedAgents).toContain('content-analysis');
      expect(decision.selectedAgents).toContain('source-forensics');
      expect(decision.executionOrder.length).toBeGreaterThan(0);
      expect(decision.estimatedTime).toBeGreaterThan(0);
      expect(decision.reasoning).toBeDefined();
    });

    it('should route social media posts to appropriate agents', async () => {
      const request: VerificationRequest = {
        id: 'test-2',
        content: 'Social media post content',
        contentType: 'social_media_post',
        metadata: { platform: 'twitter' },
        priority: 'medium',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      expect(decision.selectedAgents).toContain('content-analysis');
      expect(decision.selectedAgents).toContain('social-graph');
      expect(decision.selectedAgents).toContain('source-forensics');
    });

    it('should add multilingual agent for non-English content', async () => {
      const request: VerificationRequest = {
        id: 'test-3',
        content: 'Contenido en español',
        contentType: 'news_article',
        metadata: { language: 'es', source: 'bbc.com' },
        priority: 'medium',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      expect(decision.selectedAgents).toContain('multilingual');
    });

    it('should handle educational content appropriately', async () => {
      const request: VerificationRequest = {
        id: 'test-4',
        content: 'Educational content about science',
        contentType: 'educational_content',
        metadata: { tags: ['science', 'education'] },
        priority: 'medium',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      expect(decision.selectedAgents).toContain('educational-content');
      expect(decision.selectedAgents).toContain('content-analysis');
    });
  });

  describe('Execution Order', () => {
    it('should respect agent dependencies', async () => {
      const request: VerificationRequest = {
        id: 'test-5',
        content: 'Test content',
        contentType: 'news_article',
        metadata: {},
        priority: 'medium',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      // Content analysis should come before dependent agents
      const contentAnalysisIndex = decision.executionOrder.indexOf('content-analysis');
      const sourceForensicsIndex = decision.executionOrder.indexOf('source-forensics');
      
      if (contentAnalysisIndex !== -1 && sourceForensicsIndex !== -1) {
        expect(contentAnalysisIndex).toBeLessThan(sourceForensicsIndex);
      }
    });
  });

  describe('Priority Handling', () => {
    it('should adjust timeouts based on priority', async () => {
      const highPriorityRequest: VerificationRequest = {
        id: 'test-6',
        content: 'High priority content',
        contentType: 'news_article',
        metadata: {},
        priority: 'critical',
        timestamp: Date.now()
      };

      const lowPriorityRequest: VerificationRequest = {
        id: 'test-7',
        content: 'Low priority content',
        contentType: 'news_article',
        metadata: {},
        priority: 'low',
        timestamp: Date.now()
      };

      const highDecision = await requestRouter.routeRequest(highPriorityRequest);
      const lowDecision = await requestRouter.routeRequest(lowPriorityRequest);

      expect(highDecision.estimatedTime).toBeLessThan(lowDecision.estimatedTime);
    });
  });

  describe('Routing Statistics', () => {
    it('should provide routing statistics', () => {
      const stats = requestRouter.getRoutingStats();

      expect(stats).toHaveProperty('supportedContentTypes');
      expect(stats).toHaveProperty('availableAgents');
      expect(stats).toHaveProperty('routingRules');
      expect(stats.supportedContentTypes.length).toBeGreaterThan(0);
      expect(stats.availableAgents.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown content types', async () => {
      const request: VerificationRequest = {
        id: 'test-8',
        content: 'Unknown content type',
        contentType: 'unknown' as ContentType,
        metadata: {},
        priority: 'medium',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      expect(decision.selectedAgents.length).toBeGreaterThan(0);
      expect(decision.reasoning).toContain('unknown');
    });

    it('should handle requests with no available agents', async () => {
      // Unregister all agents
      agentRegistry.getAllAgents().forEach(agent => {
        agentRegistry.unregisterAgent(agent.agentId);
      });

      const request: VerificationRequest = {
        id: 'test-9',
        content: 'No agents available',
        contentType: 'news_article',
        metadata: {},
        priority: 'medium',
        timestamp: Date.now()
      };

      const decision = await requestRouter.routeRequest(request);

      expect(decision.selectedAgents.length).toBe(0);
    });
  });
});
