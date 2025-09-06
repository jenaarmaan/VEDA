/**
 * ResultAggregator - Combines multiple agent outputs with weighted confidence scores
 * Implements sophisticated aggregation algorithms for multi-agent consensus
 */

import { 
  AgentResponse, 
  Verdict, 
  Evidence,
  WorkflowExecution,
  AgentHealth,
  AggregationResult,
  AgentContribution
} from '../types';
import { agentRegistry } from '../agents';

export interface AggregationConfig {
  agentWeights: Record<string, number>;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  consensusThreshold: number;
  evidenceWeight: number;
  healthWeight: number;
}

export class ResultAggregator {
  private config: AggregationConfig;
  private agentHealthCache: Map<string, AgentHealth> = new Map();

  constructor(config?: Partial<AggregationConfig>) {
    this.config = {
      agentWeights: {
        'content-analysis': 1.0,
        'source-forensics': 1.2,
        'multilingual': 0.8,
        'social-graph': 0.9,
        'educational-content': 0.7
      },
      confidenceThresholds: {
        high: 0.8,
        medium: 0.6,
        low: 0.4
      },
      consensusThreshold: 0.6,
      evidenceWeight: 0.3,
      healthWeight: 0.2,
      ...config
    };
  }

  /**
   * Aggregate results from multiple agents into a unified decision
   */
  async aggregateResults(
    workflow: WorkflowExecution,
    agentHealth: Map<string, AgentHealth> = new Map()
  ): Promise<AggregationResult> {
    const startTime = Date.now();
    this.agentHealthCache = agentHealth;

    const agentResponses = Array.from(workflow.results.values());
    const failedAgents = Array.from(workflow.errors.keys());

    if (agentResponses.length === 0) {
      return this.createErrorResult('No successful agent responses');
    }

    // Calculate agent contributions
    const contributions = await this.calculateAgentContributions(agentResponses);
    
    // Determine consensus verdict
    const consensusVerdict = this.determineConsensusVerdict(contributions);
    
    // Calculate weighted confidence
    const weightedScore = this.calculateWeightedScore(contributions, consensusVerdict);
    const confidence = this.normalizeConfidence(weightedScore, contributions);
    
    // Aggregate evidence
    const evidence = this.aggregateEvidence(agentResponses);
    
    // Generate reasoning
    const reasoning = this.generateAggregationReasoning(contributions, consensusVerdict, confidence);
    
    const processingTime = Date.now() - startTime;

    return {
      agentResults: agentResponses,
      weightedConfidence: confidence,
      consensusScore: this.calculateConsensusStrength(agentResponses),
      agentContributions: contributions,
      evidence,
      processingTime,
      timestamp: Date.now(),
      confidence,
      consensusVerdict,
      weightedScore,
      reasoning,
      metadata: {
        totalAgents: agentResponses.length + failedAgents.length,
        successfulAgents: agentResponses.length,
        failedAgents: failedAgents.length,
        processingTime,
        averageConfidence: agentResponses.length > 0 ? agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length : 0,
        consensusStrength: this.calculateConsensusStrength(agentResponses),
        evidenceQuality: this.calculateEvidenceQuality(evidence)
      }
    };
  }

  private async calculateAgentContributions(
    responses: AgentResponse[]
  ): Promise<AgentContribution[]> {
    const contributions: AgentContribution[] = [];

    for (const response of responses) {
      const agent = agentRegistry.getAgent(response.agentId);
      if (!agent) continue;

      const health = this.agentHealthCache.get(response.agentId);
      const healthScore = health ? this.calculateHealthScore(health) : 0.5;
      
      const weight = this.getAgentWeight(response.agentId);
      const adjustedWeight = weight * (0.8 + 0.2 * healthScore); // Health affects weight
      
      const weightedScore = this.calculateVerdictScore(response.verdict) * 
                           response.confidence * adjustedWeight;

      contributions.push({
        agentId: response.agentId,
        agentName: response.agentName,
        verdict: response.verdict,
        confidence: response.confidence,
        weight: adjustedWeight,
        weightedScore,
        reasoning: response.reasoning,
        healthScore,
        evidence: response.evidence,
        processingTime: response.processingTime
      });
    }

    return contributions.sort((a, b) => b.weightedScore - a.weightedScore);
  }

