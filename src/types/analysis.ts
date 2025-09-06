/**
 * Types for network analysis and behavior detection results
 */

import { SocialUser, SocialPost, PropagationGraph } from './social';

export interface NetworkMetrics {
  nodeId: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  eigenvectorCentrality: number;
  pageRank: number;
  clusteringCoefficient: number;
}

export interface Community {
  id: string;
  nodes: string[];
  size: number;
  modularity: number;
  density: number;
  averageClustering: number;
  dominantPlatform?: string;
  suspiciousScore: number; // 0-1, higher = more suspicious
}

export interface ViralityMetrics {
  postId: string;
  viralityScore: number; // 0-1
  reach: number;
  engagement: number;
  velocity: number; // posts per hour
  amplification: number;
  cascadeDepth: number;
  uniqueUsers: number;
  timeToViral: number; // minutes
  peakActivity: Date;
}

export interface BotDetectionMetrics {
  userId: string;
  botScore: number; // 0-1, higher = more likely bot
  activityBursts: number;
  postingFrequency: number; // posts per hour
  followerRatio: number; // followers/following
  contentSimilarity: number; // 0-1
  networkReciprocity: number; // 0-1
  accountAge: number; // days
  verificationStatus: boolean;
  suspiciousPatterns: string[];
}

export interface CoordinationAnalysis {
  groupId: string;
  participants: string[];
  coordinationScore: number; // 0-1
  synchronizedActivity: boolean;
  contentSimilarity: number;
  networkOverlap: number;
  temporalPatterns: TemporalPattern[];
  suspiciousBehaviors: string[];
}

export interface TemporalPattern {
  type: 'burst' | 'synchronized' | 'periodic' | 'random';
  frequency: number;
  duration: number; // minutes
  confidence: number; // 0-1
  description: string;
}

export interface MisinformationPathway {
  id: string;
  sourcePost: string;
  propagationPath: string[];
  keyNodes: string[];
  amplificationPoints: string[];
  reach: number;
  velocity: number;
  credibility: number; // 0-1, lower = more likely misinformation
  interventionPoints: InterventionPoint[];
}

export interface InterventionPoint {
  nodeId: string;
  type: 'user' | 'post' | 'community';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedAction: string;
  impact: number; // estimated impact of intervention
}

export interface SocialGraphAnalysis {
  graph: PropagationGraph;
  networkMetrics: Map<string, NetworkMetrics>;
  communities: Community[];
  viralityMetrics: Map<string, ViralityMetrics>;
  botDetection: Map<string, BotDetectionMetrics>;
  coordinationAnalysis: CoordinationAnalysis[];
  misinformationPathways: MisinformationPathway[];
  flaggedAccounts: string[];
  summary: AnalysisSummary;
  timestamp: Date;
}

export interface AnalysisSummary {
  totalUsers: number;
  totalPosts: number;
  suspiciousUsers: number;
  viralPosts: number;
  coordinatedGroups: number;
  misinformationPathways: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFindings: string[];
  recommendations: string[];
}

export interface GraphAlgorithmConfig {
  pageRankDamping: number;
  pageRankIterations: number;
  communityDetectionResolution: number;
  centralityThreshold: number;
  botDetectionThreshold: number;
  coordinationThreshold: number;
  viralityThreshold: number;
}

export interface AnalysisOptions {
  includeBotDetection: boolean;
  includeCommunityDetection: boolean;
  includeViralityAnalysis: boolean;
  includeCoordinationAnalysis: boolean;
  includeMisinformationPathways: boolean;
  algorithmConfig: GraphAlgorithmConfig;
  timeWindow: number; // hours
  minEngagement: number;
  maxNodes: number;
}