/**
 * API response types and configuration interfaces
 */

import { SocialDataCollection, SocialGraphAnalysis } from './index';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId: string;
}

export interface SocialGraphAgentResponse {
  propagationGraph: SerializedGraph;
  viralityScore: number;
  communities: Community[];
  flaggedAccounts: string[];
  analysis: SocialGraphAnalysis;
  metadata: {
    processingTime: number;
    nodesProcessed: number;
    edgesProcessed: number;
    algorithmsUsed: string[];
  };
}

export interface SerializedGraph {
  nodes: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  metadata: {
    totalNodes: number;
    totalEdges: number;
    timeRange: {
      start: string;
      end: string;
    };
    platforms: string[];
  };
}

export interface Community {
  id: string;
  nodes: string[];
  size: number;
  modularity: number;
  density: number;
  averageClustering: number;
  dominantPlatform?: string;
  suspiciousScore: number;
}

export interface TwitterApiConfig {
  bearerToken: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  rateLimitDelay: number; // ms
  maxRetries: number;
}

export interface FacebookApiConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  version: string;
  rateLimitDelay: number; // ms
  maxRetries: number;
}

export interface SocialDataFetcherConfig {
  twitter?: TwitterApiConfig;
  facebook?: FacebookApiConfig;
  defaultTimeWindow: number; // hours
  maxResults: number;
  enableCaching: boolean;
  cacheExpiry: number; // minutes
}

export interface GraphBuilderConfig {
  includeUserNodes: boolean;
  includePostNodes: boolean;
  edgeWeightCalculation: 'uniform' | 'weighted' | 'temporal';
  timeDecayFactor: number;
  minEdgeWeight: number;
  maxGraphSize: number;
}

export interface NetworkAnalyzerConfig {
  algorithmConfig: {
    pageRankDamping: number;
    pageRankIterations: number;
    communityDetectionResolution: number;
    centralityThreshold: number;
  };
  enableParallelProcessing: boolean;
  maxConcurrentAlgorithms: number;
}

export interface BehaviorDetectorConfig {
  botDetectionThreshold: number;
  coordinationThreshold: number;
  activityBurstThreshold: number;
  contentSimilarityThreshold: number;
  networkReciprocityThreshold: number;
  enableMachineLearning: boolean;
  modelPath?: string;
}

export interface SocialGraphAgentConfig {
  dataFetcher: SocialDataFetcherConfig;
  graphBuilder: GraphBuilderConfig;
  networkAnalyzer: NetworkAnalyzerConfig;
  behaviorDetector: BehaviorDetectorConfig;
  analysisOptions: {
    includeBotDetection: boolean;
    includeCommunityDetection: boolean;
    includeViralityAnalysis: boolean;
    includeCoordinationAnalysis: boolean;
    includeMisinformationPathways: boolean;
  };
  outputFormat: 'json' | 'graphml' | 'gexf';
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}