import { ClaimExtractor } from './ClaimExtractor';
import { FactChecker } from './FactChecker';
import { ConfidenceAggregator } from './ConfidenceAggregator';
import { ReportGenerator } from './ReportGenerator';
import { 
  ContentAnalysisResult, 
  AnalysisReport, 
  Claim, 
  Evidence, 
  APIConfig 
} from '../types';

/**
 * Main ContentAnalysisAgent class that orchestrates the entire fact-checking workflow
 * Implements the hybrid multi-agent architecture for VEDA misinformation verification
 */
export class ContentAnalysisAgent {
  private claimExtractor: ClaimExtractor;
  private factChecker: FactChecker;
  private confidenceAggregator: ConfidenceAggregator;
  private reportGenerator: ReportGenerator;
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
    
    // Initialize all components
    this.claimExtractor = new ClaimExtractor();
    this.factChecker = new FactChecker(config);
    this.confidenceAggregator = new ConfidenceAggregator(this.factChecker);
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Main method to analyze content for misinformation
   * @param inputText - The text content to analyze
   * @returns Promise<ContentAnalysisResult> - Complete analysis with claims, evidence, and reports
   */
  public async analyzeContent(inputText: string): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting content analysis...');
      
      // Step 1: Extract claims from input text
      console.log('Step 1: Extracting claims...');
      const claims = await this.extractClaims(inputText);
      console.log(`Found ${claims.length} claims`);

      if (claims.length === 0) {
        return this.createEmptyResult(inputText, Date.now() - startTime);
      }

      // Step 2: Fact-check each claim in parallel
      console.log('Step 2: Fact-checking claims...');
      const evidenceArrays = await this.factCheckClaims(claims);
      console.log('Fact-checking completed');

      // Step 3: Generate analysis reports for each claim
      console.log('Step 3: Generating reports...');
      const reports = await this.generateReports(claims, evidenceArrays);
      console.log('Reports generated');

      // Step 4: Create final result
      const result = this.reportGenerator.generateContentAnalysisResult(
        inputText,
        claims,
        reports,
        Date.now() - startTime
      );

