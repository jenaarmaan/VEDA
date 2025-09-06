/**
 * DecisionEngine - Applies ensemble voting and confidence thresholds for final verdicts
 * Implements sophisticated decision-making algorithms for misinformation detection
 */

import { 
  AggregationResult,
  Verdict,
  AgentContribution,
  Evidence,
  VerificationRequest,
  DecisionResult,
  CertaintyLevel,
  RiskAssessment,
  AgentConsensus
} from '../types';

export interface DecisionConfig {
  confidenceThresholds: {
    very_high: number;
    high: number;
    medium: number;
    low: number;
  };
  consensusThresholds: {
    strong: number;
    moderate: number;
    weak: number;
  };
  evidenceThresholds: {
    strong: number;
    moderate: number;
    weak: number;
  };
  riskFactors: {
    highConfidenceFalse: number;
    lowConfidenceTrue: number;
    conflictingEvidence: number;
    insufficientAgents: number;
  };
}

export class DecisionEngine {
  private config: DecisionConfig;

  constructor(config?: Partial<DecisionConfig>) {
    this.config = {
      confidenceThresholds: {
        very_high: 0.9,
        high: 0.75,
        medium: 0.6,
        low: 0.4
      },
      consensusThresholds: {
        strong: 0.8,
        moderate: 0.6,
        weak: 0.4
      },
      evidenceThresholds: {
        strong: 0.8,
        moderate: 0.6,
        weak: 0.4
      },
      riskFactors: {
        highConfidenceFalse: 0.8,
        lowConfidenceTrue: 0.6,
        conflictingEvidence: 0.7,
        insufficientAgents: 0.5
      },
      ...config
    };
  }

  /**
   * Make final decision based on aggregated results
   */
  makeDecision(
    aggregation: AggregationResult,
    request: VerificationRequest
  ): DecisionResult {
    const startTime = Date.now();

    // Analyze consensus strength
    const consensusStrength = this.analyzeConsensusStrength(aggregation.agentContributions);
    
    // Analyze evidence quality
    const evidenceQuality = this.analyzeEvidenceQuality(aggregation.evidence);
    
    // Determine certainty level
    const certainty = this.determineCertaintyLevel(aggregation.confidence, consensusStrength, evidenceQuality);
    
    // Apply ensemble voting logic
    const finalVerdict = this.applyEnsembleVoting(aggregation, consensusStrength, evidenceQuality);
    
    // Calculate final confidence
    const finalConfidence = this.calculateFinalConfidence(
      aggregation.confidence,
      consensusStrength,
      evidenceQuality,
      certainty
    );
    
    // Assess risk
    const riskAssessment = this.assessRisk(aggregation, finalVerdict, finalConfidence);
    
    // Generate reasoning
    const reasoning = this.generateDecisionReasoning(
      aggregation,
      finalVerdict,
      certainty,
      consensusStrength,
      evidenceQuality
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      finalVerdict,
      certainty,
      riskAssessment,
      aggregation
    );

    const processingTime = Date.now() - startTime;

    return {
      finalVerdict,
      confidence: finalConfidence,
      certainty,
      reasoning,
      recommendations,
      riskAssessment,
      agentConsensus: this.calculateAgentConsensus(aggregation),
      evidence: aggregation.evidence,
      processingTime,
      timestamp: Date.now(),
      metadata: {
        decisionMethod: this.getDecisionMethod(aggregation),
        consensusStrength,
        evidenceQuality: aggregation.metadata.consensusStrength,
        processingTime
      }
    };
  }

