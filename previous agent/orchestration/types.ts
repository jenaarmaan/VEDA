/**
 * Core types and interfaces for the VEDA Orchestration Agent
 * Defines the contract between the orchestration system and specialized agents
 */

export interface VerificationRequest {
  id: string;
  content: string;
  contentType: ContentType;
  metadata: ContentMetadata;
  priority: Priority;
  timestamp: number;
  userId?: string;
  context?: Record<string, any>;
}

export interface ContentMetadata {
  source?: string;
  language?: string;
  platform?: string;
  author?: string;
  publishDate?: Date;
  url?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'mixed';
  tags?: string[];
}

export type ContentType = 
  | 'news_article'
  | 'social_media_post'
  | 'video_content'
  | 'image_with_text'
  | 'academic_paper'
  | 'government_document'
  | 'educational_content'
  | 'multimedia_content'
  | 'unknown';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentResponse {
  agentId: string;
  agentName: string;
  confidence: number; // 0-1 scale
  verdict: Verdict;
  reasoning: string;
  evidence: Evidence[];
  processingTime: number;
  timestamp: number;
  metadata: Record<string, any>;
}

export type Verdict = 
  | 'verified_true'
  | 'verified_false'
  | 'misleading'
  | 'unverified'
  | 'insufficient_evidence'
  | 'error';

export interface Evidence {
  type: 'source' | 'fact_check' | 'expert_opinion' | 'data_analysis' | 'cross_reference';
  title: string;
  description: string;
  url?: string;
  reliability: number; // 0-1 scale
  timestamp?: Date;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  dependencies: string[];
  timeout: number;
  retryCount: number;
  maxRetries: number;
  priority: Priority;
}

export interface WorkflowExecution {
  id: string;
  requestId: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  startTime: number;
  endTime?: number;
  results: Map<string, AgentResponse>;
  errors: Map<string, string>;
}

export type WorkflowStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface UnifiedReport {
  requestId: string;
  finalVerdict: Verdict;
  confidence: number;
  summary: string;
  detailedAnalysis: string;
  agentResults: AgentResponse[];
  evidence: Evidence[];
  recommendations: string[];
  processingTime: number;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  successRate: number;
  lastCheck: number;
  errorCount: number;
  totalRequests: number;
}

export interface OrchestrationConfig {
  defaultTimeout: number;
  maxRetries: number;
  parallelExecution: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  healthCheckInterval: number;
  agentWeights: Record<string, number>;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface CacheEntry {
  key: string;
  result: UnifiedReport;
  timestamp: number;
  ttl: number;
}

// Agent Interface - All specialized agents must implement this
export interface SpecializedAgent {
  readonly agentId: string;
  readonly agentName: string;
  readonly supportedContentTypes: ContentType[];
  readonly maxProcessingTime: number;
  
  analyze(request: VerificationRequest): Promise<AgentResponse>;
  getHealth(): Promise<AgentHealth>;
  isAvailable(): Promise<boolean>;
}

// Event types for real-time updates
export interface OrchestrationEvent {
  type: 'workflow_started' | 'workflow_completed' | 'agent_response' | 'error' | 'health_update';
  requestId: string;
  timestamp: number;
  data: any;
}

export type EventCallback = (event: OrchestrationEvent) => void;

// Additional types needed by components
export interface AggregationResult {
  agentResults: AgentResponse[];
  weightedConfidence: number;
  consensusScore: number;
  agentContributions: AgentContribution[];
  evidence: Evidence[];
  processingTime: number;
  timestamp: number;
  confidence: number;
  consensusVerdict: Verdict;
  weightedScore: number;
  reasoning: string;
  metadata: {
    failedAgents: number;
    successfulAgents: number;
    totalAgents: number;
    averageConfidence: number;
    consensusStrength: number;
    evidenceQuality: number;
    processingTime: number;
  };
}

export interface AgentContribution {
  agentId: string;
  agentName: string;
  weight: number;
  confidence: number;
  verdict: Verdict;
  reasoning: string;
  evidence: Evidence[];
  processingTime: number;
  weightedScore: number;
  healthScore: number;
}

export interface DecisionResult {
  finalVerdict: Verdict;
  confidence: number;
  certainty: CertaintyLevel;
  reasoning: string;
  recommendations: string[];
  riskAssessment: RiskAssessment;
  agentConsensus: AgentConsensus;
  evidence: Evidence[];
  processingTime: number;
  timestamp: number;
  metadata: {
    decisionMethod: string;
    consensusStrength: number;
    evidenceQuality: number;
    processingTime: number;
  };
}

export type CertaintyLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  mitigationStrategies: string[];
  confidence: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  mitigation: string[];
}

export interface AgentConsensus {
  agreementLevel: number; // 0-1 scale
  majorityVerdict: Verdict;
  dissentingAgents: string[];
  consensusStrength: 'strong' | 'moderate' | 'weak' | 'none';
}

export interface RoutingDecision {
  selectedAgents: string[];
  executionOrder: string[];
  estimatedTime: number;
  reasoning: string;
  confidence: number;
}
