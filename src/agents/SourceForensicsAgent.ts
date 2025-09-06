import { ReverseSearchEngine } from '../engines/ReverseSearchEngine';
import { MetadataAnalyzer } from '../analyzers/MetadataAnalyzer';
import { TimelineTracker } from '../trackers/TimelineTracker';
import { ChainOfCustodyTracker } from '../trackers/ChainOfCustody';
import { FingerprintGenerator } from '../generators/FingerprintGenerator';
import {
  MediaFile,
  SourceForensicsReport,
  ForensicsConfig,
  ManipulationIndicator,
  SearchMatch,
} from '../types';

export class SourceForensicsAgent {
  private reverseSearchEngine: ReverseSearchEngine;
  private metadataAnalyzer: MetadataAnalyzer;
  private timelineTracker: TimelineTracker;
  private chainOfCustodyTracker: ChainOfCustodyTracker;
  private fingerprintGenerator: FingerprintGenerator;
  private config: ForensicsConfig;

  constructor(config: ForensicsConfig) {
    this.config = config;
    
    // Initialize components
    this.reverseSearchEngine = new ReverseSearchEngine({
      googleVisionApiKey: config.googleVisionApiKey,
      tineyeApiKey: config.tineyeApiKey,
      tineyeApiId: config.tineyeApiId,
    });
    
    this.metadataAnalyzer = new MetadataAnalyzer({
      manipulationThreshold: config.manipulationThreshold,
    });
    
    this.timelineTracker = new TimelineTracker({
      similarityThreshold: config.similarityThreshold,
    });
    
    this.chainOfCustodyTracker = new ChainOfCustodyTracker();
    this.fingerprintGenerator = new FingerprintGenerator();
  }

  /**
   * Performs comprehensive source forensics analysis
   */
  async analyzeMedia(mediaFile: MediaFile): Promise<SourceForensicsReport> {
    const startTime = Date.now();
    
    try {
      // Create initial chain of custody
      const chainOfCustody = this.chainOfCustodyTracker.createChain(
        mediaFile,
        'SourceForensicsAgent'
      );

      // Record analysis start
      this.chainOfCustodyTracker.recordAnalysis(
        chainOfCustody,
        'SourceForensicsAgent',
        'comprehensive_forensics',
        { mediaFile, startTime }
      );

      // Generate content fingerprint
      let fingerprint;
      if (this.config.enableFingerprinting) {
        fingerprint = await this.fingerprintGenerator.generateFingerprint(mediaFile);
        this.chainOfCustodyTracker.recordAnalysis(
          chainOfCustody,
          'FingerprintGenerator',
          'content_fingerprinting',
          { fingerprint }
        );
      }

      // Analyze metadata
      let metadata;
      if (this.config.enableMetadataAnalysis) {
        metadata = await this.metadataAnalyzer.analyzeMetadata(mediaFile);
        this.chainOfCustodyTracker.recordAnalysis(
          chainOfCustody,
          'MetadataAnalyzer',
          'metadata_analysis',
          { metadata }
        );
      }

      // Perform reverse search
      let reverseSearchResults = [];
      if (this.config.enableReverseSearch) {
        if (mediaFile.type === 'image') {
          reverseSearchResults = await this.reverseSearchEngine.searchImage(mediaFile);
        } else if (mediaFile.type === 'video') {
          reverseSearchResults = await this.reverseSearchEngine.searchVideo(mediaFile);
        }
        
        this.chainOfCustodyTracker.recordAnalysis(
          chainOfCustody,
          'ReverseSearchEngine',
          'reverse_search',
          { reverseSearchResults }
        );
      }

      // Reconstruct timeline
      let timeline;
      if (this.config.enableTimelineTracking && reverseSearchResults.length > 0) {
        const allMatches = this.reverseSearchEngine.combineResults(reverseSearchResults);
        timeline = await this.timelineTracker.reconstructTimeline(mediaFile, allMatches);
        
        this.chainOfCustodyTracker.recordAnalysis(
          chainOfCustody,
          'TimelineTracker',
          'timeline_reconstruction',
          { timeline }
        );
      }

      // Calculate overall authenticity score
      const authenticityScore = this.calculateOverallAuthenticityScore(
        metadata,
        reverseSearchResults,
        timeline
      );

      // Perform risk assessment
      const riskAssessment = this.performRiskAssessment(
        metadata,
        reverseSearchResults,
        timeline,
        authenticityScore
      );

      // Record final verification
      this.chainOfCustodyTracker.recordVerification(
        chainOfCustody,
        'SourceForensicsAgent',
        'comprehensive_analysis',
        true,
        `Analysis completed in ${Date.now() - startTime}ms`
      );

      // Create final report
      const report: SourceForensicsReport = {
        mediaId: mediaFile.id,
        timestamp: new Date(),
        metadata: metadata || {
          exif: {},
          fileInfo: { size: 0, mimeType: 'unknown' },
          manipulationIndicators: [],
          authenticityScore: 0,
        },
        reverseSearch: reverseSearchResults,
        timeline: timeline || {
          mediaId: mediaFile.id,
          events: [],
          sourceChain: [],
        },
        chainOfCustody,
        fingerprint: fingerprint || {
          mediaId: mediaFile.id,
          perceptualHash: '',
          md5Hash: '',
          sha256Hash: '',
          created: new Date(),
        },
        authenticityScore,
        riskAssessment,
      };

      return report;
    } catch (error) {
      throw new Error(`Source forensics analysis failed: ${error}`);
    }
  }

