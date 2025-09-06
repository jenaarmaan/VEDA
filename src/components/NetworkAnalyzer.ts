/**
 * NetworkAnalyzer - Applies graph algorithms for network analysis
 */

import { Graph, alg } from 'graphlib';
import {
  PropagationGraph,
  NetworkMetrics,
  Community,
  ViralityMetrics,
  SocialUser,
  SocialPost,
  EdgeType
} from '../types';
import { NetworkAnalyzerConfig } from '../types/api';
import { GraphBuilder } from './GraphBuilder';

export class NetworkAnalyzer {
  private config: NetworkAnalyzerConfig;
  private graphBuilder: GraphBuilder;

  constructor(config: NetworkAnalyzerConfig, graphBuilder: GraphBuilder) {
    this.config = config;
    this.graphBuilder = graphBuilder;
  }

  /**
   * Analyze network metrics for all nodes in the graph
   */
  analyzeNetworkMetrics(graph: PropagationGraph): Map<string, NetworkMetrics> {
    const g = this.graphBuilder.toGraphLib(graph);
    const metrics = new Map<string, NetworkMetrics>();

    // Calculate basic degree metrics
    const degreeMetrics = this.calculateDegreeMetrics(g);
    
    // Calculate centrality metrics
    const centralityMetrics = this.calculateCentralityMetrics(g);
    
    // Calculate PageRank
    const pageRankMetrics = this.calculatePageRank(g);
    
    // Calculate clustering coefficient
    const clusteringMetrics = this.calculateClusteringCoefficient(g);

    // Combine all metrics
    for (const nodeId of g.nodes()) {
      const metrics_data: NetworkMetrics = {
        nodeId,
        degree: degreeMetrics.get(nodeId)?.degree || 0,
        inDegree: degreeMetrics.get(nodeId)?.inDegree || 0,
        outDegree: degreeMetrics.get(nodeId)?.outDegree || 0,
        betweennessCentrality: centralityMetrics.get(nodeId)?.betweenness || 0,
        closenessCentrality: centralityMetrics.get(nodeId)?.closeness || 0,
        eigenvectorCentrality: centralityMetrics.get(nodeId)?.eigenvector || 0,
        pageRank: pageRankMetrics.get(nodeId) || 0,
        clusteringCoefficient: clusteringMetrics.get(nodeId) || 0
      };

      metrics.set(nodeId, metrics_data);
    }

    return metrics;
  }

  /**
   * Calculate degree metrics for all nodes
   */
  private calculateDegreeMetrics(g: Graph): Map<string, { degree: number; inDegree: number; outDegree: number }> {
    const metrics = new Map<string, { degree: number; inDegree: number; outDegree: number }>();

    for (const nodeId of g.nodes()) {
      const inDegree = g.inEdges(nodeId)?.length || 0;
      const outDegree = g.outEdges(nodeId)?.length || 0;
      const degree = inDegree + outDegree;

      metrics.set(nodeId, { degree, inDegree, outDegree });
    }

    return metrics;
  }

  /**
   * Calculate centrality metrics using various algorithms
   */
  private calculateCentralityMetrics(g: Graph): Map<string, { betweenness: number; closeness: number; eigenvector: number }> {
    const metrics = new Map<string, { betweenness: number; closeness: number; eigenvector: number }>();

    // Betweenness centrality
    const betweenness = this.calculateBetweennessCentrality(g);
    
    // Closeness centrality
    const closeness = this.calculateClosenessCentrality(g);
    
    // Eigenvector centrality (simplified implementation)
    const eigenvector = this.calculateEigenvectorCentrality(g);

    for (const nodeId of g.nodes()) {
      metrics.set(nodeId, {
        betweenness: betweenness.get(nodeId) || 0,
        closeness: closeness.get(nodeId) || 0,
        eigenvector: eigenvector.get(nodeId) || 0
      });
    }

    return metrics;
  }

