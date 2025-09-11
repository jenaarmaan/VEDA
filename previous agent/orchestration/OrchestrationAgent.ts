/**
 * OrchestrationAgent - Main controller integrating all components
 * Central orchestrator for the VEDA misinformation verification platform
 */

import { 
  VerificationRequest,
  UnifiedReport,
  OrchestrationConfig,
  OrchestrationEvent,
  EventCallback,
  CacheEntry,
  ContentType,
  Priority
} from './types';

import { RequestRouter } from './components/RequestRouter';
import { WorkflowManager } from './components/WorkflowManager';
import { ResultAggregator } from './components/ResultAggregator';
import { DecisionEngine } from './components/DecisionEngine';
import { ReportUnifier } from './components/ReportUnifier';
import { HealthMonitor } from './components/HealthMonitor';
import { agentRegistry } from './agents';

export interface OrchestrationResult {
  success: boolean;
  report?: UnifiedReport;
  error?: string;
  processingTime: number;
  workflowId?: string;
}

export interface OrchestrationStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  activeWorkflows: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  agentCount: number;
  cacheHitRate: number;
}

export class OrchestrationAgent {
  private config: OrchestrationConfig;
  private requestRouter!: RequestRouter;
  private workflowManager!: WorkflowManager;
  private resultAggregator!: ResultAggregator;
  private decisionEngine!: DecisionEngine;
  private reportUnifier!: ReportUnifier;
  private healthMonitor!: HealthMonitor;
  
