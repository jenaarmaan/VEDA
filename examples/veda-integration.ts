import { SourceForensicsAgent, DEFAULT_CONFIG } from '../src/index';
import { MediaFile, ForensicsConfig, SourceForensicsReport } from '../src/types';

/**
 * VEDA Integration Example
 * Shows how to integrate the Source Forensics Agent with the VEDA platform
 */

interface VEDAContentAnalysisResult {
  contentId: string;
  analysisType: 'text' | 'image' | 'video';
  timestamp: Date;
  results: any;
}

interface VEDASourceForensicsResult {
  contentId: string;
  forensicsReport: SourceForensicsReport;
  integrationTimestamp: Date;
  correlationId: string;
}

/**
 * VEDA Content Analysis Agent Integration
 */
class VEDAIntegration {
  private forensicsAgent: SourceForensicsAgent;
  private correlationId: string;

  constructor() {
    const config: ForensicsConfig = {
      ...DEFAULT_CONFIG,
      googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
      tineyeApiKey: process.env.TINEYE_API_KEY,
      tineyeApiId: process.env.TINEYE_API_ID,
    };

    this.forensicsAgent = new SourceForensicsAgent(config);
    this.correlationId = this.generateCorrelationId();
  }

  /**
   * Processes content from Content Analysis Agent
   */
  async processContentAnalysisResult(
    contentAnalysisResult: VEDAContentAnalysisResult
  ): Promise<VEDASourceForensicsResult> {
    console.log(`Processing content analysis result for ${contentAnalysisResult.contentId}`);

    // Convert Content Analysis result to MediaFile format
    const mediaFile = this.convertToMediaFile(contentAnalysisResult);

    // Perform source forensics analysis
    const forensicsReport = await this.forensicsAgent.analyzeMedia(mediaFile);

    // Create VEDA-compatible result
    const result: VEDASourceForensicsResult = {
      contentId: contentAnalysisResult.contentId,
      forensicsReport,
      integrationTimestamp: new Date(),
      correlationId: this.correlationId,
    };

    // Log integration metrics
    this.logIntegrationMetrics(result);

    return result;
  }

  /**
   * Converts Content Analysis result to MediaFile format
   */
  private convertToMediaFile(contentAnalysisResult: VEDAContentAnalysisResult): MediaFile {
    // Extract media information from content analysis results
    const mediaInfo = this.extractMediaInfo(contentAnalysisResult.results);

    return {
      id: contentAnalysisResult.contentId,
      url: mediaInfo.url,
      type: mediaInfo.type,
      filename: mediaInfo.filename,
      size: mediaInfo.size,
      mimeType: mediaInfo.mimeType,
    };
  }

  /**
   * Extracts media information from content analysis results
   */
  private extractMediaInfo(results: any): {
    url: string;
    type: 'image' | 'video';
    filename?: string;
    size?: number;
    mimeType?: string;
  } {
    // This would typically extract information from the Content Analysis Agent results
    // For this example, we'll use placeholder values
    return {
      url: results.mediaUrl || 'https://example.com/media.jpg',
      type: results.mediaType === 'video' ? 'video' : 'image',
      filename: results.filename,
      size: results.fileSize,
      mimeType: results.mimeType,
    };
  }

