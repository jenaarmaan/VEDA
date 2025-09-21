/**
 * ReportUnifier - Merges diverse agent reports into unified, user-friendly reports
 * Creates comprehensive, actionable reports from multi-agent analysis results
 */

import { 
  UnifiedReport,
  VerificationRequest,
  AggregationResult,
  DecisionResult,
  AgentResponse,
  Evidence,
  Verdict
} from '../types';

export interface ReportTemplate {
  id: string;
  name: string;
  sections: ReportSection[];
  styling: ReportStyling;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'evidence' | 'recommendations' | 'technical';
  content: string;
  priority: 'high' | 'medium' | 'low';
  collapsible: boolean;
}

export interface ReportStyling {
  theme: 'professional' | 'casual' | 'technical';
  colorScheme: 'default' | 'high-contrast' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  includeCharts: boolean;
  includeTimestamps: boolean;
}

export interface ReportConfig {
  templates: Map<string, ReportTemplate>;
  defaultTemplate: string;
  maxReportLength: number;
  includeTechnicalDetails: boolean;
  includeAgentDetails: boolean;
  includeTimestamps: boolean;
  language: string;
}

export class ReportUnifier {
  private config: ReportConfig;
  private templates: Map<string, ReportTemplate> = new Map();

  constructor(config?: Partial<ReportConfig>) {
    this.config = {
      templates: new Map(),
      defaultTemplate: 'standard',
      maxReportLength: 5000,
      includeTechnicalDetails: false,
      includeAgentDetails: true,
      includeTimestamps: true,
      language: 'en',
      ...config
    };

    this.initializeTemplates();
  }

  /**
   * Create a unified report from analysis results
   */
  createUnifiedReport(
    request: VerificationRequest,
    aggregation: AggregationResult,
    decision: DecisionResult
  ): UnifiedReport {
    const startTime = Date.now();

    // Generate report sections
    const summary = this.generateSummary(decision, aggregation);
    const detailedAnalysis = this.generateDetailedAnalysis(aggregation, decision);
    const evidence = this.consolidateEvidence(aggregation.evidence);
    const recommendations = this.generateRecommendations(decision, aggregation);

    // Create technical metadata
    const metadata = this.generateMetadata(request, aggregation, decision);

    const processingTime = Date.now() - startTime;

    return {
      requestId: request.id,
      finalVerdict: decision.finalVerdict,
      confidence: decision.confidence,
      summary,
      detailedAnalysis,
      agentResults: Array.from(aggregation.agentContributions.map(c => 
        this.createAgentResponseFromContribution(c)
      )),
      evidence,
      recommendations,
      processingTime,
      timestamp: Date.now(),
      metadata
    };
  }

  /**
   * Generate a formatted report using a specific template
   */
  generateFormattedReport(
    unifiedReport: UnifiedReport,
    templateId?: string
  ): string {
    const template = this.templates.get(templateId || this.config.defaultTemplate) ||
                    this.templates.get('standard')!;

    let report = '';

    for (const section of template.sections) {
      const content = this.generateSectionContent(section, unifiedReport);
      if (content) {
        report += this.formatSection(section, content, template.styling);
      }
    }

    return report;
  }

  private generateSummary(decision: DecisionResult, aggregation: AggregationResult): string {
    const { finalVerdict, confidence, certainty } = decision;
    const { metadata } = aggregation;

    let summary = `Content Analysis Result: ${this.formatVerdict(finalVerdict)}\n\n`;
    
    summary += `Confidence Level: ${this.formatConfidence(confidence)} (${certainty} certainty)\n\n`;
    
    summary += `Analysis Summary: ${metadata.successfulAgents}/${metadata.totalAgents} specialized agents analyzed this content. `;
    
    if (finalVerdict === 'verified_true') {
      summary += 'The content appears to be accurate and well-supported by evidence.';
    } else if (finalVerdict === 'verified_false') {
      summary += 'The content appears to be false or misleading based on available evidence.';
    } else if (finalVerdict === 'misleading') {
      summary += 'The content contains misleading information that requires careful interpretation.';
    } else if (finalVerdict === 'unverified') {
      summary += 'The content could not be verified with sufficient confidence.';
    } else {
      summary += 'Insufficient evidence was available to make a determination.';
    }

    return summary;
  }

