/**
 * Educational Content Agent Adapter
 * Integrates your existing Educational Content Agent with the orchestration system
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

export class EducationalContentAgentAdapter implements SpecializedAgent {
  readonly agentId = 'educational-content';
  readonly agentName = 'Educational Content Agent';
  readonly supportedContentTypes: ContentType[] = [
    'educational_content',
    'academic_paper',
    'video_content',
    'news_article',
    'unknown'
  ];
  readonly maxProcessingTime = 25000; // 25 seconds

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
  private readonly agentEndpoint = process.env.EDUCATIONAL_CONTENT_AGENT_URL || 'http://localhost:3005/api/educational-content';
  private readonly agentApiKey = process.env.EDUCATIONAL_CONTENT_AGENT_API_KEY || 'your-api-key';

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Call your existing Educational Content Agent
      const analysisResult = await this.callEducationalContentAgent(request);
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
          educationalValue: analysisResult.educationalValue,
          accuracyScore: analysisResult.accuracyScore,
          analysisMethod: 'educational_content_verification',
          subjectArea: analysisResult.subjectArea,
          difficultyLevel: analysisResult.difficultyLevel,
          scientificAccuracy: analysisResult.scientificAccuracy
        }
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw new Error(`Educational content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.warn(`Educational Content Agent health check failed: ${error}`);
      return false;
    }
  }

  private async callEducationalContentAgent(request: VerificationRequest): Promise<{
    verdict: string;
    confidence: number;
    reasoning: string;
    evidence?: any[];
    educationalValue?: number;
    accuracyScore?: number;
    subjectArea?: string;
    difficultyLevel?: string;
    scientificAccuracy?: number;
  }> {
    const payload = {
      content: request.content,
      contentType: request.contentType,
      metadata: request.metadata,
      priority: request.priority,
      timestamp: request.timestamp,
      // Educational content-specific parameters
      tags: request.metadata.tags || [],
      subjectArea: this.detectSubjectArea(request.content),
      enableScientificVerification: true,
      enablePedagogicalAnalysis: true,
      enableMisconceptionDetection: true
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
      throw new Error('Invalid response format from Educational Content Agent');
    }

    return result;
  }

  private detectSubjectArea(content: string): string {
    // Simple subject area detection based on keywords
    const subjectKeywords = {
      'science': ['physics', 'chemistry', 'biology', 'scientific', 'experiment', 'research'],
      'mathematics': ['math', 'equation', 'formula', 'calculate', 'geometry', 'algebra'],
      'history': ['historical', 'ancient', 'war', 'empire', 'century', 'timeline'],
      'literature': ['poem', 'novel', 'author', 'writing', 'literary', 'story'],
      'technology': ['computer', 'software', 'programming', 'digital', 'tech', 'algorithm']
    };

    const lowerContent = content.toLowerCase();
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return subject;
      }
    }

    return 'general';
  }

  private mapVerdict(agentVerdict: string): Verdict {
    // Map your agent's verdict format to the orchestration system's verdict format
    const verdictMap: Record<string, Verdict> = {
      'educationally_accurate': 'verified_true',
      'scientifically_correct': 'verified_true',
      'pedagogically_sound': 'verified_true',
      'educationally_incorrect': 'verified_false',
      'scientifically_wrong': 'verified_false',
      'contains_misconceptions': 'verified_false',
      'misleading_educational': 'misleading',
      'oversimplified': 'misleading',
      'outdated_information': 'misleading',
      'insufficient_educational_value': 'unverified',
      'not_educational_content': 'unverified',
      'error': 'error'
    };

    return verdictMap[agentVerdict.toLowerCase()] || 'unverified';
  }

  private mapEvidence(agentEvidence: any[]): Evidence[] {
    return agentEvidence.map(item => ({
      type: this.mapEvidenceType(item.type),
      title: item.title || 'Educational Evidence',
      description: item.description || '',
      url: item.url,
      reliability: item.reliability || 0.5,
      timestamp: item.timestamp ? new Date(item.timestamp) : undefined
    }));
  }

  private mapEvidenceType(type: string): Evidence['type'] {
    const typeMap: Record<string, Evidence['type']> = {
      'scientific_reference': 'source',
      'academic_paper': 'source',
      'textbook_reference': 'source',
      'expert_opinion': 'expert_opinion',
      'pedagogical_analysis': 'expert_opinion',
      'misconception_detection': 'data_analysis',
      'accuracy_verification': 'fact_check',
      'cross_curriculum_check': 'cross_reference'
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