  private calculateVerdictScore(verdict: Verdict): number {
    const scores: Record<Verdict, number> = {
      'verified_true': 1.0,
      'verified_false': -1.0,
      'misleading': -0.7,
      'unverified': 0.0,
      'insufficient_evidence': 0.0,
      'error': 0.0
    };
    return scores[verdict] || 0.0;
  }

  private determineConsensusVerdict(contributions: AgentContribution[]): Verdict {
    // Group contributions by verdict
    const verdictGroups = new Map<Verdict, AgentContribution[]>();
    
    for (const contribution of contributions) {
      const existing = verdictGroups.get(contribution.verdict) || [];
      existing.push(contribution);
      verdictGroups.set(contribution.verdict, existing);
    }

    // Calculate weighted scores for each verdict
    const verdictScores = new Map<Verdict, number>();
    
    for (const [verdict, group] of verdictGroups) {
      const score = group.reduce((sum, c) => sum + c.weightedScore, 0);
      verdictScores.set(verdict, score);
    }

    // Find the verdict with highest score
    let bestVerdict: Verdict = 'unverified';
    let bestScore = -Infinity;

    for (const [verdict, score] of verdictScores) {
      if (score > bestScore) {
        bestScore = score;
        bestVerdict = verdict;
      }
    }

    // Check if we have sufficient consensus
    const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
    const consensusRatio = Math.abs(bestScore) / totalWeight;

    if (consensusRatio < this.config.consensusThreshold) {
      return 'insufficient_evidence';
    }

    return bestVerdict;
  }

  private calculateWeightedScore(
    contributions: AgentContribution[],
    consensusVerdict: Verdict
  ): number {
    const consensusScore = this.calculateVerdictScore(consensusVerdict);
    const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
    
    if (totalWeight === 0) return 0;

    // Calculate weighted average confidence for the consensus verdict
    const relevantContributions = contributions.filter(c => c.verdict === consensusVerdict);
    const weightedConfidence = relevantContributions.reduce(
      (sum, c) => sum + (c.confidence * c.weight), 0
    ) / totalWeight;

    return consensusScore * weightedConfidence;
  }

  private normalizeConfidence(
    weightedScore: number,
    contributions: AgentContribution[]
  ): number {
    // Normalize to 0-1 range
    const maxPossibleScore = contributions.reduce((sum, c) => sum + c.weight, 0);
    const normalizedScore = Math.abs(weightedScore) / maxPossibleScore;
    
    // Apply confidence thresholds
    if (normalizedScore >= this.config.confidenceThresholds.high) {
      return Math.min(normalizedScore, 1.0);
    } else if (normalizedScore >= this.config.confidenceThresholds.medium) {
      return normalizedScore * 0.8;
    } else if (normalizedScore >= this.config.confidenceThresholds.low) {
      return normalizedScore * 0.6;
    } else {
      return normalizedScore * 0.4;
    }
  }

  private aggregateEvidence(responses: AgentResponse[]): Evidence[] {
    const evidenceMap = new Map<string, Evidence>();
    
    for (const response of responses) {
      for (const evidence of response.evidence) {
        const key = `${evidence.type}-${evidence.title}`;
        
        if (evidenceMap.has(key)) {
          // Merge similar evidence, increase reliability
          const existing = evidenceMap.get(key)!;
          existing.reliability = Math.min(1.0, existing.reliability + 0.1);
        } else {
          evidenceMap.set(key, { ...evidence });
        }
      }
    }

    return Array.from(evidenceMap.values())
      .sort((a, b) => b.reliability - a.reliability);
  }