      console.log('Content analysis completed successfully');
      return result;

    } catch (error) {
      console.error('Error during content analysis:', error);
      return this.createErrorResult(inputText, error, Date.now() - startTime);
    }
  }

  /**
   * Extract claims from input text using NLP
   */
  private async extractClaims(inputText: string): Promise<Claim[]> {
    try {
      return await this.claimExtractor.extractClaims(inputText);
    } catch (error) {
      console.error('Error extracting claims:', error);
      return [];
    }
  }

  /**
   * Fact-check all claims in parallel
   */
  private async factCheckClaims(claims: Claim[]): Promise<Evidence[][]> {
    const claimTexts = claims.map(claim => claim.text);
    
    try {
      return await this.factChecker.checkClaims(claimTexts);
    } catch (error) {
      console.error('Error fact-checking claims:', error);
      // Return empty evidence arrays for each claim
      return claims.map(() => []);
    }
  }

  /**
   * Generate analysis reports for each claim
   */
  private async generateReports(claims: Claim[], evidenceArrays: Evidence[][]): Promise<AnalysisReport[]> {
    const reports: AnalysisReport[] = [];

    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      const evidence = evidenceArrays[i] || [];

      try {
        // Aggregate confidence from evidence
        const confidenceBreakdown = this.confidenceAggregator.aggregateConfidence(evidence);
        
        // Generate report
        const report = this.reportGenerator.generateClaimReport(
          claim,
          evidence,
          confidenceBreakdown,
          0 // Processing time for individual claim
        );

        reports.push(report);
      } catch (error) {
        console.error(`Error generating report for claim ${claim.id}:`, error);
        
        // Create fallback report
        const fallbackReport = this.createFallbackReport(claim, evidence);
        reports.push(fallbackReport);
      }
    }

    return reports;
  }

  /**
   * Create empty result when no claims are found
   */
  private createEmptyResult(inputText: string, processingTime: number): ContentAnalysisResult {
    return {
      inputText,
      claims: [],
      reports: [],
      overallConfidence: 0,
      processingTime,
      timestamp: new Date()
    };
  }

  /**
   * Create error result when analysis fails
   */
  private createErrorResult(inputText: string, error: any, processingTime: number): ContentAnalysisResult {
    return {
      inputText,
      claims: [],
      reports: [],
      overallConfidence: 0,
      processingTime,
      timestamp: new Date(),
      error: error.message || 'Unknown error occurred during analysis'
    };
  }

  /**
   * Create fallback report when report generation fails
   */
  private createFallbackReport(claim: Claim, evidence: Evidence[]): AnalysisReport {
    return {
      claimId: claim.id,
      claimText: claim.text,
      finalVerdict: 'UNCERTAIN' as any,
      confidenceScore: 0,
      evidence,
      confidenceBreakdown: {
        finalScore: 0,
        breakdown: [],
        reasoning: 'Unable to generate confidence analysis due to processing error.'
      },
      timeline: evidence,
      explanation: 'Analysis failed due to processing error. Unable to determine claim accuracy.',
      processingTime: 0,
      timestamp: new Date()
    };
  }

  /**
   * Analyze content with custom configuration
   */
  public async analyzeContentWithConfig(
    inputText: string, 
    customConfig: Partial<APIConfig>
  ): Promise<ContentAnalysisResult> {
    // Create temporary agent with custom config
    const tempConfig = { ...this.config, ...customConfig };
    const tempAgent = new ContentAnalysisAgent(tempConfig);
    
    return tempAgent.analyzeContent(inputText);
  }

  /**
   * Get analysis statistics
   */
  public getAnalysisStats(result: ContentAnalysisResult): any {
    const stats = {
      totalClaims: result.claims.length,
      totalEvidence: result.reports.reduce((sum, report) => sum + report.evidence.length, 0),
      averageConfidence: result.overallConfidence,
      verdictDistribution: this.getVerdictDistribution(result),
      sourceTypeDistribution: this.getSourceTypeDistribution(result),
      processingTime: result.processingTime
    };

    return stats;
  }

  /**
   * Get verdict distribution across all reports
   */
  private getVerdictDistribution(result: ContentAnalysisResult): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    result.reports.forEach(report => {
      const verdict = report.finalVerdict;
      distribution[verdict] = (distribution[verdict] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get source type distribution across all evidence
   */
  private getSourceTypeDistribution(result: ContentAnalysisResult): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    result.reports.forEach(report => {
      report.evidence.forEach(evidence => {
        const sourceType = evidence.sourceType;
        distribution[sourceType] = (distribution[sourceType] || 0) + 1;
      });
    });

    return distribution;
  }

  /**
   * Export analysis result in different formats
   */
  public exportResult(result: ContentAnalysisResult, format: 'json' | 'text' | 'both' = 'json'): any {
    return this.reportGenerator.exportReport(result, format);
  }

  /**
   * Update API configuration
   */
  public updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize fact checker with new config
    this.factChecker = new FactChecker(this.config);
    this.confidenceAggregator = new ConfidenceAggregator(this.factChecker);
  }

  /**
   * Get current configuration
   */
  public getConfig(): APIConfig {
    return { ...this.config };
  }

  /**
   * Health check for all components
   */
  public async healthCheck(): Promise<{ [key: string]: boolean }> {
    const health = {
      claimExtractor: true, // Always available (no external dependencies)
      factChecker: false,
      confidenceAggregator: true, // Always available
      reportGenerator: true // Always available
    };

    // Test fact checker (this would normally ping the APIs)
    try {
      // For now, just check if the client is initialized
      health.factChecker = this.factChecker !== null;
    } catch (error) {
      health.factChecker = false;
    }

    return health;
  }
}