  private analyzeConsensusStrength(contributions: AgentContribution[]): number {
    if (contributions.length === 0) return 0;

    // Group by verdict
    const verdictGroups = new Map<Verdict, AgentContribution[]>();
    for (const contribution of contributions) {
      const existing = verdictGroups.get(contribution.verdict) || [];
      existing.push(contribution);
      verdictGroups.set(contribution.verdict, existing);
    }

    // Find the dominant verdict
    let maxWeight = 0;
    let totalWeight = 0;

    for (const [verdict, group] of verdictGroups) {
      const groupWeight = group.reduce((sum, c) => sum + c.weight, 0);
      totalWeight += groupWeight;
      maxWeight = Math.max(maxWeight, groupWeight);
    }

    if (totalWeight === 0) return 0;

    // Calculate consensus strength as ratio of dominant verdict weight
    const consensusRatio = maxWeight / totalWeight;

    // Adjust for number of agents (more agents = potentially stronger consensus)
    const agentCountFactor = Math.min(1.0, contributions.length / 3); // Normalize to 3 agents

    return consensusRatio * agentCountFactor;
  }

  private analyzeEvidenceQuality(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;

    // Calculate average reliability
    const avgReliability = evidence.reduce((sum, e) => sum + e.reliability, 0) / evidence.length;
    
    // Factor in evidence diversity
    const evidenceTypes = new Set(evidence.map(e => e.type));
    const diversityFactor = Math.min(1.0, evidenceTypes.size / 4); // Normalize to 4 types
    
    // Factor in evidence recency (if timestamps available)
    const recentEvidence = evidence.filter(e => {
      if (!e.timestamp) return true; // Assume recent if no timestamp
      const age = Date.now() - e.timestamp.getTime();
      return age < 30 * 24 * 60 * 60 * 1000; // 30 days
    });
    const recencyFactor = recentEvidence.length / evidence.length;

    return (avgReliability * 0.5 + diversityFactor * 0.3 + recencyFactor * 0.2);
  }

  private determineCertaintyLevel(
    confidence: number,
    consensusStrength: number,
    evidenceQuality: number
  ): CertaintyLevel {
    const combinedScore = (confidence * 0.4 + consensusStrength * 0.4 + evidenceQuality * 0.2);

    if (combinedScore >= this.config.confidenceThresholds.very_high) {
      return 'very_high';
    } else if (combinedScore >= this.config.confidenceThresholds.high) {
      return 'high';
    } else if (combinedScore >= this.config.confidenceThresholds.medium) {
      return 'medium';
    } else if (combinedScore >= this.config.confidenceThresholds.low) {
      return 'low';
    } else {
      return 'very_low';
    }
  }

  private applyEnsembleVoting(
    aggregation: AggregationResult,
    consensusStrength: number,
    evidenceQuality: number
  ): Verdict {
    const { consensusVerdict, confidence } = aggregation;

    // If consensus is strong and evidence is good, trust the consensus
    if (consensusStrength >= this.config.consensusThresholds.strong && 
        evidenceQuality >= this.config.evidenceThresholds.strong) {
      return consensusVerdict;
    }

    // If confidence is very high, trust the result
    if (confidence >= this.config.confidenceThresholds.very_high) {
      return consensusVerdict;
    }

    // If consensus is moderate but evidence is strong, trust consensus
    if (consensusStrength >= this.config.consensusThresholds.moderate && 
        evidenceQuality >= this.config.evidenceThresholds.strong) {
      return consensusVerdict;
    }

    // If evidence is very strong, trust it even with weak consensus
    if (evidenceQuality >= this.config.evidenceThresholds.strong && 
        confidence >= this.config.confidenceThresholds.medium) {
      return consensusVerdict;
    }

    // If consensus is weak and evidence is poor, mark as unverified
    if (consensusStrength < this.config.consensusThresholds.weak || 
        evidenceQuality < this.config.evidenceThresholds.weak) {
      return 'unverified';
    }

    // Default to consensus verdict with lower confidence
    return consensusVerdict;
  }

