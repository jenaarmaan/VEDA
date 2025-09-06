import { Evidence, SourceType, Verdict, AggregatedConfidence, ConfidenceBreakdown, SourceCredibilityWeights } from '../types';
import { FactChecker } from './FactChecker';

/**
 * ConfidenceAggregator class for merging evidence scores using source credibility weights
 * Implements weighted sum algorithm: C = Σ(wi * si)
 */
export class ConfidenceAggregator {
  private sourceWeights: SourceCredibilityWeights;
  private factChecker: FactChecker;

  constructor(factChecker: FactChecker, customWeights?: Partial<SourceCredibilityWeights>) {
    this.factChecker = factChecker;
    
    // Default source credibility weights
    this.sourceWeights = {
      [SourceType.OFFICIAL]: 1.0,
      [SourceType.MAJOR_NEWS]: 0.8,
      [SourceType.SOCIAL_MEDIA]: 0.5,
      [SourceType.BLOG]: 0.6,
      [SourceType.UNKNOWN]: 0.3,
      ...customWeights
    };
  }

  /**
   * Aggregate evidence from multiple sources into a final confidence score
   * @param evidence - Array of evidence from different sources
   * @returns AggregatedConfidence with final score and breakdown
   */
  public aggregateConfidence(evidence: Evidence[]): AggregatedConfidence {
    if (evidence.length === 0) {
      return this.createEmptyConfidence();
    }

    // Group evidence by source type
    const evidenceBySource = this.groupEvidenceBySource(evidence);
    
    // Calculate weighted scores for each source type
    const breakdown: ConfidenceBreakdown[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [sourceType, sourceEvidence] of evidenceBySource.entries()) {
      const sourceWeight = this.sourceWeights[sourceType];
      const sourceScore = this.calculateSourceScore(sourceEvidence);
      const weightedScore = sourceWeight * sourceScore;
      
      breakdown.push({
        sourceType,
        weight: sourceWeight,
        score: sourceScore,
        contribution: weightedScore
      });

      totalWeightedScore += weightedScore;
      totalWeight += sourceWeight;
    }

    // Calculate final confidence score
    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Generate reasoning
    const reasoning = this.generateReasoning(breakdown, finalScore, evidence);

    return {
      finalScore: Math.min(Math.max(finalScore, 0), 1), // Clamp between 0 and 1
      breakdown,
      reasoning
    };
  }

  /**
   * Group evidence by source type
   */
  private groupEvidenceBySource(evidence: Evidence[]): Map<SourceType, Evidence[]> {
    const grouped = new Map<SourceType, Evidence[]>();

    evidence.forEach(ev => {
      if (!grouped.has(ev.sourceType)) {
        grouped.set(ev.sourceType, []);
      }
      grouped.get(ev.sourceType)!.push(ev);
    });

    return grouped;
  }

  /**
   * Calculate average score for a source type
   */
  private calculateSourceScore(sourceEvidence: Evidence[]): number {
    if (sourceEvidence.length === 0) return 0;

    // Convert verdicts to numerical scores
    const scores = sourceEvidence.map(ev => this.verdictToScore(ev.verdict) * ev.confidenceScore);
    
    // Calculate weighted average based on confidence scores
    const totalConfidence = sourceEvidence.reduce((sum, ev) => sum + ev.confidenceScore, 0);
    const weightedSum = sourceEvidence.reduce((sum, ev) => {
      const verdictScore = this.verdictToScore(ev.verdict);
      return sum + (verdictScore * ev.confidenceScore);
    }, 0);

    return totalConfidence > 0 ? weightedSum / totalConfidence : 0;
  }

  /**
   * Convert verdict to numerical score
   */
  private verdictToScore(verdict: Verdict): number {
    const verdictScores = {
      [Verdict.TRUE]: 1.0,
      [Verdict.PARTIALLY_TRUE]: 0.6,
      [Verdict.UNCERTAIN]: 0.5,
      [Verdict.MISLEADING]: 0.3,
      [Verdict.FALSE]: 0.0
    };

    return verdictScores[verdict];
  }

