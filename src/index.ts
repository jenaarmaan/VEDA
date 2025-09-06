/**
 * VEDA Social Graph Agent - Main entry point
 */

export * from './types';
export * from './components/SocialDataFetcher';
export * from './components/GraphBuilder';
export * from './components/NetworkAnalyzer';
export * from './components/BehaviorDetector';
export * from './components/SocialGraphAgent';

// Default configuration
export const defaultConfig = {
  dataFetcher: {
    defaultTimeWindow: 24,
    maxResults: 1000,
    enableCaching: true,
    cacheExpiry: 60
  },
  graphBuilder: {
    includeUserNodes: true,
    includePostNodes: true,
    edgeWeightCalculation: 'weighted' as const,
    timeDecayFactor: 0.1,
    minEdgeWeight: 0.1,
    maxGraphSize: 10000
  },
  networkAnalyzer: {
    algorithmConfig: {
      pageRankDamping: 0.85,
      pageRankIterations: 100,
      communityDetectionResolution: 1.0,
      centralityThreshold: 0.1
    },
    enableParallelProcessing: false,
    maxConcurrentAlgorithms: 4
  },
  behaviorDetector: {
    botDetectionThreshold: 0.7,
    coordinationThreshold: 0.6,
    activityBurstThreshold: 0.5,
    contentSimilarityThreshold: 0.8,
    networkReciprocityThreshold: 0.3,
    enableMachineLearning: false
  },
  analysisOptions: {
    includeBotDetection: true,
    includeCommunityDetection: true,
    includeViralityAnalysis: true,
    includeCoordinationAnalysis: true,
    includeMisinformationPathways: true
  },
  outputFormat: 'json' as const,
  enableLogging: true,
  logLevel: 'info' as const
};