  private cache: Map<string, CacheEntry> = new Map();
  private eventCallbacks: EventCallback[] = [];
  private stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalProcessingTime: number;
    cacheHits: number;
    cacheMisses: number;
  } = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalProcessingTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(config?: Partial<OrchestrationConfig>) {
    this.config = {
      defaultTimeout: 30000,
      maxRetries: 3,
      parallelExecution: true,
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      healthCheckInterval: 60000,
      agentWeights: {
        'content-analysis': 1.0,
        'source-forensics': 1.2,
        'multilingual': 0.8,
        'social-graph': 0.9,
        'educational-content': 0.7
      },
      confidenceThresholds: {
        high: 0.8,
        medium: 0.6,
        low: 0.4
      },
      ...config
    };

    this.initializeComponents();
    this.setupEventHandlers();
  }

  private initializeComponents(): void {
    this.requestRouter = new RequestRouter();
    this.workflowManager = new WorkflowManager({
      defaultTimeout: this.config.defaultTimeout,
      maxRetries: this.config.maxRetries
    });
    this.resultAggregator = new ResultAggregator({
      agentWeights: this.config.agentWeights,
      confidenceThresholds: this.config.confidenceThresholds
    });
    this.decisionEngine = new DecisionEngine();
    this.reportUnifier = new ReportUnifier();
    this.healthMonitor = new HealthMonitor({
      checkInterval: this.config.healthCheckInterval
    });
  }

  private setupEventHandlers(): void {
    // Subscribe to workflow events
    this.workflowManager.onEvent((event) => {
      this.emitEvent(event);
    });

    // Subscribe to health alerts
    this.healthMonitor.onAlert((alert) => {
      this.emitEvent({
        type: 'health_update',
        requestId: '',
        timestamp: Date.now(),
        data: { alert }
      });
    });
  }

  /**
   * Main entry point for content verification
   */
  async verifyContent(
    content: string,
    contentType: ContentType,
    metadata?: any,
    priority: Priority = 'medium'
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Create verification request
      const request: VerificationRequest = {
        id: this.generateRequestId(),
        content,
        contentType,
        metadata: metadata || {},
        priority,
        timestamp: Date.now()
      };

      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedResult = this.getCachedResult(request);
        if (cachedResult) {
          this.stats.cacheHits++;
          return {
            success: true,
            report: cachedResult,
            processingTime: Date.now() - startTime
          };
        }
        this.stats.cacheMisses++;
      }

      // Route request to appropriate agents
      const routingDecision = await this.requestRouter.routeRequest(request);
      
      if (routingDecision.selectedAgents.length === 0) {
        throw new Error('No suitable agents available for this content type');
      }

      // Execute workflow
      const workflow = await this.workflowManager.executeWorkflow(
        request,
        routingDecision.selectedAgents,
        routingDecision.executionOrder
      );

      if (workflow.status !== 'completed') {
        throw new Error(`Workflow failed: ${workflow.status}`);
      }

      // Get agent health for aggregation
      const agentHealth = await this.healthMonitor.getAllAgentHealth();

      // Aggregate results
      const aggregation = await this.resultAggregator.aggregateResults(workflow, agentHealth);

      // Make final decision
      const decision = this.decisionEngine.makeDecision(aggregation, request);

      // Create unified report
      const report = this.reportUnifier.createUnifiedReport(request, aggregation, decision);

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cacheResult(request, report);
      }

      // Record metrics
      this.recordMetrics(workflow, startTime);

      this.stats.successfulRequests++;
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        report,
        processingTime,
        workflowId: workflow.id
      };

    } catch (error) {
      this.stats.failedRequests++;
      const processingTime = Date.now() - startTime;

      this.emitEvent({
        type: 'error',
        requestId: '',
        timestamp: Date.now(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      };
    }
  }

  /**
   * Get verification status for a request
   */
  async getVerificationStatus(requestId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    estimatedTime?: number;
  } | null> {
    // Check active workflows
    const workflows = this.workflowManager.getAllWorkflows();
    const workflow = workflows.find(w => w.requestId === requestId);

    if (!workflow) {
      return null;
    }

    switch (workflow.status) {
      case 'pending':
        return { status: 'pending' };
      case 'running':
        const progress = (workflow.results.size / workflow.steps.length) * 100;
        return { 
          status: 'processing', 
          progress: Math.round(progress) 
        };
      case 'completed':
        return { status: 'completed' };
      case 'failed':
      case 'cancelled':
      case 'timeout':
        return { status: 'failed' };
      default:
        return { status: 'pending' };
    }
  }

  /**
   * Cancel a verification request
   */
  async cancelVerification(requestId: string): Promise<boolean> {
    const workflows = this.workflowManager.getAllWorkflows();
    const workflow = workflows.find(w => w.requestId === requestId);
    
    if (!workflow) {
      return false;
    }

    return await this.workflowManager.cancelWorkflow(workflow.id);
  }

  /**
   * Get system statistics
   */
  getStats(): OrchestrationStats {
    const systemHealth = this.healthMonitor.getSystemHealth();
    const cacheHitRate = this.stats.cacheHits + this.stats.cacheMisses > 0 
      ? this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
      : 0;

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      averageProcessingTime: this.stats.totalRequests > 0 
        ? this.stats.totalProcessingTime / this.stats.totalRequests 
        : 0,
      activeWorkflows: this.workflowManager.getStats().activeWorkflows,
      systemHealth: systemHealth.overallStatus,
      agentCount: agentRegistry.getAllAgents().length,
      cacheHitRate
    };
  }

  /**
   * Get system health information
   */
  getSystemHealth() {
    return this.healthMonitor.getSystemHealth();
  }

  /**
   * Get agent health information
   */
  async getAgentHealth() {
    return await this.healthMonitor.getAllAgentHealth();
  }

  /**
   * Get active alerts
   */
  getAlerts() {
    return this.healthMonitor.getAlerts();
  }

  /**
   * Subscribe to orchestration events
   */
  onEvent(callback: EventCallback): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Unsubscribe from orchestration events
   */
  offEvent(callback: EventCallback): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Update orchestration configuration
   */
  updateConfig(newConfig: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update component configurations
    this.resultAggregator.updateConfig({
      agentWeights: this.config.agentWeights,
      confidenceThresholds: this.config.confidenceThresholds
    });
    
    this.healthMonitor.updateConfig({
      checkInterval: this.config.healthCheckInterval
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.workflowManager.cleanupCompletedWorkflows();
    this.healthMonitor.cleanup();
    this.healthMonitor.destroy();
    agentRegistry.destroy();
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCachedResult(request: VerificationRequest): UnifiedReport | null {
    const cacheKey = this.generateCacheKey(request);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.result;
  }

  private cacheResult(request: VerificationRequest, report: UnifiedReport): void {
    const cacheKey = this.generateCacheKey(request);
    const entry: CacheEntry = {
      key: cacheKey,
      result: report,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL
    };

    this.cache.set(cacheKey, entry);
  }

  private generateCacheKey(request: VerificationRequest): string {
    // Create a hash of the content and metadata for caching
    const contentHash = this.simpleHash(request.content);
    const metadataHash = this.simpleHash(JSON.stringify(request.metadata));
    return `${request.contentType}-${contentHash}-${metadataHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private recordMetrics(workflow: any, startTime: number): void {
    const processingTime = Date.now() - startTime;
    this.stats.totalProcessingTime += processingTime;

    // Record health metrics for each agent
    for (const [agentId, response] of workflow.results) {
      this.healthMonitor.recordMetric({
        agentId,
        timestamp: Date.now(),
        responseTime: response.processingTime,
        success: true,
        confidence: response.confidence,
        processingTime: response.processingTime
      });
    }

    // Record metrics for failed agents
    for (const [agentId, error] of workflow.errors) {
      this.healthMonitor.recordMetric({
        agentId,
        timestamp: Date.now(),
        responseTime: 0,
        success: false,
        error
      });
    }
  }

  private emitEvent(event: OrchestrationEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }
}

// Export singleton instance
export const orchestrationAgent = new OrchestrationAgent();
