/**
 * Social Graph Agent Adapter
 * Integrates your existing Social Graph Agent with the orchestration system
 */

import { 
  SpecializedAgent, 
  VerificationRequest, 
  AgentResponse, 
  AgentHealth,
  ContentType,
  Verdict,
  Evidence
} from '../../types';

export class SocialGraphAgentAdapter implements SpecializedAgent {
  readonly agentId = 'social-graph';
  readonly agentName = 'Social Graph Agent';
  readonly supportedContentTypes: ContentType[] = [
    'social_media_post',
    'news_article',
    'multimedia_content'
  ];
  readonly maxProcessingTime = 18000; // 18 seconds

  private health: AgentHealth = {
    agentId: this.agentId,
    status: 'healthy',
    responseTime: 0,
    successRate: 1.0,
    lastCheck: Date.now(),
    errorCount: 0,
    totalRequests: 0
  };

  // TODO: Replace with your actual agent endpoint/API
  private readonly agentEndpoint = process.env.SOCIAL_GRAPH_AGENT_URL || 'http://localhost:3004/api/social-graph';
  private readonly agentApiKey = process.env.SOCIAL_GRAPH_AGENT_API_KEY || 'your-api-key';

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Call your existing Social Graph Agent
      const analysisResult = await this.callSocialGraphAgent(request);
      const processingTime = Date.now() - startTime;
      
      this.updateHealthMetrics(processingTime, true);
      
      return {
        agentId: this.agentId,
        agentName: this.agentName,
        confidence: analysisResult.confidence,
        verdict: this.mapVerdict(analysisResult.verdict),
        reasoning: analysisResult.reasoning,
        evidence: this.mapEvidence(analysisResult.evidence || []),
        processingTime,
        timestamp: Date.now(),
        metadata: {
          platform: request.metadata.platform,
          author: request.metadata.author,
          analysisMethod: 'social_network_analysis',
          engagementScore: analysisResult.engagementScore,
          viralPotential: analysisResult.viralPotential,
          networkAnalysis: analysisResult.networkAnalysis
        }
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw new Error(`Social graph analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHealth(): Promise<AgentHealth> {
    return { ...this.health };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if your agent service is available
      const response = await fetch(`${this.agentEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.agentApiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      return response.ok;
    } catch (error) {
      console.warn(`Social Graph Agent health check failed: ${error}`);
      return false;
    }
  }

  private async callSocialGraphAgent(request: VerificationRequest): Promise<{
    verdict: string;
    confidence: number;
    reasoning: string;
    evidence?: any[];
    engagementScore?: number;
    viralPotential?: number;
    networkAnalysis?: any;
  }> {
    const payload = {
      content: request.content,
      contentType: request.contentType,
      metadata: request.metadata,
      priority: request.priority,
      timestamp: request.timestamp,
      // Social graph-specific parameters
      platform: request.metadata.platform,
      author: request.metadata.author,
      url: request.metadata.url,
      enableNetworkAnalysis: true,
      enableEngagementAnalysis: true,
      enableViralPrediction: true
    };

    const response = await fetch(this.agentEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.agentApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.maxProcessingTime)
    });

    if (!response.ok) {
      throw new Error(`Agent API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Validate the response structure
    if (!result.verdict || typeof result.confidence !== 'number') {
      throw new Error('Invalid response format from Social Graph Agent');
    }

    return result;
  }

  private mapVerdict(agentVerdict: string): Verdict {
    // Map your agent's verdict format to the orchestration system's verdict format
    const verdictMap: Record<string, Verdict> = {
      'organic': 'verified_true',
      'authentic': 'verified_true',
      'legitimate': 'verified_true',
      'bot_network': 'verified_false',
      'artificial_amplification': 'verified_false',
      'coordinated_inauthentic': 'verified_false',
      'suspicious_patterns': 'misleading',
      'manipulated_engagement': 'misleading',
      'insufficient_data': 'unverified',
      'network_unavailable': 'insufficient_evidence',
      'error': 'error'
    };

    return verdictMap[agentVerdict.toLowerCase()] || 'unverified';
  }

  private mapEvidence(agentEvidence: any[]): Evidence[] {
    return agentEvidence.map(item => ({
      type: this.mapEvidenceType(item.type),
      title: item.title || 'Social Evidence',
      description: item.description || '',
      url: item.url,
      reliability: item.reliability || 0.5,
      timestamp: item.timestamp ? new Date(item.timestamp) : undefined
    }));
  }

  private mapEvidenceType(type: string): Evidence['type'] {
    const typeMap: Record<string, Evidence['type']> = {
      'engagement_analysis': 'data_analysis',
      'network_analysis': 'data_analysis',
      'bot_detection': 'data_analysis',
      'viral_prediction': 'expert_opinion',
      'platform_verification': 'source',
      'cross_platform_analysis': 'cross_reference'
    };

    return typeMap[type] || 'data_analysis';
  }

  private updateHealthMetrics(processingTime: number, success: boolean): void {
    this.health.totalRequests++;
    this.health.responseTime = processingTime;
    this.health.lastCheck = Date.now();
    
    if (success) {
      this.health.successRate = (this.health.successRate * (this.health.totalRequests - 1) + 1) / this.health.totalRequests;
    } else {
      this.health.errorCount++;
      this.health.successRate = (this.health.successRate * (this.health.totalRequests - 1)) / this.health.totalRequests;
      this.health.status = this.health.errorCount > 5 ? 'degraded' : 'healthy';
    }
  }
}
