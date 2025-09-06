/**
 * Core types for the VEDA Content Analysis Agent
 */

export interface Claim {
  id: string;
  text: string;
  entityType: EntityType;
  startOffset: number;
  endOffset: number;
  confidence: number;
  context?: string;
}

export interface Evidence {
  source: string;
  sourceType: SourceType;
  timestamp: Date;
  verdict: Verdict;
  confidenceScore: number;
  url?: string;
  title?: string;
  summary?: string;
  rawResponse?: any;
}

export interface ConfidenceBreakdown {
  sourceType: SourceType;
  weight: number;
  score: number;
  contribution: number;
}

export interface AggregatedConfidence {
  finalScore: number;
  breakdown: ConfidenceBreakdown[];
  reasoning: string;
}

export interface AnalysisReport {
  claimId: string;
  claimText: string;
  finalVerdict: Verdict;
  confidenceScore: number;
  evidence: Evidence[];
  confidenceBreakdown: AggregatedConfidence;
  timeline: Evidence[];
  explanation: string;
  processingTime: number;
  timestamp: Date;
}

export interface ContentAnalysisResult {
  inputText: string;
  claims: Claim[];
  reports: AnalysisReport[];
  overallConfidence: number;
  processingTime: number;
  timestamp: Date;
}

export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  DATE = 'DATE',
  NUMBER = 'NUMBER',
  CLAIM = 'CLAIM'
}

export enum SourceType {
  OFFICIAL = 'OFFICIAL',
  MAJOR_NEWS = 'MAJOR_NEWS',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  BLOG = 'BLOG',
  UNKNOWN = 'UNKNOWN'
}

export enum Verdict {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  UNCERTAIN = 'UNCERTAIN',
  PARTIALLY_TRUE = 'PARTIALLY_TRUE',
  MISLEADING = 'MISLEADING'
}

export interface APIConfig {
  gemini: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  indiaFactCheck: {
    apiKey: string;
    baseUrl: string;
  };
  timeout: number;
  maxRetries: number;
}

export interface SourceCredibilityWeights {
  [SourceType.OFFICIAL]: number;
  [SourceType.MAJOR_NEWS]: number;
  [SourceType.SOCIAL_MEDIA]: number;
  [SourceType.BLOG]: number;
  [SourceType.UNKNOWN]: number;
}