  private calculateFinalConfidence(
    baseConfidence: number,
    consensusStrength: number,
    evidenceQuality: number,
    certainty: CertaintyLevel
  ): number {
    // Base confidence from aggregation
    let finalConfidence = baseConfidence;

    // Adjust based on consensus strength
    if (consensusStrength >= this.config.consensusThresholds.strong) {
      finalConfidence *= 1.1; // Boost confidence
    } else if (consensusStrength < this.config.consensusThresholds.weak) {
      finalConfidence *= 0.8; // Reduce confidence
    }

    // Adjust based on evidence quality
    if (evidenceQuality >= this.config.evidenceThresholds.strong) {
      finalConfidence *= 1.05; // Slight boost
    } else if (evidenceQuality < this.config.evidenceThresholds.weak) {
      finalConfidence *= 0.9; // Slight reduction
    }

    // Apply certainty level adjustment
    const certaintyMultipliers: Record<CertaintyLevel, number> = {
      'very_high': 1.0,
      'high': 0.95,
      'medium': 0.85,
      'low': 0.7,
      'very_low': 0.5
    };

    finalConfidence *= certaintyMultipliers[certainty];

    return Math.min(1.0, Math.max(0.0, finalConfidence));
  }

  private assessRisk(
    aggregation: AggregationResult,
    verdict: Verdict,
    confidence: number
  ): RiskAssessment {
    const riskFactors: string[] = [];
    const mitigation: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low' as 'low' | 'medium' | 'high' | 'critical';

    // High confidence false positive/negative
    if (verdict === 'verified_false' && confidence > this.config.riskFactors.highConfidenceFalse) {
      riskFactors.push('High confidence false claim detection');
      riskLevel = 'high';
    }

    if (verdict === 'verified_true' && confidence < this.config.riskFactors.lowConfidenceTrue) {
      riskFactors.push('Low confidence true claim verification');
      riskLevel = 'high';
    }

    // Conflicting evidence
    const conflictingAgents = aggregation.agentContributions.filter(
      c => c.verdict !== verdict
    );
    if (conflictingAgents.length > 0 && confidence > this.config.riskFactors.conflictingEvidence) {
      riskFactors.push('Conflicting agent opinions');
      riskLevel = 'high';
    }

    // Insufficient agents
    if (aggregation.metadata.successfulAgents < 2) {
      riskFactors.push('Limited agent consensus');
      riskLevel = 'high';
    }

    // Generate mitigation strategies
    if (riskLevel === 'high' || riskLevel === 'critical') {
      mitigation.push('Manual review recommended');
      mitigation.push('Additional verification sources needed');
    }

    if (confidence < 0.6) {
      mitigation.push('User should verify independently');
    }

    if (aggregation.metadata.failedAgents > 0) {
      mitigation.push('Retry with additional agents');
    }

    return {
      riskLevel: riskLevel,
      riskFactors: riskFactors,
      mitigationStrategies: mitigation,
      confidence: aggregation.confidence,
      level: riskLevel,
      factors: riskFactors,
      mitigation: mitigation
    };
  }

  private calculateAgentConsensus(aggregation: AggregationResult): AgentConsensus {
    const contributions = aggregation.agentContributions;
    if (contributions.length === 0) {
      return {
        agreementLevel: 0,
        majorityVerdict: 'unverified',
        dissentingAgents: [],
        consensusStrength: 'none'
      };
    }

    // Count verdicts
    const verdictCounts = new Map<Verdict, number>();
    contributions.forEach(contrib => {
      verdictCounts.set(contrib.verdict, (verdictCounts.get(contrib.verdict) || 0) + 1);
    });

    // Find majority verdict
    let majorityVerdict: Verdict = 'unverified';
    let maxCount = 0;
    for (const [verdict, count] of verdictCounts) {
      if (count > maxCount) {
        maxCount = count;
        majorityVerdict = verdict;
      }
    }

    // Calculate agreement level
    const agreementLevel = maxCount / contributions.length;

    // Find dissenting agents
    const dissentingAgents = contributions
      .filter(contrib => contrib.verdict !== majorityVerdict)
      .map(contrib => contrib.agentId);

    // Determine consensus strength
    let consensusStrength: 'strong' | 'moderate' | 'weak' | 'none';
    if (agreementLevel >= 0.8) {
      consensusStrength = 'strong';
    } else if (agreementLevel >= 0.6) {
      consensusStrength = 'moderate';
    } else if (agreementLevel >= 0.4) {
      consensusStrength = 'weak';
    } else {
      consensusStrength = 'none';
    }

    return {
      agreementLevel,
      majorityVerdict,
      dissentingAgents,
      consensusStrength
    };
  }

