import { format, parseISO } from 'date-fns';
import { 
  Claim, 
  Evidence, 
  AnalysisReport, 
  ContentAnalysisResult, 
  AggregatedConfidence, 
  Verdict 
} from '../types';

/**
 * ReportGenerator class for formatting analysis results into explainable reports
 * Produces user-facing JSON with detailed reasoning and chronological evidence timeline
 */
export class ReportGenerator {
  private includeRawData: boolean;
  private maxTimelineItems: number;

  constructor(includeRawData: boolean = false, maxTimelineItems: number = 20) {
    this.includeRawData = includeRawData;
    this.maxTimelineItems = maxTimelineItems;
  }

  /**
   * Generate a comprehensive analysis report for a single claim
   * @param claim - The extracted claim
   * @param evidence - Array of evidence from fact-checking
   * @param confidenceBreakdown - Aggregated confidence analysis
   * @param processingTime - Time taken to process the claim
   * @returns AnalysisReport with detailed explanation
   */
  public generateClaimReport(
    claim: Claim,
    evidence: Evidence[],
    confidenceBreakdown: AggregatedConfidence,
    processingTime: number
  ): AnalysisReport {
    const finalVerdict = this.determineFinalVerdict(evidence, confidenceBreakdown);
    const timeline = this.createEvidenceTimeline(evidence);
    const explanation = this.generateExplanation(claim, evidence, confidenceBreakdown, finalVerdict);

    return {
      claimId: claim.id,
      claimText: claim.text,
      finalVerdict,
      confidenceScore: confidenceBreakdown.finalScore,
      evidence: this.includeRawData ? evidence : this.sanitizeEvidence(evidence),
      confidenceBreakdown,
      timeline,
      explanation,
      processingTime,
      timestamp: new Date()
    };
  }

  /**
   * Generate a comprehensive content analysis result
   * @param inputText - Original input text
   * @param claims - Extracted claims
   * @param reports - Analysis reports for each claim
   * @param processingTime - Total processing time
   * @returns ContentAnalysisResult with overall analysis
   */
  public generateContentAnalysisResult(
    inputText: string,
    claims: Claim[],
    reports: AnalysisReport[],
    processingTime: number
  ): ContentAnalysisResult {
    const overallConfidence = this.calculateOverallConfidence(reports);
    
    return {
      inputText,
      claims: this.includeRawData ? claims : this.sanitizeClaims(claims),
      reports,
      overallConfidence,
      processingTime,
      timestamp: new Date()
    };
  }

