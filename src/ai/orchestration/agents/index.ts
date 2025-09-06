/**
 * Agent registry and factory for specialized agents
 * This module manages all available agents and provides a unified interface
 */

import { SpecializedAgent, AgentHealth, VerificationRequest, AgentResponse } from '../types';

// Import your specialized agent adapters here
import { ContentAnalysisAgentAdapter } from './adapters/ContentAnalysisAgentAdapter';
import { SourceForensicsAgentAdapter } from './adapters/SourceForensicsAgentAdapter';
import { MultilingualAgentAdapter } from './adapters/MultilingualAgentAdapter';
import { SocialGraphAgentAdapter } from './adapters/SocialGraphAgentAdapter';
import { EducationalContentAgentAdapter } from './adapters/EducationalContentAgentAdapter';

export class AgentRegistry {
  private agents: Map<string, SpecializedAgent> = new Map();
  private healthCache: Map<string, AgentHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAgents();
    this.startHealthMonitoring();
  }

  private initializeAgents(): void {
    // Register all available agent adapters
    this.registerAgent(new ContentAnalysisAgentAdapter());
    this.registerAgent(new SourceForensicsAgentAdapter());
    this.registerAgent(new MultilingualAgentAdapter());
    this.registerAgent(new SocialGraphAgentAdapter());
    this.registerAgent(new EducationalContentAgentAdapter());
  }

  registerAgent(agent: SpecializedAgent): void {
    this.agents.set(agent.agentId, agent);
    console.log(`Registered agent: ${agent.agentName} (${agent.agentId})`);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.healthCache.delete(agentId);
    console.log(`Unregistered agent: ${agentId}`);
  }

  getAgent(agentId: string): SpecializedAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsForContentType(contentType: string): SpecializedAgent[] {
    return this.getAllAgents().filter(agent => 
      agent.supportedContentTypes.includes(contentType as any)
    );
  }

  async getAgentHealth(agentId: string): Promise<AgentHealth | null> {
    const cached = this.healthCache.get(agentId);
    if (cached && Date.now() - cached.lastCheck < 30000) { // 30 second cache
      return cached;
    }

    const agent = this.getAgent(agentId);
    if (!agent) {
      return null;
    }

    try {
      const health = await agent.getHealth();
      this.healthCache.set(agentId, health);
      return health;
    } catch (error) {
      console.error(`Failed to get health for agent ${agentId}:`, error);
      return {
        agentId,
        status: 'unhealthy',
        responseTime: 0,
        successRate: 0,
        lastCheck: Date.now(),
        errorCount: 1,
        totalRequests: 0
      };
    }
  }

  async getAllAgentHealth(): Promise<Map<string, AgentHealth>> {
    const healthMap = new Map<string, AgentHealth>();
    
    for (const agent of this.getAllAgents()) {
      const health = await this.getAgentHealth(agent.agentId);
      if (health) {
        healthMap.set(agent.agentId, health);
      }
    }
    
    return healthMap;
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.updateAllAgentHealth();
    }, 60000); // Check every minute
  }

  private async updateAllAgentHealth(): Promise<void> {
    const agents = this.getAllAgents();
    const healthPromises = agents.map(agent => this.getAgentHealth(agent.agentId));
    
    try {
      await Promise.allSettled(healthPromises);
    } catch (error) {
      console.error('Error during health monitoring:', error);
    }
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
