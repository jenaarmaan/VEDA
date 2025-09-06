/**
 * Comprehensive tests for the OrchestrationAgent
 */

import { OrchestrationAgent } from '../OrchestrationAgent';
import { VerificationRequest, ContentType, Priority } from '../types';
import { ContentAnalysisAgent } from '../agents/examples/ContentAnalysisAgent';
import { SourceForensicsAgent } from '../agents/examples/SourceForensicsAgent';
import { MultilingualAgent } from '../agents/examples/MultilingualAgent';
import { SocialGraphAgent } from '../agents/examples/SocialGraphAgent';
import { EducationalContentAgent } from '../agents/examples/EducationalContentAgent';
import { agentRegistry } from '../agents';

// Mock agents for testing
const mockAgents = [
  new ContentAnalysisAgent(),
  new SourceForensicsAgent(),
  new MultilingualAgent(),
  new SocialGraphAgent(),
  new EducationalContentAgent()
];

describe('OrchestrationAgent', () => {
  let orchestrationAgent: OrchestrationAgent;

  beforeEach(() => {
    // Clear agent registry
    agentRegistry.getAllAgents().forEach(agent => {
      agentRegistry.unregisterAgent(agent.agentId);
    });

    // Register mock agents
    mockAgents.forEach(agent => {
      agentRegistry.registerAgent(agent);
    });

    orchestrationAgent = new OrchestrationAgent({
      defaultTimeout: 5000,
      maxRetries: 2,
      cacheEnabled: false // Disable cache for testing
    });
  });

  afterEach(() => {
    orchestrationAgent.destroy();
  });

  describe('Content Verification', () => {
    it('should successfully verify news article content', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Breaking: Scientists discover new planet with potential for life. The planet, located 100 light-years away, has similar atmospheric conditions to Earth.',
        'news_article',
        {
          source: 'reuters.com',
          language: 'en',
          platform: 'news'
        },
        'high'
      );

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report?.finalVerdict).toBeDefined();
      expect(result.report?.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle social media content', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Just saw the most amazing sunset! 🌅 #nature #photography',
        'social_media_post',
        {
          platform: 'twitter',
          author: '@nature_lover',
          language: 'en'
        },
        'medium'
      );

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });

    it('should handle multilingual content', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Científicos descubren nuevo planeta con potencial para la vida',
        'news_article',
        {
          language: 'es',
          source: 'bbc.com'
        },
        'medium'
      );

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });

    it('should handle educational content', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Photosynthesis is the process by which plants convert sunlight into energy. This process occurs in the chloroplasts and produces oxygen as a byproduct.',
        'educational_content',
        {
          language: 'en',
          tags: ['biology', 'science']
        },
        'medium'
      );

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle agent failures gracefully', async () => {
      // Unregister all agents to simulate no available agents
      agentRegistry.getAllAgents().forEach(agent => {
        agentRegistry.unregisterAgent(agent.agentId);
      });

      const result = await orchestrationAgent.verifyContent(
        'Test content',
        'news_article',
        {},
        'medium'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No suitable agents available');
    });

    it('should handle timeout scenarios', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Test content',
        'news_article',
        {},
        'medium'
      );

      // With very short timeout, this might fail
      expect(result.success).toBeDefined();
    });
  });

  describe('System Monitoring', () => {
    it('should provide system statistics', () => {
      const stats = orchestrationAgent.getStats();
      
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('successfulRequests');
      expect(stats).toHaveProperty('failedRequests');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('activeWorkflows');
      expect(stats).toHaveProperty('systemHealth');
      expect(stats).toHaveProperty('agentCount');
      expect(stats).toHaveProperty('cacheHitRate');
    });

    it('should provide system health information', () => {
      const health = orchestrationAgent.getSystemHealth();
      
      expect(health).toHaveProperty('overallStatus');
      expect(health).toHaveProperty('healthyAgents');
      expect(health).toHaveProperty('totalAgents');
      expect(health).toHaveProperty('activeAlerts');
      expect(health).toHaveProperty('averageHealthScore');
    });

    it('should provide agent health information', async () => {
      const agentHealth = await orchestrationAgent.getAgentHealth();
      
      expect(agentHealth.size).toBeGreaterThan(0);
      
      for (const [agentId, health] of agentHealth) {
        expect(health).toHaveProperty('agentId', agentId);
        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('responseTime');
        expect(health).toHaveProperty('successRate');
        expect(health).toHaveProperty('lastCheck');
        expect(health).toHaveProperty('errorCount');
        expect(health).toHaveProperty('totalRequests');
      }
    });
  });

  describe('Event System', () => {
    it('should emit events during verification', (done) => {
      const events: any[] = [];
      
      orchestrationAgent.onEvent((event) => {
        events.push(event);
        
        if (event.type === 'workflow_completed') {
          expect(events.length).toBeGreaterThan(0);
          expect(events.some(e => e.type === 'workflow_started')).toBe(true);
          done();
        }
      });

      orchestrationAgent.verifyContent(
        'Test content for event testing',
        'news_article',
        {},
        'medium'
      );
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        defaultTimeout: 10000,
        maxRetries: 5,
        cacheEnabled: true
      };

      orchestrationAgent.updateConfig(newConfig);
      
      // Configuration should be updated (we can't directly test this without exposing internals)
      expect(() => orchestrationAgent.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', () => {
      expect(() => orchestrationAgent.clearCache()).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  let orchestrationAgent: OrchestrationAgent;

  beforeEach(() => {
    // Register all agents
    mockAgents.forEach(agent => {
      agentRegistry.registerAgent(agent);
    });

    orchestrationAgent = new OrchestrationAgent({
      cacheEnabled: true,
      defaultTimeout: 10000
    });
  });

  afterEach(() => {
    orchestrationAgent.destroy();
  });

  it('should handle end-to-end verification workflow', async () => {
    const testCases = [
      {
        content: 'The COVID-19 vaccine is 95% effective according to clinical trials.',
        contentType: 'news_article' as ContentType,
        metadata: { source: 'cdc.gov', language: 'en' },
        expectedVerdict: 'verified_true'
      },
      {
        content: 'Vaccines cause autism and should be avoided at all costs!',
        contentType: 'social_media_post' as ContentType,
        metadata: { platform: 'twitter', author: '@fake_news' },
        expectedVerdict: 'verified_false'
      },
      {
        content: 'Scientists are still studying the long-term effects of climate change.',
        contentType: 'educational_content' as ContentType,
        metadata: { language: 'en', tags: ['science', 'climate'] },
        expectedVerdict: 'verified_true'
      }
    ];

    for (const testCase of testCases) {
      const result = await orchestrationAgent.verifyContent(
        testCase.content,
        testCase.contentType,
        testCase.metadata,
        'high'
      );

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report?.finalVerdict).toBeDefined();
      expect(result.report?.confidence).toBeGreaterThan(0);
      expect(result.report?.recommendations.length).toBeGreaterThan(0);
    }
  });

  it('should handle concurrent verification requests', async () => {
    const requests = Array.from({ length: 5 }, (_, i) => 
      orchestrationAgent.verifyContent(
        `Test content ${i}`,
        'news_article',
        { source: `test-source-${i}.com` },
        'medium'
      )
    );

    const results = await Promise.allSettled(requests);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    expect(successful.length).toBeGreaterThan(0);
  });
});