  /**
   * Determine final verdict based on evidence and confidence
   */
  private determineFinalVerdict(evidence: Evidence[], confidenceBreakdown: AggregatedConfidence): Verdict {
    if (evidence.length === 0) {
      return Verdict.UNCERTAIN;
    }

    // Group evidence by verdict
    const verdictCounts = new Map<Verdict, number>();
    evidence.forEach(ev => {
      verdictCounts.set(ev.verdict, (verdictCounts.get(ev.verdict) || 0) + 1);
    });

    // If confidence is very low, return uncertain
    if (confidenceBreakdown.finalScore < 0.3) {
      return Verdict.UNCERTAIN;
    }

    // Find the most common verdict
    let mostCommonVerdict = Verdict.UNCERTAIN;
    let maxCount = 0;

    verdictCounts.forEach((count, verdict) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonVerdict = verdict;
      }
    });

    // If there's a tie or mixed evidence, consider confidence
    const uniqueVerdicts = verdictCounts.size;
    if (uniqueVerdicts > 1) {
      // Check for conflicting evidence
      if (verdictCounts.has(Verdict.TRUE) && verdictCounts.has(Verdict.FALSE)) {
        return confidenceBreakdown.finalScore > 0.6 ? mostCommonVerdict : Verdict.UNCERTAIN;
      }
      
      // Check for partial truth
      if (verdictCounts.has(Verdict.PARTIALLY_TRUE)) {
        return Verdict.PARTIALLY_TRUE;
      }
    }

    return mostCommonVerdict;
  }

  /**
   * Create chronological evidence timeline
   */
  private createEvidenceTimeline(evidence: Evidence[]): Evidence[] {
    // Sort evidence by timestamp (newest first)
    const sortedEvidence = [...evidence].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Limit timeline items
    return sortedEvidence.slice(0, this.maxTimelineItems);
  }

  /**
   * Generate detailed explanation for the analysis
   */
  private generateExplanation(
    claim: Claim,
    evidence: Evidence[],
    confidenceBreakdown: AggregatedConfidence,
    finalVerdict: Verdict
  ): string {
    const explanationParts: string[] = [];

    // Add claim context
    explanationParts.push(`Analysis of claim: "${claim.text}"`);

    // Add verdict explanation
    explanationParts.push(this.getVerdictExplanation(finalVerdict, confidenceBreakdown.finalScore));

    // Add evidence summary
    if (evidence.length > 0) {
      explanationParts.push(this.getEvidenceSummary(evidence));
    } else {
      explanationParts.push("No evidence was found to verify this claim.");
    }

    // Add confidence reasoning
    explanationParts.push(confidenceBreakdown.reasoning);

    // Add source analysis
    const sourceAnalysis = this.getSourceAnalysis(evidence);
    if (sourceAnalysis) {
      explanationParts.push(sourceAnalysis);
    }

    // Add temporal analysis
    const temporalAnalysis = this.getTemporalAnalysis(evidence);
    if (temporalAnalysis) {
      explanationParts.push(temporalAnalysis);
    }

    return explanationParts.join(' ');
  }

  /**
   * Get explanation for the final verdict
   */
  private getVerdictExplanation(verdict: Verdict, confidence: number): string {
    const confidenceLevel = confidence >= 0.8 ? 'high' : 
                           confidence >= 0.6 ? 'moderate' : 
                           confidence >= 0.4 ? 'low' : 'very low';

    switch (verdict) {
      case Verdict.TRUE:
        return `The claim appears to be TRUE with ${confidenceLevel} confidence.`;
      case Verdict.FALSE:
        return `The claim appears to be FALSE with ${confidenceLevel} confidence.`;
      case Verdict.PARTIALLY_TRUE:
        return `The claim is PARTIALLY TRUE with ${confidenceLevel} confidence. Some aspects are accurate while others may be misleading.`;
      case Verdict.MISLEADING:
        return `The claim is MISLEADING with ${confidenceLevel} confidence. While it may contain some truth, it presents information in a deceptive manner.`;
      case Verdict.UNCERTAIN:
        return `The claim is UNCERTAIN with ${confidenceLevel} confidence. Insufficient or conflicting evidence makes it difficult to determine accuracy.`;
      default:
        return `The claim could not be properly evaluated.`;
    }
  }

  /**
   * Get summary of evidence
   */
  private getEvidenceSummary(evidence: Evidence[]): string {
    const totalSources = evidence.length;
    const sourceTypes = new Set(evidence.map(ev => ev.sourceType));
    const verdicts = new Map<Verdict, number>();

    evidence.forEach(ev => {
      verdicts.set(ev.verdict, (verdicts.get(ev.verdict) || 0) + 1);
    });

    const verdictSummary = Array.from(verdicts.entries())
      .map(([verdict, count]) => `${count} ${verdict.toLowerCase()}`)
      .join(', ');

    return `Found ${totalSources} evidence sources from ${sourceTypes.size} different source types. Verdicts: ${verdictSummary}.`;
  }

  /**
   * Get source analysis
   */
  private getSourceAnalysis(evidence: Evidence[]): string | null {
    if (evidence.length === 0) return null;

    const sourceTypeCounts = new Map();
    evidence.forEach(ev => {
      sourceTypeCounts.set(ev.sourceType, (sourceTypeCounts.get(ev.sourceType) || 0) + 1);
    });

    const sourceAnalysis: string[] = [];
    sourceTypeCounts.forEach((count, sourceType) => {
      const credibility = this.getSourceCredibilityDescription(sourceType);
      sourceAnalysis.push(`${count} ${sourceType.toLowerCase()} source${count > 1 ? 's' : ''} (${credibility})`);
    });

    return `Source analysis: ${sourceAnalysis.join(', ')}.`;
  }

  /**
   * Get source credibility description
   */
  private getSourceCredibilityDescription(sourceType: string): string {
    const descriptions = {
      'OFFICIAL': 'high credibility',
      'MAJOR_NEWS': 'high credibility',
      'BLOG': 'moderate credibility',
      'SOCIAL_MEDIA': 'lower credibility',
      'UNKNOWN': 'unknown credibility'
    };

    return descriptions[sourceType] || 'unknown credibility';
  }

  /**
   * Get temporal analysis
   */
  private getTemporalAnalysis(evidence: Evidence[]): string | null {
    if (evidence.length < 2) return null;

    const timestamps = evidence.map(ev => ev.timestamp.getTime());
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);
    const timeSpan = newest - oldest;
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);

    if (daysSpan > 30) {
      return "Evidence spans over a month, indicating this is an evolving story with multiple updates.";
    } else if (daysSpan > 7) {
      return "Evidence spans over a week, showing recent developments in the story.";
    } else if (daysSpan > 1) {
      return "Evidence spans multiple days, suggesting ongoing updates to the information.";
    } else {
      return "All evidence is from the same day, indicating immediate reporting of the event.";
    }
  }

  /**
   * Calculate overall confidence across all claims
   */
  private calculateOverallConfidence(reports: AnalysisReport[]): number {
    if (reports.length === 0) return 0;

    const totalConfidence = reports.reduce((sum, report) => sum + report.confidenceScore, 0);
    return totalConfidence / reports.length;
  }

  /**
   * Sanitize evidence by removing raw response data
   */
  private sanitizeEvidence(evidence: Evidence[]): Evidence[] {
    return evidence.map(ev => ({
      ...ev,
      rawResponse: undefined
    }));
  }

  /**
   * Sanitize claims by removing sensitive data
   */
  private sanitizeClaims(claims: Claim[]): Claim[] {
    return claims.map(claim => ({
      ...claim,
      // Remove any sensitive data if needed
    }));
  }

  /**
   * Format report as JSON string
   */
  public formatAsJSON(result: ContentAnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Format report as human-readable text
   */
  public formatAsText(result: ContentAnalysisResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(80));
    lines.push('VEDA CONTENT ANALYSIS REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    
    lines.push(`Input Text: ${result.inputText}`);
    lines.push(`Analysis Date: ${format(result.timestamp, 'yyyy-MM-dd HH:mm:ss')}`);
    lines.push(`Processing Time: ${result.processingTime}ms`);
    lines.push(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    lines.push('');
    
    lines.push(`Claims Found: ${result.claims.length}`);
    lines.push('');
    
    result.reports.forEach((report, index) => {
      lines.push(`Claim ${index + 1}: ${report.claimText}`);
      lines.push(`Verdict: ${report.finalVerdict}`);
      lines.push(`Confidence: ${(report.confidenceScore * 100).toFixed(1)}%`);
      lines.push(`Evidence Sources: ${report.evidence.length}`);
      lines.push('');
      lines.push('Explanation:');
      lines.push(report.explanation);
      lines.push('');
      lines.push('-'.repeat(40));
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * Export report in different formats
   */
  public exportReport(result: ContentAnalysisResult, format: 'json' | 'text' | 'both' = 'both'): any {
    switch (format) {
      case 'json':
        return this.formatAsJSON(result);
      case 'text':
        return this.formatAsText(result);
      case 'both':
        return {
          json: this.formatAsJSON(result),
          text: this.formatAsText(result)
        };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}