  /**
   * Calculate betweenness centrality for all nodes
   */
  private calculateBetweennessCentrality(g: Graph): Map<string, number> {
    const betweenness = new Map<string, number>();
    const nodes = g.nodes();

    // Initialize betweenness scores
    for (const node of nodes) {
      betweenness.set(node, 0);
    }

    // Calculate shortest paths between all pairs of nodes
    for (const source of nodes) {
      const paths = alg.dijkstra(g, source);
      
      for (const target of nodes) {
        if (source !== target && paths[target]) {
          const path = this.reconstructPath(paths, source, target);
          
          // Count intermediate nodes in shortest paths
          for (const intermediate of path.slice(1, -1)) {
            betweenness.set(intermediate, (betweenness.get(intermediate) || 0) + 1);
          }
        }
      }
    }

    // Normalize by total number of possible paths
    const totalPairs = nodes.length * (nodes.length - 1);
    for (const [node, score] of betweenness) {
      betweenness.set(node, score / totalPairs);
    }

    return betweenness;
  }

  /**
   * Calculate closeness centrality for all nodes
   */
  private calculateClosenessCentrality(g: Graph): Map<string, number> {
    const closeness = new Map<string, number>();
    const nodes = g.nodes();

    for (const node of nodes) {
      const paths = alg.dijkstra(g, node);
      let totalDistance = 0;
      let reachableNodes = 0;

      for (const [target, path] of Object.entries(paths)) {
        if (target !== node && path.distance !== Infinity) {
          totalDistance += path.distance;
          reachableNodes++;
        }
      }

      if (reachableNodes > 0) {
        closeness.set(node, reachableNodes / totalDistance);
      } else {
        closeness.set(node, 0);
      }
    }

    return closeness;
  }

  /**
   * Calculate eigenvector centrality (simplified power iteration)
   */
  private calculateEigenvectorCentrality(g: Graph): Map<string, number> {
    const nodes = g.nodes();
    const n = nodes.length;
    const nodeIndex = new Map<string, number>();
    
    // Create node index mapping
    nodes.forEach((node, index) => {
      nodeIndex.set(node, index);
    });

    // Initialize eigenvector
    let eigenvector = new Array(n).fill(1 / Math.sqrt(n));
    const maxIterations = this.config.algorithmConfig.pageRankIterations;
    const tolerance = 1e-6;

    for (let iter = 0; iter < maxIterations; iter++) {
      const newEigenvector = new Array(n).fill(0);

      // Matrix-vector multiplication
      for (const node of nodes) {
        const nodeIdx = nodeIndex.get(node)!;
        const neighbors = g.neighbors(node) || [];

        for (const neighbor of neighbors) {
          const neighborIdx = nodeIndex.get(neighbor)!;
          newEigenvector[nodeIdx] += eigenvector[neighborIdx];
        }
      }

      // Normalize
      const norm = Math.sqrt(newEigenvector.reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        newEigenvector.forEach((val, idx) => {
          newEigenvector[idx] = val / norm;
        });
      }

      // Check convergence
      const diff = eigenvector.reduce((sum, val, idx) => sum + Math.abs(val - newEigenvector[idx]), 0);
      if (diff < tolerance) {
        break;
      }

      eigenvector = newEigenvector;
    }

    // Convert back to node mapping
    const result = new Map<string, number>();
    nodes.forEach((node, index) => {
      result.set(node, eigenvector[index]);
    });

    return result;
  }