  private generateDetailedAnalysis(aggregation: AggregationResult, decision: DecisionResult): string {
    let analysis = 'Detailed Analysis:\n\n';

    // Agent contributions
    analysis += 'Agent Analysis Results:\n';
    for (const contribution of aggregation.agentContributions) {
      analysis += `• ${contribution.agentName}: ${contribution.verdict} `;
      analysis += `(confidence: ${Math.round(contribution.confidence * 100)}%)\n`;
      if (this.config.includeAgentDetails) {
        analysis += `  Reasoning: ${contribution.reasoning}\n`;
      }
    }

    analysis += '\n';

    // Consensus analysis
    analysis += `Consensus Analysis:\n`;
    analysis += `• Consensus Verdict: ${aggregation.consensusVerdict}\n`;
    analysis += `• Consensus Strength: ${Math.round(aggregation.metadata.consensusStrength * 100)}%\n`;
    analysis += `• Evidence Quality: ${Math.round(aggregation.metadata.evidenceQuality * 100)}%\n\n`;

    // Decision reasoning
    analysis += `Final Decision Reasoning:\n${decision.reasoning}\n\n`;

    // Risk assessment
    if (decision.riskAssessment.level !== 'low') {
      analysis += `Risk Assessment: ${decision.riskAssessment.level.toUpperCase()}\n`;
      analysis += `Risk Factors: ${decision.riskAssessment.factors.join(', ')}\n`;
      if (decision.riskAssessment.mitigation.length > 0) {
        analysis += `Mitigation: ${decision.riskAssessment.mitigation.join(', ')}\n`;
      }
      analysis += '\n';
    }

    return analysis;
  }

