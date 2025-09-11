/**
 * Multilingual Agent Adapter
 * Integrates your existing Multilingual Agent with the orchestration system
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

export class MultilingualAgentAdapter implements SpecializedAgent {
  readonly agentId = 'multilingual';
  readonly agentName = 'Multilingual Agent';
  readonly supportedContentTypes: ContentType[] = [
    'news_article',
    'social_media_post',
    'image_with_text',
    'multimedia_content',
    'unknown'
  ];
  readonly maxProcessingTime = 12000; // 12 seconds

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
  private readonly agentEndpoint = process.env.MULTILINGUAL_AGENT_URL || 'http://localhost:3003/api/multilingual';
  private readonly agentApiKey = process.env.MULTILINGUAL_AGENT_API_KEY || 'your-api-key';

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Call your existing Multilingual Agent
      const analysisResult = await this.callMultilingualAgent(request);
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
          detectedLanguage: analysisResult.detectedLanguage,
          translationQuality: analysisResult.translationQuality,
          analysisMethod: 'multilingual_verification',
          supportedLanguages: analysisResult.supportedLanguages
        }
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw new Error(`Multilingual analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.warn(`Multilingual Agent health check failed: ${error}`);
      return false;
    }
  }

  private async callMultilingualAgent(request: VerificationRequest): Promise<{
    verdict: string;
    confidence: number;
    reasoning: string;
    evidence?: any[];
    detectedLanguage?: string;
    translationQuality?: number;
    supportedLanguages?: string[];
  }> {
    const payload = {
      content: request.content,
      contentType: request.contentType,
      metadata: request.metadata,
      priority: request.priority,
      timestamp: request.timestamp,
      // Multilingual-specific parameters
      sourceLanguage: request.metadata.language,
      targetLanguage: 'en', // Default to English for analysis
      enableTranslation: true,
      enableCulturalContext: true
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
      throw new Error('Invalid response format from Multilingual Agent');
    }

    return result;
  }

  private mapVerdict(agentVerdict: string): Verdict {
    // Map your agent's verdict format to the orchestration system's verdict format
    const verdictMap: Record<string, Verdict> = {
      'accurate': 'verified_true',
      'translated_accurate': 'verified_true',
      'cultural_accurate': 'verified_true',
      'inaccurate': 'verified_false',
      'translation_error': 'verified_false',
      'cultural_misleading': 'misleading',
      'untranslatable': 'unverified',
      'language_not_supported': 'insufficient_evidence',
      'error': 'error'
    };

    return verdictMap[agentVerdict.toLowerCase()] || 'unverified';
  }

  private mapEvidence(agentEvidence: any[]): Evidence[] {
    return agentEvidence.map(item => ({
      type: this.mapEvidenceType(item.type),
      title: item.title || 'Language Evidence',
      description: item.description || '',
      url: item.url,
      reliability: item.reliability || 0.5,
      timestamp: item.timestamp ? new Date(item.timestamp) : undefined
    }));
  }

  private mapEvidenceType(type: string): Evidence['type'] {
    const typeMap: Record<string, Evidence['type']> = {
      'translation': 'expert_opinion',
      'cultural_context': 'expert_opinion',
      'language_detection': 'data_analysis',
      'cross_language_fact_check': 'fact_check',
      'regional_verification': 'source'
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