  /**
   * Performs quick analysis for real-time verification
   */
  async quickAnalysis(mediaFile: MediaFile): Promise<{
    authenticityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFindings: string[];
  }> {
    try {
      // Quick metadata analysis
      const metadata = await this.metadataAnalyzer.analyzeMetadata(mediaFile);
      
      // Quick reverse search (limited results)
      const reverseSearchResults = await this.reverseSearchEngine.searchImage(mediaFile);
      
      // Calculate quick authenticity score
      const authenticityScore = this.calculateQuickAuthenticityScore(metadata, reverseSearchResults);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(authenticityScore, metadata.manipulationIndicators);
      
      // Extract key findings
      const keyFindings = this.extractKeyFindings(metadata, reverseSearchResults);
      
      return {
        authenticityScore,
        riskLevel,
        keyFindings,
      };
    } catch (error) {
      throw new Error(`Quick analysis failed: ${error}`);
    }
  }

  /**
   * Compares two media files for similarity
   */
  async compareMedia(mediaFile1: MediaFile, mediaFile2: MediaFile): Promise<{
    similarity: number;
    fingerprintComparison: any;
    metadataComparison: any;
    recommendations: string[];
  }> {
    try {
      // Generate fingerprints for both files
      const fingerprint1 = await this.fingerprintGenerator.generateFingerprint(mediaFile1);
      const fingerprint2 = await this.fingerprintGenerator.generateFingerprint(mediaFile2);
      
      // Compare fingerprints
      const fingerprintComparison = this.fingerprintGenerator.compareFingerprints(
        fingerprint1,
        fingerprint2
      );
      
      // Analyze metadata for both files
      const metadata1 = await this.metadataAnalyzer.analyzeMetadata(mediaFile1);
      const metadata2 = await this.metadataAnalyzer.analyzeMetadata(mediaFile2);
      
      // Compare metadata
      const metadataComparison = this.compareMetadata(metadata1, metadata2);
      
      // Generate recommendations
      const recommendations = this.generateComparisonRecommendations(
        fingerprintComparison,
        metadataComparison
      );
      
      return {
        similarity: fingerprintComparison.similarity,
        fingerprintComparison,
        metadataComparison,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Media comparison failed: ${error}`);
    }
  }

  /**
   * Detects duplicate content across multiple files
   */
  async detectDuplicates(mediaFiles: MediaFile[]): Promise<{
    duplicates: Array<{
      files: MediaFile[];
      similarity: number;
      type: 'exact' | 'near_duplicate' | 'similar';
    }>;
    uniqueFiles: MediaFile[];
  }> {
    try {
      // Generate fingerprints for all files
      const fingerprints = await Promise.all(
        mediaFiles.map(file => this.fingerprintGenerator.generateFingerprint(file))
      );
      
      // Detect duplicates
      const duplicateGroups = this.fingerprintGenerator.detectDuplicates(fingerprints);
      
      // Map back to media files
      const duplicates = duplicateGroups.map(group => ({
        files: group.fingerprints.map(fp => 
          mediaFiles.find(f => f.id === fp.mediaId)!
        ),
        similarity: group.similarity,
        type: group.type,
      }));
      
      // Find unique files
      const duplicateFileIds = new Set(
        duplicates.flatMap(dup => dup.files.map(f => f.id))
      );
      const uniqueFiles = mediaFiles.filter(f => !duplicateFileIds.has(f.id));
      
      return {
        duplicates,
        uniqueFiles,
      };
    } catch (error) {
      throw new Error(`Duplicate detection failed: ${error}`);
    }
  }

  /**
   * Calculates overall authenticity score
   */
  private calculateOverallAuthenticityScore(
    metadata?: any,
    reverseSearchResults?: any[],
    timeline?: any
  ): number {
    let score = 1.0;
    
    // Factor in metadata authenticity
    if (metadata) {
      score *= metadata.authenticityScore;
    }
    
    // Factor in reverse search results
    if (reverseSearchResults && reverseSearchResults.length > 0) {
      const totalMatches = reverseSearchResults.reduce(
        (sum, result) => sum + result.totalMatches,
        0
      );
      
      // More matches generally indicate higher authenticity
      if (totalMatches > 0) {
        score *= Math.min(1.0, 0.5 + (totalMatches / 100));
      }
    }
    
    // Factor in timeline consistency
    if (timeline && timeline.events.length > 0) {
      const avgConfidence = timeline.events.reduce(
        (sum: number, event: any) => sum + event.confidence,
        0
      ) / timeline.events.length;
      
      score *= avgConfidence;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculates quick authenticity score
   */
  private calculateQuickAuthenticityScore(metadata: any, reverseSearchResults: any[]): number {
    let score = metadata.authenticityScore;
    
    // Quick boost for search results
    if (reverseSearchResults.length > 0) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }

  /**
   * Performs risk assessment
   */
  private performRiskAssessment(
    metadata?: any,
    reverseSearchResults?: any[],
    timeline?: any,
    authenticityScore?: number
  ): {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    
    // Check metadata manipulation indicators
    if (metadata && metadata.manipulationIndicators.length > 0) {
      const criticalIndicators = metadata.manipulationIndicators.filter(
        (ind: ManipulationIndicator) => ind.severity === 'critical'
      );
      const highIndicators = metadata.manipulationIndicators.filter(
        (ind: ManipulationIndicator) => ind.severity === 'high'
      );
      
      if (criticalIndicators.length > 0) {
        factors.push('Critical manipulation indicators detected');
        recommendations.push('Immediate manual review required');
      } else if (highIndicators.length > 0) {
        factors.push('High-severity manipulation indicators detected');
        recommendations.push('Detailed manual analysis recommended');
      }
    }
    
    // Check authenticity score
    if (authenticityScore !== undefined) {
      if (authenticityScore < 0.3) {
        factors.push('Very low authenticity score');
        recommendations.push('Content likely manipulated or fake');
      } else if (authenticityScore < 0.6) {
        factors.push('Low authenticity score');
        recommendations.push('Additional verification needed');
      }
    }
    
    // Check reverse search results
    if (reverseSearchResults && reverseSearchResults.length === 0) {
      factors.push('No reverse search matches found');
      recommendations.push('Content may be original or heavily modified');
    }
    
    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (factors.some(f => f.includes('Critical'))) {
      level = 'critical';
    } else if (factors.some(f => f.includes('High') || f.includes('Very low'))) {
      level = 'high';
    } else if (factors.length > 0) {
      level = 'medium';
    }
    
    return {
      level,
      factors,
      recommendations,
    };
  }

  /**
   * Determines risk level from quick analysis
   */
  private determineRiskLevel(
    authenticityScore: number,
    manipulationIndicators: ManipulationIndicator[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const hasCriticalIndicators = manipulationIndicators.some(
      ind => ind.severity === 'critical'
    );
    const hasHighIndicators = manipulationIndicators.some(
      ind => ind.severity === 'high'
    );
    
    if (hasCriticalIndicators || authenticityScore < 0.2) {
      return 'critical';
    } else if (hasHighIndicators || authenticityScore < 0.4) {
      return 'high';
    } else if (authenticityScore < 0.7) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Extracts key findings from analysis
   */
  private extractKeyFindings(metadata: any, reverseSearchResults: any[]): string[] {
    const findings: string[] = [];
    
    // Metadata findings
    if (metadata.manipulationIndicators.length > 0) {
      findings.push(`${metadata.manipulationIndicators.length} manipulation indicators detected`);
    }
    
    // Search findings
    if (reverseSearchResults.length > 0) {
      const totalMatches = reverseSearchResults.reduce(
        (sum, result) => sum + result.totalMatches,
        0
      );
      findings.push(`${totalMatches} reverse search matches found`);
    } else {
      findings.push('No reverse search matches found');
    }
    
    return findings;
  }

  /**
   * Compares metadata between two files
   */
  private compareMetadata(metadata1: any, metadata2: any): any {
    return {
      exifSimilarity: this.calculateExifSimilarity(metadata1.exif, metadata2.exif),
      manipulationIndicators1: metadata1.manipulationIndicators.length,
      manipulationIndicators2: metadata2.manipulationIndicators.length,
      authenticityScore1: metadata1.authenticityScore,
      authenticityScore2: metadata2.authenticityScore,
    };
  }

  /**
   * Calculates EXIF similarity
   */
  private calculateExifSimilarity(exif1: any, exif2: any): number {
    const keys1 = Object.keys(exif1);
    const keys2 = Object.keys(exif2);
    const commonKeys = keys1.filter(key => keys2.includes(key));
    
    if (commonKeys.length === 0) return 0;
    
    let matches = 0;
    for (const key of commonKeys) {
      if (exif1[key] === exif2[key]) {
        matches++;
      }
    }
    
    return matches / commonKeys.length;
  }

  /**
   * Generates comparison recommendations
   */
  private generateComparisonRecommendations(
    fingerprintComparison: any,
    metadataComparison: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (fingerprintComparison.exactMatch) {
      recommendations.push('Files are identical - exact match detected');
    } else if (fingerprintComparison.similarity > 0.9) {
      recommendations.push('Files are very similar - likely same content with minor modifications');
    } else if (fingerprintComparison.similarity > 0.7) {
      recommendations.push('Files are similar - may be related content');
    } else {
      recommendations.push('Files are different - likely unrelated content');
    }
    
    if (metadataComparison.exifSimilarity > 0.8) {
      recommendations.push('Metadata is very similar - may be from same source');
    }
    
    return recommendations;
  }

  /**
   * Gets analysis statistics
   */
  getAnalysisStats(): {
    totalAnalyses: number;
    averageProcessingTime: number;
    successRate: number;
  } {
    // This would typically be tracked in a database or cache
    // For now, return placeholder values
    return {
      totalAnalyses: 0,
      averageProcessingTime: 0,
      successRate: 1.0,
    };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<ForensicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize components with new config
    this.reverseSearchEngine = new ReverseSearchEngine({
      googleVisionApiKey: this.config.googleVisionApiKey,
      tineyeApiKey: this.config.tineyeApiKey,
      tineyeApiId: this.config.tineyeApiId,
    });
    
    this.metadataAnalyzer = new MetadataAnalyzer({
      manipulationThreshold: this.config.manipulationThreshold,
    });
    
    this.timelineTracker = new TimelineTracker({
      similarityThreshold: this.config.similarityThreshold,
    });
  }
}