  /**
   * Generates correlation ID for tracking
   */
  private generateCorrelationId(): string {
    return `veda-forensics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logs integration metrics
   */
  private logIntegrationMetrics(result: VEDASourceForensicsResult): void {
    console.log('VEDA Integration Metrics:');
    console.log(`- Content ID: ${result.contentId}`);
    console.log(`- Correlation ID: ${result.correlationId}`);
    console.log(`- Processing Time: ${Date.now() - result.forensicsReport.timestamp.getTime()}ms`);
    console.log(`- Authenticity Score: ${result.forensicsReport.authenticityScore}`);
    console.log(`- Risk Level: ${result.forensicsReport.riskAssessment.level}`);
    console.log(`- Chain of Custody Entries: ${result.forensicsReport.chainOfCustody.entries.length}`);
  }

  /**
   * Generates VEDA-compatible JSON output
   */
  generateVEDAOutput(result: VEDASourceForensicsResult): string {
    const vedaOutput = {
      correlationId: result.correlationId,
      contentId: result.contentId,
      timestamp: result.integrationTimestamp,
      sourceForensics: {
        authenticityScore: result.forensicsReport.authenticityScore,
        riskAssessment: result.forensicsReport.riskAssessment,
        metadata: {
          manipulationIndicators: result.forensicsReport.metadata.manipulationIndicators,
          authenticityScore: result.forensicsReport.metadata.authenticityScore,
        },
        timeline: {
          totalEvents: result.forensicsReport.timeline.events.length,
          sourceChain: result.forensicsReport.timeline.sourceChain,
          viralThreshold: result.forensicsReport.timeline.viralThreshold,
        },
        reverseSearch: {
          totalMatches: result.forensicsReport.reverseSearch.reduce(
            (sum, r) => sum + r.totalMatches,
            0
          ),
          sources: result.forensicsReport.reverseSearch.map(r => r.source),
        },
        chainOfCustody: {
          integrityVerified: result.forensicsReport.chainOfCustody.integrityVerified,
          totalEntries: result.forensicsReport.chainOfCustody.entries.length,
        },
        fingerprint: {
          hasPerceptualHashes: !!result.forensicsReport.fingerprint.perceptualHash,
          hashTypes: this.getHashTypes(result.forensicsReport.fingerprint),
        },
      },
    };

    return JSON.stringify(vedaOutput, null, 2);
  }

  /**
   * Gets hash types from fingerprint
   */
  private getHashTypes(fingerprint: any): string[] {
    const hashTypes: string[] = ['md5', 'sha256'];
    
    if (fingerprint.perceptualHash) hashTypes.push('perceptual');
    if (fingerprint.dhash) hashTypes.push('dhash');
    if (fingerprint.phash) hashTypes.push('phash');
    if (fingerprint.averageHash) hashTypes.push('averageHash');

    return hashTypes;
  }
}

/**
 * VEDA Reporting System Integration
 */
class VEDAReporter {
  /**
   * Formats forensics report for VEDA reporting system
   */
  static formatForVEDAReport(forensicsReport: SourceForensicsReport): {
    summary: {
      mediaId: string;
      authenticityScore: number;
      riskLevel: string;
      keyFindings: string[];
    };
    details: {
      metadata: any;
      timeline: any;
      reverseSearch: any;
      chainOfCustody: any;
    };
    recommendations: string[];
  } {
    return {
      summary: {
        mediaId: forensicsReport.mediaId,
        authenticityScore: forensicsReport.authenticityScore,
        riskLevel: forensicsReport.riskAssessment.level,
        keyFindings: [
          `${forensicsReport.metadata.manipulationIndicators.length} manipulation indicators`,
          `${forensicsReport.reverseSearch.reduce((sum, r) => sum + r.totalMatches, 0)} reverse search matches`,
          `${forensicsReport.timeline.events.length} timeline events`,
          `Chain of custody: ${forensicsReport.chainOfCustody.integrityVerified ? 'VERIFIED' : 'COMPROMISED'}`,
        ],
      },
      details: {
        metadata: {
          exif: forensicsReport.metadata.exif,
          manipulationIndicators: forensicsReport.metadata.manipulationIndicators,
          authenticityScore: forensicsReport.metadata.authenticityScore,
        },
        timeline: {
          events: forensicsReport.timeline.events,
          sourceChain: forensicsReport.timeline.sourceChain,
          viralThreshold: forensicsReport.timeline.viralThreshold,
        },
        reverseSearch: forensicsReport.reverseSearch,
        chainOfCustody: {
          entries: forensicsReport.chainOfCustody.entries,
          integrityVerified: forensicsReport.chainOfCustody.integrityVerified,
        },
      },
      recommendations: forensicsReport.riskAssessment.recommendations,
    };
  }
}

/**
 * Example usage of VEDA integration
 */
async function vedaIntegrationExample() {
  console.log('VEDA Source Forensics Agent Integration Example\n');

  // Initialize VEDA integration
  const vedaIntegration = new VEDAIntegration();

  // Simulate Content Analysis Agent result
  const contentAnalysisResult: VEDAContentAnalysisResult = {
    contentId: 'veda-content-12345',
    analysisType: 'image',
    timestamp: new Date(),
    results: {
      mediaUrl: 'https://example.com/suspicious-content.jpg',
      mediaType: 'image',
      filename: 'suspicious-content.jpg',
      fileSize: 2048000,
      mimeType: 'image/jpeg',
      // ... other content analysis results
    },
  };

  try {
    // Process content analysis result
    const forensicsResult = await vedaIntegration.processContentAnalysisResult(
      contentAnalysisResult
    );

    // Generate VEDA-compatible output
    const vedaOutput = vedaIntegration.generateVEDAOutput(forensicsResult);
    console.log('\nVEDA Output:');
    console.log(vedaOutput);

    // Format for VEDA reporting system
    const vedaReport = VEDAReporter.formatForVEDAReport(forensicsResult.forensicsReport);
    console.log('\nVEDA Report Format:');
    console.log(JSON.stringify(vedaReport, null, 2));

  } catch (error) {
    console.error('VEDA integration failed:', error);
  }
}

// Run VEDA integration example
if (require.main === module) {
  vedaIntegrationExample().catch(console.error);
}

export { VEDAIntegration, VEDAReporter };