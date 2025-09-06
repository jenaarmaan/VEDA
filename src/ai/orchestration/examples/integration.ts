/**
 * Integration Examples for VEDA Orchestration Agent
 * Shows how to integrate with your existing agents and systems
 */

import { 
  orchestrationAgent, 
  OrchestrationAgent,
  agentRegistry,
  SpecializedAgent,
  VerificationRequest,
  AgentResponse,
  AgentHealth,
  ContentType
} from '../index';

// Example: Integrating with your existing Content Analysis Agent
export class MyContentAnalysisAgent implements SpecializedAgent {
  readonly agentId = 'my-content-analysis';
  readonly agentName = 'My Content Analysis Agent';
  readonly supportedContentTypes: ContentType[] = ['news_article', 'social_media_post'];
  readonly maxProcessingTime = 10000;

  private health: AgentHealth = {
    agentId: this.agentId,
    status: 'healthy',
    responseTime: 0,
    successRate: 1.0,
    lastCheck: Date.now(),
    errorCount: 0,
    totalRequests: 0
  };

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    // TODO: Replace this with your actual content analysis implementation
    // This could call your existing API, ML model, or analysis service
    
    const startTime = Date.now();
    
    try {
      // Example: Call your existing content analysis service
      const analysisResult = await this.callMyContentAnalysisAPI(request.content);
      
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, true);
      
      return {
        agentId: this.agentId,
        agentName: this.agentName,
        confidence: analysisResult.confidence,
        verdict: analysisResult.verdict,
        reasoning: analysisResult.reasoning,
        evidence: analysisResult.evidence,
        processingTime,
        timestamp: Date.now(),
        metadata: {
          modelVersion: 'v2.1',
          analysisMethod: 'deep_learning_classification'
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw error;
    }
  }