  /**
   * Calculate PageRank for all nodes
   */
  private calculatePageRank(g: Graph): Map<string, number> {
    const nodes = g.nodes();
    const n = nodes.length;
    const damping = this.config.algorithmConfig.pageRankDamping;
    const maxIterations = this.config.algorithmConfig.pageRankIterations;

    // Initialize PageRank values
    const pageRank = new Map<string, number>();
    nodes.forEach(node => {
      pageRank.set(node, 1 / n);
    });

    // Power iteration
    for (let iter = 0; iter < maxIterations; iter++) {
      const newPageRank = new Map<string, number>();

      for (const node of nodes) {
        let rank = (1 - damping) / n;

        // Sum contributions from incoming links
        const inEdges = g.inEdges(node) || [];
        for (const edge of inEdges) {
          const source = edge.v;
          const outDegree = g.outEdges(source)?.length || 1;
          rank += damping * (pageRank.get(source) || 0) / outDegree;
        }

        newPageRank.set(node, rank);
      }

      pageRank.clear();
      newPageRank.forEach((value, key) => {
        pageRank.set(key, value);
      });
    }

    return pageRank;
  }

  /**
   * Calculate clustering coefficient for all nodes
   */
  private calculateClusteringCoefficient(g: Graph): Map<string, number> {
    const clustering = new Map<string, number>();

    for (const node of g.nodes()) {
      const neighbors = g.neighbors(node) || [];
      const k = neighbors.length;

      if (k < 2) {
        clustering.set(node, 0);
        continue;
      }

      // Count triangles
      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (g.hasEdge(neighbors[i], neighbors[j])) {
            triangles++;
          }
        }
      }

