// Main exports for VEDA Source Forensics Agent
export { SourceForensicsAgent } from './agents/SourceForensicsAgent';
export { ReverseSearchEngine } from './engines/ReverseSearchEngine';
export { MetadataAnalyzer } from './analyzers/MetadataAnalyzer';
export { TimelineTracker } from './trackers/TimelineTracker';
export { ChainOfCustodyTracker } from './trackers/ChainOfCustody';
export { FingerprintGenerator } from './generators/FingerprintGenerator';

// Type exports
export * from './types';

// Default configuration
export const DEFAULT_CONFIG = {
  enableMetadataAnalysis: true,
  enableReverseSearch: true,
  enableTimelineTracking: true,
  enableChainOfCustody: true,
  enableFingerprinting: true,
  manipulationThreshold: 0.7,
  similarityThreshold: 0.8,
} as const;