  async getHealth(): Promise<AgentHealth> {
    return { ...this.health };
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check if your service is available
    // This could ping your API endpoint, check database connection, etc.
    try {
      const response = await fetch('https://your-content-analysis-api.com/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  private async callMyContentAnalysisAPI(content: string): Promise<{
    verdict: any;
    confidence: number;
    reasoning: string;
    evidence: any[];
  }> {
    // TODO: Replace with your actual API call
    // Example implementation:
    
    const response = await fetch('https://your-content-analysis-api.com/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        content,
        options: {
          includeEvidence: true,
          includeReasoning: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      verdict: result.verdict,
      confidence: result.confidence,
      reasoning: result.reasoning,
      evidence: result.evidence || []
    };
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

// Example: Integrating with your existing Source Forensics Agent
export class MySourceForensicsAgent implements SpecializedAgent {
  readonly agentId = 'my-source-forensics';
  readonly agentName = 'My Source Forensics Agent';
  readonly supportedContentTypes: ContentType[] = ['news_article', 'social_media_post'];
  readonly maxProcessingTime = 15000;

  private health: AgentHealth = {
    agentId: this.agentId,
    status: 'healthy',
    responseTime: 0,
    successRate: 1.0,
    lastCheck: Date.now(),
    errorCount: 0,
    totalRequests: 0
  };

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // TODO: Replace with your actual source forensics implementation
      const sourceAnalysis = await this.performSourceForensics(request);
      
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, true);
      
      return {
        agentId: this.agentId,
        agentName: this.agentName,
        confidence: sourceAnalysis.confidence,
        verdict: sourceAnalysis.verdict,
        reasoning: sourceAnalysis.reasoning,
        evidence: sourceAnalysis.evidence,
        processingTime,
        timestamp: Date.now(),
        metadata: {
          sourceUrl: request.metadata.url,
          analysisMethod: 'domain_reputation_analysis'
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw error;
    }
  }

  async getHealth(): Promise<AgentHealth> {
    return { ...this.health };
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check if your source forensics service is available
    return this.health.status === 'healthy';
  }

  private async performSourceForensics(request: VerificationRequest): Promise<{
    verdict: any;
    confidence: number;
    reasoning: string;
    evidence: any[];
  }> {
    // TODO: Replace with your actual source forensics logic
    // This could involve:
    // - Domain reputation checking
    // - SSL certificate validation
    // - WHOIS data analysis
    // - Historical content analysis
    // - Cross-reference with known fact-checking databases
    
    const url = request.metadata.url;
    const source = request.metadata.source;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (url && this.isReliableDomain(url)) {
      return {
        verdict: 'verified_true',
        confidence: 0.9,
        reasoning: 'Source domain has high reputation and verified SSL certificate',
        evidence: [{
          type: 'source',
          title: 'Domain Reputation Check',
          description: 'Domain verified as reliable source',
          url,
          reliability: 0.9
        }]
      };
    } else {
      return {
        verdict: 'unverified',
        confidence: 0.5,
        reasoning: 'Unable to verify source credibility',
        evidence: []
      };
    }
  }

  private isReliableDomain(url: string): boolean {
    // TODO: Implement your domain reliability checking logic
    const reliableDomains = [
      'reuters.com', 'ap.org', 'bbc.com', 'npr.org',
      'factcheck.org', 'snopes.com', 'politifact.com'
    ];
    return reliableDomains.some(domain => url.includes(domain));
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

// Example: Integrating with your existing Multilingual Agent
export class MyMultilingualAgent implements SpecializedAgent {
  readonly agentId = 'my-multilingual';
  readonly agentName = 'My Multilingual Agent';
  readonly supportedContentTypes: ContentType[] = ['news_article', 'social_media_post'];
  readonly maxProcessingTime = 12000;

  private health: AgentHealth = {
    agentId: this.agentId,
    status: 'healthy',
    responseTime: 0,
    successRate: 1.0,
    lastCheck: Date.now(),
    errorCount: 0,
    totalRequests: 0
  };

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // TODO: Replace with your actual multilingual analysis implementation
      const languageAnalysis = await this.performMultilingualAnalysis(request);
      
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, true);
      
      return {
        agentId: this.agentId,
        agentName: this.agentName,
        confidence: languageAnalysis.confidence,
        verdict: languageAnalysis.verdict,
        reasoning: languageAnalysis.reasoning,
        evidence: languageAnalysis.evidence,
        processingTime,
        timestamp: Date.now(),
        metadata: {
          detectedLanguage: languageAnalysis.detectedLanguage,
          translationQuality: languageAnalysis.translationQuality
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      throw error;
    }
  }

  async getHealth(): Promise<AgentHealth> {
    return { ...this.health };
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check if your multilingual service is available
    return this.health.status === 'healthy';
  }

  private async performMultilingualAnalysis(request: VerificationRequest): Promise<{
    verdict: any;
    confidence: number;
    reasoning: string;
    evidence: any[];
    detectedLanguage: string;
    translationQuality: number;
  }> {
    // TODO: Replace with your actual multilingual analysis logic
    // This could involve:
    // - Language detection
    // - Translation to English for analysis
    // - Cultural context analysis
    // - Regional fact-checking databases
    // - Cross-language verification
    
    const content = request.content;
    const language = request.metadata.language || this.detectLanguage(content);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (language === 'en') {
      return {
        verdict: 'verified_true',
        confidence: 0.8,
        reasoning: 'Content in English, standard verification applied',
        evidence: [],
        detectedLanguage: 'en',
        translationQuality: 1.0
      };
    } else {
      return {
        verdict: 'unverified',
        confidence: 0.6,
        reasoning: `Content in ${language}, requires specialized verification`,
        evidence: [{
          type: 'expert_opinion',
          title: 'Language-Specific Analysis',
          description: `Content analyzed in ${language} with translation verification`,
          reliability: 0.8
        }],
        detectedLanguage: language,
        translationQuality: 0.8
      };
    }
  }

  private detectLanguage(content: string): string {
    // TODO: Implement your language detection logic
    // This could use libraries like franc, langdetect, or your own ML model
    
    const patterns = {
      'es': /[ñáéíóúü]/i,
      'fr': /[àâäéèêëïîôöùûüÿç]/i,
      'de': /[äöüß]/i,
      'zh': /[\u4e00-\u9fff]/,
      'ar': /[\u0600-\u06ff]/,
      'hi': /[\u0900-\u097f]/
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        return lang;
      }
    }
    
    return 'en'; // Default to English
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

// Example: Setting up the orchestration system with your agents
export function setupOrchestrationWithMyAgents() {
  console.log('🔧 Setting up orchestration with your custom agents...');
  
  // Clear existing agents
  agentRegistry.getAllAgents().forEach(agent => {
    agentRegistry.unregisterAgent(agent.agentId);
  });
  
  // Register your custom agents
  agentRegistry.registerAgent(new MyContentAnalysisAgent());
  agentRegistry.registerAgent(new MySourceForensicsAgent());
  agentRegistry.registerAgent(new MyMultilingualAgent());
  
  console.log('✅ Custom agents registered:', agentRegistry.getAllAgents().map(a => a.agentName));
  
  // Configure orchestration with your preferences
  orchestrationAgent.updateConfig({
    agentWeights: {
      'my-content-analysis': 1.0,
      'my-source-forensics': 1.2, // Higher weight for source verification
      'my-multilingual': 0.8
    },
    defaultTimeout: 20000, // 20 seconds for your agents
    maxRetries: 2,
    cacheEnabled: true,
    cacheTTL: 1800000 // 30 minutes
  });
  
  console.log('✅ Orchestration configured for your agents');
}

// Example: Testing your integrated system
export async function testIntegratedSystem() {
  console.log('🧪 Testing integrated system...');
  
  setupOrchestrationWithMyAgents();
  
  const testCases = [
    {
      content: 'Scientists discover new planet with potential for life',
      type: 'news_article' as ContentType,
      metadata: { source: 'reuters.com', language: 'en' }
    },
    {
      content: 'Los científicos descubren nuevo planeta con potencial para la vida',
      type: 'news_article' as ContentType,
      metadata: { source: 'bbc.com', language: 'es' }
    },
    {
      content: 'Breaking: New study shows amazing results!',
      type: 'social_media_post' as ContentType,
      metadata: { platform: 'twitter', author: '@news_account' }
    }
  ];
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n📝 Test case ${index + 1}:`);
    console.log(`Content: ${testCase.content.substring(0, 50)}...`);
    
    const result = await orchestrationAgent.verifyContent(
      testCase.content,
      testCase.type,
      testCase.metadata,
      'medium'
    );
    
    if (result.success && result.report) {
      console.log(`✅ Verdict: ${result.report.finalVerdict}`);
      console.log(`📊 Confidence: ${Math.round(result.report.confidence * 100)}%`);
      console.log(`⏱️ Processing time: ${result.processingTime}ms`);
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }
}

// Example: Monitoring your integrated system
export async function monitorIntegratedSystem() {
  console.log('📊 Monitoring integrated system...');
  
  // Set up health monitoring
  orchestrationAgent.onEvent((event) => {
    if (event.type === 'health_update') {
      const alert = event.data.alert;
      console.log(`🚨 Health Alert: ${alert.severity.toUpperCase()} - ${alert.message}`);
    }
  });
  
  // Get system health
  const systemHealth = orchestrationAgent.getSystemHealth();
  console.log('System Health:', systemHealth.overallStatus);
  console.log('Healthy Agents:', systemHealth.healthyAgents + '/' + systemHealth.totalAgents);
  console.log('Active Alerts:', systemHealth.activeAlerts);
  
  // Get agent health details
  const agentHealth = await orchestrationAgent.getAgentHealth();
  console.log('\nAgent Health Details:');
  for (const [agentId, health] of agentHealth) {
    console.log(`  ${agentId}: ${health.status} (${Math.round(health.successRate * 100)}% success)`);
  }
  
  // Get system statistics
  const stats = orchestrationAgent.getStats();
  console.log('\nSystem Statistics:');
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Success Rate: ${Math.round((stats.successfulRequests / stats.totalRequests) * 100)}%`);
  console.log(`  Average Processing Time: ${Math.round(stats.averageProcessingTime)}ms`);
  console.log(`  Cache Hit Rate: ${Math.round(stats.cacheHitRate * 100)}%`);
}

// Export integration functions
export {
  MyContentAnalysisAgent,
  MySourceForensicsAgent,
  MyMultilingualAgent,
  setupOrchestrationWithMyAgents,
  testIntegratedSystem,
  monitorIntegratedSystem
};