      // Clustering coefficient = 2 * triangles / (k * (k - 1))
      const maxPossibleTriangles = k * (k - 1) / 2;
      clustering.set(node, maxPossibleTriangles > 0 ? (2 * triangles) / (k * (k - 1)) : 0);
    }

    return clustering;
  }

  /**
   * Detect communities using Louvain algorithm (simplified implementation)
   */
  detectCommunities(graph: PropagationGraph): Community[] {
    const g = this.graphBuilder.toGraphLib(graph);
    const communities = new Map<string, string>();
    const communities_data: Community[] = [];

    // Initialize each node as its own community
    let communityId = 0;
    for (const node of g.nodes()) {
      communities.set(node, `community_${communityId++}`);
    }

    // Simplified community detection using modularity optimization
    let improved = true;
    let iterations = 0;
    const maxIterations = 10;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (const node of g.nodes()) {
        const currentCommunity = communities.get(node)!;
        let bestCommunity = currentCommunity;
        let bestModularity = this.calculateModularity(g, communities);

        // Try moving node to each neighboring community
        const neighbors = g.neighbors(node) || [];
        const neighborCommunities = new Set<string>();
        
        for (const neighbor of neighbors) {
          neighborCommunities.add(communities.get(neighbor)!);
        }

        for (const community of neighborCommunities) {
          if (community !== currentCommunity) {
            // Temporarily move node to this community
            communities.set(node, community);
            const modularity = this.calculateModularity(g, communities);
            
            if (modularity > bestModularity) {
              bestModularity = modularity;
              bestCommunity = community;
              improved = true;
            }
          }
        }

        // Move node to best community
        communities.set(node, bestCommunity);
      }
    }

    // Group nodes by community
    const communityGroups = new Map<string, string[]>();
    for (const [node, community] of communities) {
      if (!communityGroups.has(community)) {
        communityGroups.set(community, []);
      }
      communityGroups.get(community)!.push(node);
    }

    // Create community objects
    for (const [communityId, nodes] of communityGroups) {
      if (nodes.length > 1) { // Only include communities with multiple nodes
        const community: Community = {
          id: communityId,
          nodes,
          size: nodes.length,
          modularity: this.calculateModularity(g, communities),
          density: this.calculateCommunityDensity(g, nodes),
          averageClustering: this.calculateAverageClustering(g, nodes),
          suspiciousScore: this.calculateCommunitySuspiciousScore(g, nodes, graph)
        };

        communities_data.push(community);
      }
    }

    return communities_data.sort((a, b) => b.suspiciousScore - a.suspiciousScore);
  }

  /**
   * Calculate modularity of the current community assignment
   */
  private calculateModularity(g: Graph, communities: Map<string, string>): number {
    const m = g.edges().length;
    if (m === 0) return 0;

    let modularity = 0;
    const communityGroups = new Map<string, string[]>();

    // Group nodes by community
    for (const [node, community] of communities) {
      if (!communityGroups.has(community)) {
        communityGroups.set(community, []);
      }
      communityGroups.get(community)!.push(node);
    }

    // Calculate modularity for each community
    for (const [_, nodes] of communityGroups) {
      let internalEdges = 0;
      let totalDegree = 0;

      for (const node of nodes) {
        totalDegree += g.neighbors(node)?.length || 0;
        
        for (const neighbor of g.neighbors(node) || []) {
          if (nodes.includes(neighbor)) {
            internalEdges++;
          }
        }
      }

      const expectedEdges = (totalDegree * totalDegree) / (4 * m);
      modularity += (internalEdges / 2) - expectedEdges;
    }

    return modularity / m;
  }

  /**
   * Calculate density of a community
   */
  private calculateCommunityDensity(g: Graph, nodes: string[]): number {
    if (nodes.length < 2) return 0;

    let internalEdges = 0;
    for (const node of nodes) {
      for (const neighbor of g.neighbors(node) || []) {
        if (nodes.includes(neighbor)) {
          internalEdges++;
        }
      }
    }

    const maxPossibleEdges = nodes.length * (nodes.length - 1);
    return internalEdges / maxPossibleEdges;
  }

  /**
   * Calculate average clustering coefficient for a community
   */
  private calculateAverageClustering(g: Graph, nodes: string[]): number {
    if (nodes.length === 0) return 0;

    let totalClustering = 0;
    for (const node of nodes) {
      const neighbors = g.neighbors(node) || [];
      const k = neighbors.length;

      if (k < 2) continue;

      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (g.hasEdge(neighbors[i], neighbors[j])) {
            triangles++;
          }
        }
      }

      const maxPossibleTriangles = k * (k - 1) / 2;
      if (maxPossibleTriangles > 0) {
        totalClustering += (2 * triangles) / (k * (k - 1));
      }
    }

    return totalClustering / nodes.length;
  }

  /**
   * Calculate suspicious score for a community
   */
  private calculateCommunitySuspiciousScore(g: Graph, nodes: string[], graph: PropagationGraph): number {
    let suspiciousScore = 0;

    // Check for high connectivity (potential bot network)
    const density = this.calculateCommunityDensity(g, nodes);
    if (density > 0.8) {
      suspiciousScore += 0.3;
    }

    // Check for similar posting patterns
    const posts = nodes
      .filter(nodeId => nodeId.startsWith('post_'))
      .map(nodeId => graph.nodes.get(nodeId)?.data as SocialPost)
      .filter(post => post);

    if (posts.length > 1) {
      const contentSimilarity = this.calculateContentSimilarity(posts);
      if (contentSimilarity > 0.7) {
        suspiciousScore += 0.4;
      }
    }

    // Check for temporal clustering
    const users = nodes
      .filter(nodeId => nodeId.startsWith('user_'))
      .map(nodeId => graph.nodes.get(nodeId)?.data as SocialUser)
      .filter(user => user);

    if (users.length > 1) {
      const accountAges = users.map(user => 
        (Date.now() - user.accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const avgAccountAge = accountAges.reduce((sum, age) => sum + age, 0) / accountAges.length;
      
      if (avgAccountAge < 30) { // New accounts
        suspiciousScore += 0.3;
      }
    }

    return Math.min(suspiciousScore, 1.0);
  }

  /**
   * Calculate content similarity between posts
   */
  private calculateContentSimilarity(posts: SocialPost[]): number {
    if (posts.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const similarity = this.calculateTextSimilarity(posts[i].content, posts[j].content);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Reconstruct path from Dijkstra result
   */
  private reconstructPath(paths: any, source: string, target: string): string[] {
    const path: string[] = [];
    let current = target;

    while (current && current !== source) {
      path.unshift(current);
      current = paths[current]?.predecessor;
    }

    if (current === source) {
      path.unshift(source);
    }

    return path;
  }
}