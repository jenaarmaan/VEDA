export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename?: string;
  size?: number;
  mimeType?: string;
}

export interface MetadataInfo {
  exif: Record<string, any>;
  fileInfo: {
    size: number;
    mimeType: string;
    lastModified?: Date;
    created?: Date;
  };
  manipulationIndicators: ManipulationIndicator[];
  authenticityScore: number;
}

export interface ManipulationIndicator {
  type: 'exif_inconsistency' | 'compression_artifacts' | 'clone_detection' | 'metadata_tampering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  evidence?: any;
}

export interface ReverseSearchResult {
  source: 'google_vision' | 'tineye' | 'yandex';
  matches: SearchMatch[];
  totalMatches: number;
  searchTime: number;
}

export interface SearchMatch {
  url: string;
  title?: string;
  description?: string;
  similarity: number;
  publishedDate?: Date;
  source: string;
  thumbnail?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  platform: string;
  url: string;
  title?: string;
  description?: string;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
  source: string;
  confidence: number;
}

export interface PublicationTimeline {
  mediaId: string;
  events: TimelineEvent[];
  earliestPublication?: Date;
  viralThreshold?: Date;
  sourceChain: string[];
}

export interface ChainOfCustodyEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'modified' | 'transferred' | 'analyzed' | 'verified';
  actor: string;
  description: string;
  evidence: any;
  hash?: string;
}

export interface ChainOfCustody {
  mediaId: string;
  entries: ChainOfCustodyEntry[];
  integrityVerified: boolean;
  lastModified: Date;
}

export interface ContentFingerprint {
  mediaId: string;
  perceptualHash: string;
  md5Hash: string;
  sha256Hash: string;
  dhash?: string;
  phash?: string;
  averageHash?: string;
  created: Date;
}

export interface SourceForensicsReport {
  mediaId: string;
  timestamp: Date;
  metadata: MetadataInfo;
  reverseSearch: ReverseSearchResult[];
  timeline: PublicationTimeline;
  chainOfCustody: ChainOfCustody;
  fingerprint: ContentFingerprint;
  authenticityScore: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  };
}

export interface ForensicsConfig {
  googleVisionApiKey?: string;
  tineyeApiKey?: string;
  tineyeApiId?: string;
  enableMetadataAnalysis: boolean;
  enableReverseSearch: boolean;
  enableTimelineTracking: boolean;
  enableChainOfCustody: boolean;
  enableFingerprinting: boolean;
  manipulationThreshold: number;
  similarityThreshold: number;
}