  private generateAggregationReasoning(
    contributions: AgentContribution[],
    consensusVerdict: Verdict,
    confidence: number
  ): string {
    const reasons: string[] = [];

    // Add consensus information
    const consensusCount = contributions.filter(c => c.verdict === consensusVerdict).length;
    reasons.push(`${consensusCount}/${contributions.length} agents reached consensus: ${consensusVerdict}`);

    // Add confidence level
    if (confidence >= this.config.confidenceThresholds.high) {
      reasons.push('High confidence in the result');
    } else if (confidence >= this.config.confidenceThresholds.medium) {
      reasons.push('Medium confidence in the result');
    } else {
      reasons.push('Low confidence - additional verification recommended');
    }

    // Add top contributing agents
    const topContributors = contributions.slice(0, 2);
    if (topContributors.length > 0) {
      const contributorNames = topContributors.map(c => c.agentName).join(', ');
      reasons.push(`Primary analysis by: ${contributorNames}`);
    }

    // Add health information
    const unhealthyAgents = contributions.filter(c => c.healthScore < 0.5);
    if (unhealthyAgents.length > 0) {
      reasons.push(`Note: ${unhealthyAgents.length} agents had degraded performance`);
    }

    return reasons.join('. ');
  }

  private getAgentWeight(agentId: string): number {
    return this.config.agentWeights[agentId] || 1.0;
  }

  private calculateHealthScore(health: AgentHealth): number {
    const responseTimeScore = Math.max(0, 1 - (health.responseTime / 10000)); // 10s max
    const successRateScore = health.successRate;
    const errorPenalty = Math.max(0, 1 - (health.errorCount / 10)); // 10 errors max
    
    return (responseTimeScore + successRateScore + errorPenalty) / 3;
  }

  private createErrorResult(message: string): AggregationResult {
    return {
      agentResults: [],
      weightedConfidence: 0,
      consensusScore: 0,
      agentContributions: [],
      evidence: [],
      processingTime: 0,
      timestamp: Date.now(),
      confidence: 0,
      consensusVerdict: 'error',
      weightedScore: 0,
      reasoning: message,
      metadata: {
        totalAgents: 0,
        successfulAgents: 0,
        failedAgents: 0,
        processingTime: 0,
        averageConfidence: 0,
        consensusStrength: 0,
        evidenceQuality: 0
      }
    };
  }

  /**
   * Update agent weights based on performance
   */
  updateAgentWeights(performanceData: Record<string, { successRate: number; avgConfidence: number }>): void {
    for (const [agentId, data] of Object.entries(performanceData)) {
      const currentWeight = this.config.agentWeights[agentId] || 1.0;
      const performanceScore = (data.successRate + data.avgConfidence) / 2;
      
      // Adjust weight based on performance (0.5 to 1.5 range)
      const newWeight = Math.max(0.5, Math.min(1.5, currentWeight * (0.8 + 0.4 * performanceScore)));
      this.config.agentWeights[agentId] = newWeight;
    }
  }

  /**
   * Get current aggregation configuration
   */
  getConfig(): AggregationConfig {
    return { ...this.config };
  }

  /**
   * Update aggregation configuration
   */
  updateConfig(newConfig: Partial<AggregationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Calculate consensus strength from agent responses
   */
  private calculateConsensusStrength(responses: AgentResponse[]): number {
    if (responses.length === 0) return 0;
    
    const verdictCounts = new Map<string, number>();
    responses.forEach(response => {
      const count = verdictCounts.get(response.verdict) || 0;
      verdictCounts.set(response.verdict, count + 1);
    });
    
    const maxCount = Math.max(...verdictCounts.values());
    return maxCount / responses.length;
  }

  /**
   * Calculate evidence quality score
   */
  private calculateEvidenceQuality(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    const totalReliability = evidence.reduce((sum, e) => sum + e.reliability, 0);
    return totalReliability / evidence.length;
  }
}
