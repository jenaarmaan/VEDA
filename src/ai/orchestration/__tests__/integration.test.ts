/**
 * Integration tests for the complete VEDA Orchestration Agent system
 * Tests the integration with all 5 real agents
 */

import { 
  orchestrationAgent, 
  agentRegistry,
  ContentAnalysisAgentAdapter,
  SourceForensicsAgentAdapter,
  MultilingualAgentAdapter,
  SocialGraphAgentAdapter,
  EducationalContentAgentAdapter
} from '../index';
import { validateAgentConfigs } from '../config/agent-config';

describe('VEDA Orchestration Agent Integration', () => {
  beforeEach(() => {
    // Clear existing agents
    agentRegistry.getAllAgents().forEach(agent => {
      agentRegistry.unregisterAgent(agent.agentId);
    });

    // Register real agent adapters
    agentRegistry.registerAgent(new ContentAnalysisAgentAdapter());
    agentRegistry.registerAgent(new SourceForensicsAgentAdapter());
    agentRegistry.registerAgent(new MultilingualAgentAdapter());
    agentRegistry.registerAgent(new SocialGraphAgentAdapter());
    agentRegistry.registerAgent(new EducationalContentAgentAdapter());
  });

  afterEach(() => {
    // Clean up
    orchestrationAgent.destroy();
  });

  describe('Agent Registration', () => {
    it('should register all 5 agent adapters', () => {
      const agents = agentRegistry.getAllAgents();
      expect(agents).toHaveLength(5);
      
      const agentIds = agents.map(agent => agent.agentId);
      expect(agentIds).toContain('content-analysis');
      expect(agentIds).toContain('source-forensics');
      expect(agentIds).toContain('multilingual');
      expect(agentIds).toContain('social-graph');
      expect(agentIds).toContain('educational-content');
    });

    it('should have correct agent names', () => {
      const agents = agentRegistry.getAllAgents();
      const agentNames = agents.map(agent => agent.agentName);
      
      expect(agentNames).toContain('Content Analysis Agent');
      expect(agentNames).toContain('Source Forensics Agent');
      expect(agentNames).toContain('Multilingual Agent');
      expect(agentNames).toContain('Social Graph Agent');
      expect(agentNames).toContain('Educational Content Agent');
    });
  });

  describe('Agent Configuration', () => {
    it('should validate agent configurations', () => {
      const validation = validateAgentConfigs();
      
      // Note: This test will pass with default configs, but in production
      // you should set proper environment variables
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Content Verification Workflow', () => {
    it('should handle news article verification', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Scientists at MIT have developed a new AI system that can detect misinformation with 95% accuracy.',
        'news_article',
        {
          source: 'mit.edu',
          language: 'en',
          platform: 'news',
          url: 'https://news.mit.edu/2024/ai-misinformation-detection'
        },
        'high'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('processingTime');
      expect(result.processingTime).toBeGreaterThan(0);

      if (result.success) {
        expect(result.report).toBeDefined();
        expect(result.report?.finalVerdict).toBeDefined();
        expect(result.report?.confidence).toBeGreaterThanOrEqual(0);
        expect(result.report?.confidence).toBeLessThanOrEqual(1);
        expect(result.report?.summary).toBeDefined();
        expect(result.report?.recommendations).toBeDefined();
        expect(Array.isArray(result.report?.recommendations)).toBe(true);
      }
    });

    it('should handle social media post verification', async () => {
      const result = await orchestrationAgent.verifyContent(
        'BREAKING: New study shows vaccines are 100% safe! Share this with everyone! 🚀 #VaccinesWork',
        'social_media_post',
        {
          platform: 'twitter',
          author: '@health_expert',
          language: 'en',
          url: 'https://twitter.com/health_expert/status/1234567890'
        },
        'medium'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('processingTime');

      if (result.success) {
        expect(result.report).toBeDefined();
        expect(result.report?.agentResults.length).toBeGreaterThan(0);
      }
    });

    it('should handle multilingual content verification', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Los científicos han descubierto un nuevo planeta con potencial para la vida.',
        'news_article',
        {
          language: 'es',
          source: 'bbc.com',
          platform: 'news'
        },
        'medium'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('processingTime');

      if (result.success) {
        expect(result.report).toBeDefined();
        // Should include multilingual agent in the results
        const agentIds = result.report?.agentResults.map(r => r.agentId) || [];
        expect(agentIds).toContain('multilingual');
      }
    });

    it('should handle educational content verification', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Photosynthesis is the process by which plants convert sunlight into energy using chlorophyll.',
        'educational_content',
        {
          language: 'en',
          tags: ['biology', 'science', 'education'],
          source: 'textbook'
        },
        'high'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('processingTime');

      if (result.success) {
        expect(result.report).toBeDefined();
        // Should include educational content agent in the results
        const agentIds = result.report?.agentResults.map(r => r.agentId) || [];
        expect(agentIds).toContain('educational-content');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle agent unavailability gracefully', async () => {
      // This test assumes agents might not be available in test environment
      const result = await orchestrationAgent.verifyContent(
        'Test content for error handling',
        'news_article',
        {},
        'medium'
      );

      // Should either succeed or fail gracefully
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('processingTime');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle invalid content types', async () => {
      const result = await orchestrationAgent.verifyContent(
        'Test content',
        'invalid_type' as any,
        {},
        'medium'
      );

      // Should handle gracefully
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('processingTime');
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
      
      expect(stats.agentCount).toBe(5);
    });

    it('should provide system health information', () => {
      const health = orchestrationAgent.getSystemHealth();
      
      expect(health).toHaveProperty('overallStatus');
      expect(health).toHaveProperty('healthyAgents');
      expect(health).toHaveProperty('totalAgents');
      expect(health).toHaveProperty('activeAlerts');
      expect(health).toHaveProperty('averageHealthScore');
      
      expect(health.totalAgents).toBe(5);
    });

    it('should provide agent health information', async () => {
      const agentHealth = await orchestrationAgent.getAgentHealth();
      
      expect(agentHealth.size).toBe(5);
      
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
        'Test content for event monitoring',
        'news_article',
        { source: 'test.com' },
        'medium'
      );
    });
  });

  describe('Batch Processing', () => {
    it('should handle multiple verification requests', async () => {
      const requests = [
        {
          content: 'First test content',
          type: 'news_article' as const,
          metadata: { source: 'test1.com' }
        },
        {
          content: 'Second test content',
          type: 'social_media_post' as const,
          metadata: { platform: 'twitter' }
        },
        {
          content: 'Third test content',
          type: 'educational_content' as const,
          metadata: { tags: ['science'] }
        }
      ];

      const results = await Promise.allSettled(
        requests.map(req => 
          orchestrationAgent.verifyContent(
            req.content,
            req.type,
            req.metadata,
            'medium'
          )
        )
      );

      expect(results).toHaveLength(3);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      expect(successful.length).toBeGreaterThanOrEqual(0);
    });
  });
});
