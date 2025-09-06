/**
 * Content Analysis Agent Adapter
 * Integrates your existing Content Analysis Agent with the orchestration system
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

export class ContentAnalysisAgentAdapter implements SpecializedAgent {
  readonly agentId = 'content-analysis';
  readonly agentName = 'Content Analysis Agent';
  readonly supportedContentTypes: ContentType[] = [
    'news_article',
    'social_media_post',
    'video_content',
    'image_with_text',
    'academic_paper',
    'government_document',
    'educational_content',
    'multimedia_content',
    'unknown'
  ];
  readonly maxProcessingTime = 15000; // 15 seconds

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
  private readonly agentEndpoint = process.env.CONTENT_ANALYSIS_AGENT_URL || 'http://localhost:3001/api/content-analysis';
  private readonly agentApiKey = process.env.CONTENT_ANALYSIS_AGENT_API_KEY || 'your-api-key';

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Call your existing Content Analysis Agent
      const analysisResult = await this.callContentAnalysisAgent(request);
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
          contentType: request.contentType,
          analysisMethod: 'content_pattern_analysis',
          language: request.metadata.language || 'unknown',
          modelVersion: analysisResult.modelVersion || 'v1.0'
        }
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.warn(`Content Analysis Agent health check failed: ${error}`);
      return false;
    }
  }

  private async callContentAnalysisAgent(request: VerificationRequest): Promise<{
    verdict: string;
    confidence: number;
    reasoning: string;
    evidence?: any[];
    modelVersion?: string;
  }> {
    const payload = {
      content: request.content,
      contentType: request.contentType,
      metadata: request.metadata,
      priority: request.priority,
      timestamp: request.timestamp
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
      throw new Error('Invalid response format from Content Analysis Agent');
    }

    return result;
  }

  private mapVerdict(agentVerdict: string): Verdict {
    // Map your agent's verdict format to the orchestration system's verdict format
    const verdictMap: Record<string, Verdict> = {
      'true': 'verified_true',
      'false': 'verified_false',
      'misleading': 'misleading',
      'unverified': 'unverified',
      'insufficient_evidence': 'insufficient_evidence',
      'error': 'error',
      // Add more mappings as needed based on your agent's output format
    };

    return verdictMap[agentVerdict.toLowerCase()] || 'unverified';
  }

  private mapEvidence(agentEvidence: any[]): Evidence[] {
    return agentEvidence.map(item => ({
      type: this.mapEvidenceType(item.type),
      title: item.title || 'Evidence',
      description: item.description || '',
      url: item.url,
      reliability: item.reliability || 0.5,
      timestamp: item.timestamp ? new Date(item.timestamp) : undefined
    }));
  }

  private mapEvidenceType(type: string): Evidence['type'] {
    const typeMap: Record<string, Evidence['type']> = {
      'source': 'source',
      'fact_check': 'fact_check',
      'expert_opinion': 'expert_opinion',
      'data_analysis': 'data_analysis',
      'cross_reference': 'cross_reference'
    };

    return typeMap[type] || 'expert_opinion';
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
