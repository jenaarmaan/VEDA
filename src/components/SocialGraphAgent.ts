/**
 * SocialGraphAgent - Main orchestrator for social graph analysis
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SocialDataCollection,
  PropagationGraph,
  SocialGraphAnalysis,
  AnalysisSummary,
  SocialPlatform,
  AnalysisOptions
} from '../types';
import {
  SocialGraphAgentConfig,
  SocialGraphAgentResponse,
  SerializedGraph,
  Community
} from '../types/api';
import { SocialDataFetcher } from './SocialDataFetcher';
import { GraphBuilder } from './GraphBuilder';
import { NetworkAnalyzer } from './NetworkAnalyzer';
import { BehaviorDetector } from './BehaviorDetector';

export class SocialGraphAgent {
  private config: SocialGraphAgentConfig;
  private dataFetcher: SocialDataFetcher;
  private graphBuilder: GraphBuilder;
  private networkAnalyzer: NetworkAnalyzer;
  private behaviorDetector: BehaviorDetector;

  constructor(config: SocialGraphAgentConfig) {
    this.config = config;
    
    // Initialize components
    this.dataFetcher = new SocialDataFetcher(config.dataFetcher);
    this.graphBuilder = new GraphBuilder(config.graphBuilder);
    this.networkAnalyzer = new NetworkAnalyzer(config.networkAnalyzer, this.graphBuilder);
    this.behaviorDetector = new BehaviorDetector(config.behaviorDetector, this.networkAnalyzer);
  }

  /**
   * Main analysis method - orchestrates the entire pipeline
   */
  async analyzeSocialGraph(
    query: string,
    platforms: SocialPlatform[],
    options?: Partial<AnalysisOptions>
  ): Promise<SocialGraphAgentResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      if (this.config.enableLogging) {
        console.log(`[${requestId}] Starting social graph analysis for query: "${query}"`);
      }

      // Step 1: Fetch social data
      const collections = await this.fetchSocialData(query, platforms, options);
      
      if (collections.length === 0) {
        throw new Error('No data collected from any platform');
      }

      // Step 2: Build propagation graph
      const graph = this.buildPropagationGraph(collections);
      
      if (graph.metadata.totalNodes === 0) {
        throw new Error('No nodes found in the propagation graph');
      }

      // Step 3: Perform network analysis
      const analysis = await this.performNetworkAnalysis(graph, options);

      // Step 4: Calculate virality scores
      const viralityScore = this.calculateOverallViralityScore(analysis);

      // Step 5: Identify flagged accounts
      const flaggedAccounts = this.identifyFlaggedAccounts(analysis);

      // Step 6: Serialize graph for response
      const serializedGraph = this.serializeGraph(graph);

      // Step 7: Convert communities to response format
      const communities = this.convertCommunitiesToResponse(analysis.communities);

      const processingTime = Date.now() - startTime;

      const response: SocialGraphAgentResponse = {
        propagationGraph: serializedGraph,
        viralityScore,
        communities,
        flaggedAccounts,
        analysis,
        metadata: {
          processingTime,
          nodesProcessed: graph.metadata.totalNodes,
          edgesProcessed: graph.metadata.totalEdges,
          algorithmsUsed: this.getAlgorithmsUsed(options)
        }
      };

      if (this.config.enableLogging) {
        console.log(`[${requestId}] Analysis completed in ${processingTime}ms`);
        console.log(`[${requestId}] Found ${flaggedAccounts.length} flagged accounts`);
        console.log(`[${requestId}] Identified ${communities.length} communities`);
      }

      return response;

    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[${requestId}] Analysis failed:`, error);
      }
      throw error;
    }
  }

  /**
   * Fetch social data from specified platforms
   */
  private async fetchSocialData(
    query: string,
    platforms: SocialPlatform[],
    options?: Partial<AnalysisOptions>
  ): Promise<SocialDataCollection[]> {
    const timeWindow = options?.timeWindow || this.config.dataFetcher.defaultTimeWindow;
    
    return await this.dataFetcher.fetchSocialData(query, platforms, timeWindow);
  }

  /**
   * Build propagation graph from social data collections
   */
  private buildPropagationGraph(collections: SocialDataCollection[]): PropagationGraph {
    return this.graphBuilder.buildPropagationGraph(collections);
  }

  /**
   * Perform comprehensive network analysis
   */
  private async performNetworkAnalysis(
    graph: PropagationGraph,
    options?: Partial<AnalysisOptions>
  ): Promise<SocialGraphAnalysis> {
    const analysisOptions = this.mergeAnalysisOptions(options);
    
    // Calculate network metrics
    const networkMetrics = this.networkAnalyzer.analyzeNetworkMetrics(graph);
    
    // Detect communities
    const communities = analysisOptions.includeCommunityDetection 
      ? this.networkAnalyzer.detectCommunities(graph)
      : [];

    // Calculate virality metrics
    const viralityMetrics = analysisOptions.includeViralityAnalysis
      ? this.behaviorDetector.calculateViralityMetrics(graph)
      : new Map();

    // Detect bot behavior
    const botDetection = analysisOptions.includeBotDetection
      ? this.behaviorDetector.detectBotBehavior(graph)
      : new Map();

    // Detect coordination
    const coordinationAnalysis = analysisOptions.includeCoordinationAnalysis
      ? this.behaviorDetector.detectCoordination(graph)
      : [];

    // Identify misinformation pathways
    const misinformationPathways = analysisOptions.includeMisinformationPathways
      ? this.behaviorDetector.identifyMisinformationPathways(graph)
      : [];

    // Generate analysis summary
    const summary = this.generateAnalysisSummary(
      graph,
      networkMetrics,
      communities,
      viralityMetrics,
      botDetection,
      coordinationAnalysis,
      misinformationPathways
    );

    return {
      graph,
      networkMetrics,
      communities,
      viralityMetrics,
      botDetection,
      coordinationAnalysis,
      misinformationPathways,
      flaggedAccounts: [],
      summary,
      timestamp: new Date()
    };
  }

  /**
   * Calculate overall virality score for the analysis
   */
  private calculateOverallViralityScore(analysis: SocialGraphAnalysis): number {
    if (analysis.viralityMetrics.size === 0) return 0;

    const viralityScores = Array.from(analysis.viralityMetrics.values())
      .map(metrics => metrics.viralityScore);

    // Calculate weighted average (weighted by reach)
    let totalWeight = 0;
    let weightedSum = 0;

    for (const metrics of analysis.viralityMetrics.values()) {
      const weight = metrics.reach;
      weightedSum += metrics.viralityScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Identify accounts that should be flagged
   */
  private identifyFlaggedAccounts(analysis: SocialGraphAnalysis): string[] {
    const flaggedAccounts: string[] = [];

    // Flag accounts with high bot scores
    for (const [userId, botMetrics] of analysis.botDetection) {
      if (botMetrics.botScore > this.config.behaviorDetector.botDetectionThreshold) {
        flaggedAccounts.push(userId);
      }
    }

    // Flag accounts in suspicious communities
    for (const community of analysis.communities) {
      if (community.suspiciousScore > 0.7) {
        const userNodes = community.nodes.filter(nodeId => nodeId.startsWith('user_'));
        flaggedAccounts.push(...userNodes.map(nodeId => nodeId.replace('user_', '')));
      }
    }

    // Flag accounts involved in coordination
    for (const coordination of analysis.coordinationAnalysis) {
      if (coordination.coordinationScore > this.config.behaviorDetector.coordinationThreshold) {
        flaggedAccounts.push(...coordination.participants);
      }
    }

    // Remove duplicates
    return Array.from(new Set(flaggedAccounts));
  }

  /**
   * Serialize graph for JSON response
   */
  private serializeGraph(graph: PropagationGraph): SerializedGraph {
    const nodes = Array.from(graph.nodes.values()).map(node => ({
      id: node.id,
      type: node.type,
      data: node.data,
      timestamp: node.timestamp.toISOString()
    }));

    const edges = Array.from(graph.edges.values()).map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      weight: edge.weight,
      timestamp: edge.timestamp.toISOString(),
      metadata: edge.metadata
    }));

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: graph.metadata.totalNodes,
        totalEdges: graph.metadata.totalEdges,
        timeRange: {
          start: graph.metadata.timeRange.start.toISOString(),
          end: graph.metadata.timeRange.end.toISOString()
        },
        platforms: graph.metadata.platforms
      }
    };
  }

  /**
   * Convert communities to response format
   */
  private convertCommunitiesToResponse(communities: any[]): Community[] {
    return communities.map(community => ({
      id: community.id,
      nodes: community.nodes,
      size: community.size,
      modularity: community.modularity,
      density: community.density,
      averageClustering: community.averageClustering,
      dominantPlatform: community.dominantPlatform,
      suspiciousScore: community.suspiciousScore
    }));
  }

  /**
   * Merge analysis options with defaults
   */
  private mergeAnalysisOptions(options?: Partial<AnalysisOptions>): AnalysisOptions {
    const defaults: AnalysisOptions = {
      includeBotDetection: this.config.analysisOptions.includeBotDetection,
      includeCommunityDetection: this.config.analysisOptions.includeCommunityDetection,
      includeViralityAnalysis: this.config.analysisOptions.includeViralityAnalysis,
      includeCoordinationAnalysis: this.config.analysisOptions.includeCoordinationAnalysis,
      includeMisinformationPathways: this.config.analysisOptions.includeMisinformationPathways,
      algorithmConfig: {
        pageRankDamping: this.config.networkAnalyzer.algorithmConfig.pageRankDamping,
        pageRankIterations: this.config.networkAnalyzer.algorithmConfig.pageRankIterations,
        communityDetectionResolution: this.config.networkAnalyzer.algorithmConfig.communityDetectionResolution,
        centralityThreshold: this.config.networkAnalyzer.algorithmConfig.centralityThreshold,
        botDetectionThreshold: this.config.behaviorDetector.botDetectionThreshold,
        coordinationThreshold: this.config.behaviorDetector.coordinationThreshold,
        viralityThreshold: 0.5
      },
      timeWindow: this.config.dataFetcher.defaultTimeWindow,
      minEngagement: 1,
      maxNodes: this.config.graphBuilder.maxGraphSize
    };

    return { ...defaults, ...options };
  }

  /**
   * Generate analysis summary
   */
  private generateAnalysisSummary(
    graph: PropagationGraph,
    networkMetrics: Map<string, any>,
    communities: any[],
    viralityMetrics: Map<string, any>,
    botDetection: Map<string, any>,
    coordinationAnalysis: any[],
    misinformationPathways: any[]
  ): AnalysisSummary {
    const totalUsers = Array.from(graph.nodes.values())
      .filter(node => node.type === 'user').length;
    
    const totalPosts = Array.from(graph.nodes.values())
      .filter(node => node.type === 'post').length;

    const suspiciousUsers = Array.from(botDetection.values())
      .filter(metrics => metrics.botScore > this.config.behaviorDetector.botDetectionThreshold).length;

    const viralPosts = Array.from(viralityMetrics.values())
      .filter(metrics => metrics.viralityScore > 0.7).length;

    const coordinatedGroups = coordinationAnalysis.length;

    const misinformationCount = misinformationPathways.length;

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (suspiciousUsers > totalUsers * 0.3 || coordinatedGroups > 5 || misinformationCount > 3) {
      riskLevel = 'critical';
    } else if (suspiciousUsers > totalUsers * 0.2 || coordinatedGroups > 3 || misinformationCount > 1) {
      riskLevel = 'high';
    } else if (suspiciousUsers > totalUsers * 0.1 || coordinatedGroups > 1) {
      riskLevel = 'medium';
    }

    // Generate key findings
    const keyFindings: string[] = [];
    if (suspiciousUsers > 0) {
      keyFindings.push(`${suspiciousUsers} accounts flagged for bot-like behavior`);
    }
    if (coordinatedGroups > 0) {
      keyFindings.push(`${coordinatedGroups} coordinated groups detected`);
    }
    if (misinformationCount > 0) {
      keyFindings.push(`${misinformationCount} potential misinformation pathways identified`);
    }
    if (viralPosts > 0) {
      keyFindings.push(`${viralPosts} posts showing high virality`);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Immediate investigation recommended for flagged accounts');
      recommendations.push('Monitor coordinated groups for further activity');
    }
    if (misinformationCount > 0) {
      recommendations.push('Review misinformation pathways and consider intervention');
    }
    if (viralPosts > 0) {
      recommendations.push('Monitor viral content for potential amplification');
    }

    return {
      totalUsers,
      totalPosts,
      suspiciousUsers,
      viralPosts,
      coordinatedGroups,
      misinformationPathways: misinformationCount,
      riskLevel,
      keyFindings,
      recommendations
    };
  }

  /**
   * Get list of algorithms used in analysis
   */
  private getAlgorithmsUsed(options?: Partial<AnalysisOptions>): string[] {
    const algorithms: string[] = [];
    const analysisOptions = this.mergeAnalysisOptions(options);

    algorithms.push('PageRank');
    algorithms.push('Betweenness Centrality');
    algorithms.push('Closeness Centrality');
    algorithms.push('Eigenvector Centrality');
    algorithms.push('Clustering Coefficient');

    if (analysisOptions.includeCommunityDetection) {
      algorithms.push('Louvain Community Detection');
    }

    if (analysisOptions.includeBotDetection) {
      algorithms.push('Bot Detection Heuristics');
    }

    if (analysisOptions.includeCoordinationAnalysis) {
      algorithms.push('Coordination Analysis');
    }

    if (analysisOptions.includeViralityAnalysis) {
      algorithms.push('Virality Metrics');
    }

    if (analysisOptions.includeMisinformationPathways) {
      algorithms.push('Misinformation Pathway Detection');
    }

    return algorithms;
  }

  /**
   * Get configuration
   */
  getConfig(): SocialGraphAgentConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SocialGraphAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize components if needed
    if (newConfig.dataFetcher) {
      this.dataFetcher = new SocialDataFetcher(this.config.dataFetcher);
    }
    if (newConfig.graphBuilder) {
      this.graphBuilder = new GraphBuilder(this.config.graphBuilder);
    }
    if (newConfig.networkAnalyzer) {
      this.networkAnalyzer = new NetworkAnalyzer(this.config.networkAnalyzer, this.graphBuilder);
    }
    if (newConfig.behaviorDetector) {
      this.behaviorDetector = new BehaviorDetector(this.config.behaviorDetector, this.networkAnalyzer);
    }
  }

  /**
   * Get component statistics
   */
  getStatistics(): {
    dataFetcher: any;
    graphBuilder: any;
    networkAnalyzer: any;
    behaviorDetector: any;
  } {
    return {
      dataFetcher: this.dataFetcher.getCacheStats(),
      graphBuilder: this.graphBuilder.getGraphStatistics({} as any), // Would need actual graph
      networkAnalyzer: {},
      behaviorDetector: {}
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.dataFetcher.clearCache();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, string>;
    timestamp: Date;
  }> {
    const components: Record<string, string> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check data fetcher
    try {
      const cacheStats = this.dataFetcher.getCacheStats();
      components.dataFetcher = 'healthy';
    } catch (error) {
      components.dataFetcher = 'unhealthy';
      overallStatus = 'degraded';
    }

    // Check other components (simplified)
    components.graphBuilder = 'healthy';
    components.networkAnalyzer = 'healthy';
    components.behaviorDetector = 'healthy';

    return {
      status: overallStatus,
      components,
      timestamp: new Date()
    };
  }
}