  private generateDecisionReasoning(
    aggregation: AggregationResult,
    verdict: Verdict,
    certainty: CertaintyLevel,
    consensusStrength: number,
    evidenceQuality: number
  ): string {
    const reasons: string[] = [];

    // Add verdict explanation
    reasons.push(`Final verdict: ${verdict} (${certainty} certainty)`);

    // Add consensus information
    if (consensusStrength >= this.config.consensusThresholds.strong) {
      reasons.push('Strong consensus among agents');
    } else if (consensusStrength >= this.config.consensusThresholds.moderate) {
      reasons.push('Moderate consensus among agents');
    } else {
      reasons.push('Weak consensus - result should be interpreted cautiously');
    }

    // Add evidence information
    if (evidenceQuality >= this.config.evidenceThresholds.strong) {
      reasons.push('High-quality evidence supporting the decision');
    } else if (evidenceQuality >= this.config.evidenceThresholds.moderate) {
      reasons.push('Moderate evidence quality');
    } else {
      reasons.push('Limited evidence available');
    }

    // Add agent information
    const successfulAgents = aggregation.metadata.successfulAgents;
    const totalAgents = aggregation.metadata.totalAgents;
    reasons.push(`${successfulAgents}/${totalAgents} agents successfully analyzed the content`);

    return reasons.join('. ');
  }

  private generateRecommendations(
    verdict: Verdict,
    certainty: CertaintyLevel,
    riskAssessment: RiskAssessment,
    aggregation: AggregationResult
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations based on verdict
    switch (verdict) {
      case 'verified_false':
        recommendations.push('Content appears to be false or misleading');
        recommendations.push('Do not share this content');
        break;
      case 'verified_true':
        recommendations.push('Content appears to be accurate');
        break;
      case 'misleading':
        recommendations.push('Content contains misleading information');
        recommendations.push('Share with caution and context');
        break;
      case 'unverified':
        recommendations.push('Unable to verify content accuracy');
        recommendations.push('Seek additional sources before sharing');
        break;
      case 'insufficient_evidence':
        recommendations.push('Insufficient evidence for verification');
        recommendations.push('Manual fact-checking recommended');
        break;
    }

    // Add certainty-based recommendations
    if (certainty === 'very_low' || certainty === 'low') {
      recommendations.push('Result has low confidence - verify independently');
    }

    // Add risk-based recommendations
    if (riskAssessment.level === 'high' || riskAssessment.level === 'critical') {
      recommendations.push('High risk of error - manual review required');
    }

    // Add agent-specific recommendations
    if (aggregation.metadata.failedAgents > 0) {
      recommendations.push('Some analysis agents failed - retry recommended');
    }

    return recommendations;
  }

  private getDecisionMethod(aggregation: AggregationResult): string {
    const { consensusStrength, evidenceQuality } = aggregation.metadata;
    
    if (consensusStrength >= this.config.consensusThresholds.strong) {
      return 'strong_consensus';
    } else if (evidenceQuality >= this.config.evidenceThresholds.strong) {
      return 'evidence_based';
    } else if (aggregation.confidence >= this.config.confidenceThresholds.high) {
      return 'high_confidence';
    } else {
      return 'weighted_ensemble';
    }
  }

  /**
   * Update decision configuration
   */
  updateConfig(newConfig: Partial<DecisionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): DecisionConfig {
    return { ...this.config };
  }
}