  /**
   * Generate human-readable reasoning for the confidence score
   */
  private generateReasoning(breakdown: ConfidenceBreakdown[], finalScore: number, evidence: Evidence[]): string {
    const reasoningParts: string[] = [];

    // Add overall assessment
    if (finalScore >= 0.8) {
      reasoningParts.push("High confidence in the claim based on multiple reliable sources.");
    } else if (finalScore >= 0.6) {
      reasoningParts.push("Moderate confidence in the claim with some supporting evidence.");
    } else if (finalScore >= 0.4) {
      reasoningParts.push("Low confidence due to limited or conflicting evidence.");
    } else {
      reasoningParts.push("Very low confidence due to insufficient or contradictory evidence.");
    }

    // Add source-specific reasoning
    const sourceCounts = new Map<SourceType, number>();
    evidence.forEach(ev => {
      sourceCounts.set(ev.sourceType, (sourceCounts.get(ev.sourceType) || 0) + 1);
    });

    const sourceDescriptions: string[] = [];
    sourceCounts.forEach((count, sourceType) => {
      const weight = this.sourceWeights[sourceType];
      const sourceName = this.getSourceTypeName(sourceType);
      
      if (weight >= 0.8) {
        sourceDescriptions.push(`${count} ${sourceName} source${count > 1 ? 's' : ''} (high credibility)`);
      } else if (weight >= 0.6) {
        sourceDescriptions.push(`${count} ${sourceName} source${count > 1 ? 's' : ''} (moderate credibility)`);
      } else {
        sourceDescriptions.push(`${count} ${sourceName} source${count > 1 ? 's' : ''} (lower credibility)`);
      }
    });

    if (sourceDescriptions.length > 0) {
      reasoningParts.push(`Evidence gathered from: ${sourceDescriptions.join(', ')}.`);
    }

    // Add temporal analysis
    const temporalAnalysis = this.analyzeTemporalPatterns(evidence);
    if (temporalAnalysis) {
      reasoningParts.push(temporalAnalysis);
    }

    // Add conflict analysis
    const conflictAnalysis = this.analyzeConflicts(evidence);
    if (conflictAnalysis) {
      reasoningParts.push(conflictAnalysis);
    }

    return reasoningParts.join(' ');
  }

  /**
   * Get human-readable name for source type
   */
  private getSourceTypeName(sourceType: SourceType): string {
    const names = {
      [SourceType.OFFICIAL]: 'official',
      [SourceType.MAJOR_NEWS]: 'major news',
      [SourceType.SOCIAL_MEDIA]: 'social media',
      [SourceType.BLOG]: 'blog',
      [SourceType.UNKNOWN]: 'unknown'
    };

    return names[sourceType];
  }

  /**
   * Analyze temporal patterns in evidence
   */
  private analyzeTemporalPatterns(evidence: Evidence[]): string | null {
    if (evidence.length < 2) return null;

    // Sort evidence by timestamp
    const sortedEvidence = [...evidence].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const oldest = sortedEvidence[0];
    const newest = sortedEvidence[sortedEvidence.length - 1];
    const timeDiff = newest.timestamp.getTime() - oldest.timestamp.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      return "Evidence spans over a month, indicating evolving information.";
    } else if (daysDiff > 7) {
      return "Evidence spans over a week, showing recent developments.";
    } else if (daysDiff > 1) {
      return "Evidence spans multiple days, suggesting ongoing updates.";
    } else {
      return "All evidence is from the same day, indicating immediate reporting.";
    }
  }

  /**
   * Analyze conflicts in evidence
   */
  private analyzeConflicts(evidence: Evidence[]): string | null {
    const verdictCounts = new Map<Verdict, number>();
    evidence.forEach(ev => {
      verdictCounts.set(ev.verdict, (verdictCounts.get(ev.verdict) || 0) + 1);
    });

    const uniqueVerdicts = verdictCounts.size;
    if (uniqueVerdicts > 2) {
      return "Conflicting evidence from multiple sources with different verdicts.";
    } else if (uniqueVerdicts === 2) {
      const verdicts = Array.from(verdictCounts.keys());
      if (verdicts.includes(Verdict.TRUE) && verdicts.includes(Verdict.FALSE)) {
        return "Directly conflicting evidence between true and false verdicts.";
      } else if (verdicts.includes(Verdict.UNCERTAIN)) {
        return "Mixed evidence with some sources uncertain.";
      }
    }

    return null;
  }

  /**
   * Create empty confidence result
   */
  private createEmptyConfidence(): AggregatedConfidence {
    return {
      finalScore: 0,
      breakdown: [],
      reasoning: "No evidence available to assess the claim."
    };
  }

  /**
   * Update source credibility weights
   */
  public updateSourceWeights(newWeights: Partial<SourceCredibilityWeights>): void {
    this.sourceWeights = { ...this.sourceWeights, ...newWeights };
  }

  /**
   * Get current source weights
   */
  public getSourceWeights(): SourceCredibilityWeights {
    return { ...this.sourceWeights };
  }

  /**
   * Calculate confidence for a specific verdict
   */
  public calculateVerdictConfidence(evidence: Evidence[], targetVerdict: Verdict): number {
    const relevantEvidence = evidence.filter(ev => ev.verdict === targetVerdict);
    
    if (relevantEvidence.length === 0) return 0;

    const aggregated = this.aggregateConfidence(relevantEvidence);
    return aggregated.finalScore;
  }

  /**
   * Get confidence breakdown by verdict
   */
  public getVerdictBreakdown(evidence: Evidence[]): Map<Verdict, number> {
    const breakdown = new Map<Verdict, number>();
    
    Object.values(Verdict).forEach(verdict => {
      const confidence = this.calculateVerdictConfidence(evidence, verdict);
      breakdown.set(verdict, confidence);
    });

    return breakdown;
  }
}