  private consolidateEvidence(evidence: Evidence[]): Evidence[] {
    // Sort by reliability and remove duplicates
    const uniqueEvidence = new Map<string, Evidence>();
    
    for (const item of evidence) {
      const key = `${item.type}-${item.title}`;
      if (!uniqueEvidence.has(key) || uniqueEvidence.get(key)!.reliability < item.reliability) {
        uniqueEvidence.set(key, item);
      }
    }

    return Array.from(uniqueEvidence.values())
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, 10); // Limit to top 10 evidence items
  }

  private generateRecommendations(decision: DecisionResult, aggregation: AggregationResult): string[] {
    const recommendations = [...decision.recommendations];

    // Add evidence-based recommendations
    if (aggregation.evidence.length === 0) {
      recommendations.push('No supporting evidence found - verify from multiple sources');
    } else if (aggregation.evidence.length < 3) {
      recommendations.push('Limited evidence available - seek additional verification');
    }

    // Add confidence-based recommendations
    if (decision.confidence < 0.6) {
      recommendations.push('Low confidence result - independent verification recommended');
    }

    // Add agent-specific recommendations
    if (aggregation.metadata.failedAgents > 0) {
      recommendations.push('Some analysis agents failed - consider retrying the analysis');
    }

    return recommendations;
  }

  private generateMetadata(
    request: VerificationRequest,
    aggregation: AggregationResult,
    decision: DecisionResult
  ): Record<string, any> {
    return {
      contentType: request.contentType,
      language: request.metadata.language || 'unknown',
      platform: request.metadata.platform || 'unknown',
      source: request.metadata.source || 'unknown',
      processingTime: aggregation.metadata.processingTime + decision.metadata.processingTime,
      agentCount: aggregation.metadata.totalAgents,
      successfulAgents: aggregation.metadata.successfulAgents,
      failedAgents: aggregation.metadata.failedAgents,
      decisionMethod: decision.metadata.decisionMethod,
      consensusStrength: decision.metadata.consensusStrength,
      evidenceQuality: decision.metadata.evidenceQuality,
      riskLevel: decision.riskAssessment.level,
      timestamp: new Date().toISOString()
    };
  }

  private createAgentResponseFromContribution(contribution: any): AgentResponse {
    return {
      agentId: contribution.agentId,
      agentName: contribution.agentName,
      confidence: contribution.confidence,
      verdict: contribution.verdict,
      reasoning: contribution.reasoning,
      evidence: [], // Evidence is handled separately
      processingTime: 0, // Not available in contribution
      timestamp: Date.now(),
      metadata: {
        weight: contribution.weight,
        healthScore: contribution.healthScore
      }
    };
  }

  private generateSectionContent(section: ReportSection, report: UnifiedReport): string {
    switch (section.type) {
      case 'summary':
        return report.summary;
      case 'detailed':
        return report.detailedAnalysis;
      case 'evidence':
        return this.formatEvidenceSection(report.evidence);
      case 'recommendations':
        return this.formatRecommendationsSection(report.recommendations);
      case 'technical':
        return this.formatTechnicalSection(report);
      default:
        return '';
    }
  }

  private formatEvidenceSection(evidence: Evidence[]): string {
    if (evidence.length === 0) {
      return 'No supporting evidence found.';
    }

    let content = `Evidence Summary (${evidence.length} items):\n\n`;
    
    for (const item of evidence) {
      content += `• ${item.title}\n`;
      content += `  Type: ${item.type}\n`;
      content += `  Reliability: ${Math.round(item.reliability * 100)}%\n`;
      if (item.description) {
        content += `  Description: ${item.description}\n`;
      }
      if (item.url) {
        content += `  Source: ${item.url}\n`;
      }
      content += '\n';
    }

    return content;
  }

  private formatRecommendationsSection(recommendations: string[]): string {
    if (recommendations.length === 0) {
      return 'No specific recommendations available.';
    }

    let content = 'Recommendations:\n\n';
    recommendations.forEach((rec, index) => {
      content += `${index + 1}. ${rec}\n`;
    });

    return content;
  }

  private formatTechnicalSection(report: UnifiedReport): string {
    let content = 'Technical Details:\n\n';
    
    content += `Request ID: ${report.requestId}\n`;
    content += `Processing Time: ${report.processingTime}ms\n`;
    content += `Agent Count: ${report.metadata.agentCount}\n`;
    content += `Successful Agents: ${report.metadata.successfulAgents}\n`;
    content += `Decision Method: ${report.metadata.decisionMethod}\n`;
    content += `Consensus Strength: ${Math.round(report.metadata.consensusStrength * 100)}%\n`;
    content += `Evidence Quality: ${Math.round(report.metadata.evidenceQuality * 100)}%\n`;
    
    if (this.config.includeTimestamps) {
      content += `Generated: ${new Date(report.timestamp).toISOString()}\n`;
    }

    return content;
  }

  private formatSection(section: ReportSection, content: string, styling: ReportStyling): string {
    let formatted = '';

    // Add section header
    formatted += `\n${'='.repeat(50)}\n`;
    formatted += `${section.title.toUpperCase()}\n`;
    formatted += `${'='.repeat(50)}\n\n`;

    // Add content
    formatted += content;

    // Add section footer
    formatted += '\n' + '-'.repeat(50) + '\n';

    return formatted;
  }

  private formatVerdict(verdict: Verdict): string {
    const verdictMap: Record<Verdict, string> = {
      'verified_true': 'VERIFIED TRUE',
      'verified_false': 'VERIFIED FALSE',
      'misleading': 'MISLEADING',
      'unverified': 'UNVERIFIED',
      'insufficient_evidence': 'INSUFFICIENT EVIDENCE',
      'error': 'ANALYSIS ERROR'
    };
    return verdictMap[verdict] || 'UNKNOWN';
  }

  private formatConfidence(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 90) return 'Very High';
    if (percentage >= 75) return 'High';
    if (percentage >= 60) return 'Medium';
    if (percentage >= 40) return 'Low';
    return 'Very Low';
  }

  private initializeTemplates(): void {
    // Standard template
    this.templates.set('standard', {
      id: 'standard',
      name: 'Standard Report',
      sections: [
        { id: 'summary', title: 'Summary', type: 'summary', content: '', priority: 'high', collapsible: false },
        { id: 'detailed', title: 'Detailed Analysis', type: 'detailed', content: '', priority: 'high', collapsible: true },
        { id: 'evidence', title: 'Evidence', type: 'evidence', content: '', priority: 'medium', collapsible: true },
        { id: 'recommendations', title: 'Recommendations', type: 'recommendations', content: '', priority: 'high', collapsible: false }
      ],
      styling: {
        theme: 'professional',
        colorScheme: 'default',
        fontSize: 'medium',
        includeCharts: false,
        includeTimestamps: true
      }
    });

    // Technical template
    this.templates.set('technical', {
      id: 'technical',
      name: 'Technical Report',
      sections: [
        { id: 'summary', title: 'Executive Summary', type: 'summary', content: '', priority: 'high', collapsible: false },
        { id: 'technical', title: 'Technical Details', type: 'technical', content: '', priority: 'high', collapsible: false },
        { id: 'detailed', title: 'Detailed Analysis', type: 'detailed', content: '', priority: 'high', collapsible: true },
        { id: 'evidence', title: 'Evidence', type: 'evidence', content: '', priority: 'medium', collapsible: true },
        { id: 'recommendations', title: 'Recommendations', type: 'recommendations', content: '', priority: 'medium', collapsible: true }
      ],
      styling: {
        theme: 'technical',
        colorScheme: 'default',
        fontSize: 'small',
        includeCharts: true,
        includeTimestamps: true
      }
    });

    // Simple template
    this.templates.set('simple', {
      id: 'simple',
      name: 'Simple Report',
      sections: [
        { id: 'summary', title: 'Result', type: 'summary', content: '', priority: 'high', collapsible: false },
        { id: 'recommendations', title: 'What to do', type: 'recommendations', content: '', priority: 'high', collapsible: false }
      ],
      styling: {
        theme: 'casual',
        colorScheme: 'default',
        fontSize: 'large',
        includeCharts: false,
        includeTimestamps: false
      }
    });
  }

  /**
   * Add a custom report template
   */
  addTemplate(template: ReportTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get available templates
   */
  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Update report configuration
   */
  updateConfig(newConfig: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ReportConfig {
    return { ...this.config };
  }
}
