/**
 * Unit tests for NetworkAnalyzer
 */

import { NetworkAnalyzer } from '../components/NetworkAnalyzer';
import { GraphBuilder } from '../components/GraphBuilder';
import { NetworkAnalyzerConfig } from '../types/api';
import { mockDataCollection } from './mocks/socialData';

describe('NetworkAnalyzer', () => {
  let networkAnalyzer: NetworkAnalyzer;
  let graphBuilder: GraphBuilder;
  let config: NetworkAnalyzerConfig;

  beforeEach(() => {
    config = {
      algorithmConfig: {
        pageRankDamping: 0.85,
        pageRankIterations: 10, // Reduced for faster tests
        communityDetectionResolution: 1.0,
        centralityThreshold: 0.1
      },
      enableParallelProcessing: false,
      maxConcurrentAlgorithms: 4
    };

    const graphBuilderConfig = {
      includeUserNodes: true,
      includePostNodes: true,
      edgeWeightCalculation: 'weighted' as const,
      timeDecayFactor: 0.1,
      minEdgeWeight: 0.1,
      maxGraphSize: 1000
    };

    graphBuilder = new GraphBuilder(graphBuilderConfig);
    networkAnalyzer = new NetworkAnalyzer(config, graphBuilder);
  });

  describe('analyzeNetworkMetrics', () => {
    it('should calculate network metrics for all nodes', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      expect(metrics.size).toBe(graph.metadata.totalNodes);

      for (const [nodeId, nodeMetrics] of metrics) {
        expect(nodeMetrics.nodeId).toBe(nodeId);
        expect(nodeMetrics.degree).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.inDegree).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.outDegree).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.betweennessCentrality).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.closenessCentrality).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.eigenvectorCentrality).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.pageRank).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.clusteringCoefficient).toBeGreaterThanOrEqual(0);
        expect(nodeMetrics.clusteringCoefficient).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate degree metrics correctly', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      for (const [_, nodeMetrics] of metrics) {
        expect(nodeMetrics.degree).toBe(nodeMetrics.inDegree + nodeMetrics.outDegree);
      }
    });

    it('should calculate PageRank values that sum to 1', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      const pageRankSum = Array.from(metrics.values())
        .reduce((sum, m) => sum + m.pageRank, 0);

      expect(pageRankSum).toBeCloseTo(1.0, 2);
    });
  });

  describe('detectCommunities', () => {
    it('should detect communities in the graph', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const communities = networkAnalyzer.detectCommunities(graph);

      expect(Array.isArray(communities)).toBe(true);

      for (const community of communities) {
        expect(community.id).toBeDefined();
        expect(community.nodes.length).toBeGreaterThan(1);
        expect(community.size).toBe(community.nodes.length);
        expect(community.modularity).toBeGreaterThanOrEqual(0);
        expect(community.density).toBeGreaterThanOrEqual(0);
        expect(community.density).toBeLessThanOrEqual(1);
        expect(community.averageClustering).toBeGreaterThanOrEqual(0);
        expect(community.averageClustering).toBeLessThanOrEqual(1);
        expect(community.suspiciousScore).toBeGreaterThanOrEqual(0);
        expect(community.suspiciousScore).toBeLessThanOrEqual(1);
      }
    });

    it('should return communities sorted by suspicious score', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const communities = networkAnalyzer.detectCommunities(graph);

      for (let i = 1; i < communities.length; i++) {
        expect(communities[i].suspiciousScore).toBeLessThanOrEqual(communities[i - 1].suspiciousScore);
      }
    });
  });

  describe('centrality calculations', () => {
    it('should calculate betweenness centrality', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      const betweennessValues = Array.from(metrics.values())
        .map(m => m.betweennessCentrality);

      expect(betweennessValues.every(val => val >= 0)).toBe(true);
    });

    it('should calculate closeness centrality', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      const closenessValues = Array.from(metrics.values())
        .map(m => m.closenessCentrality);

      expect(closenessValues.every(val => val >= 0)).toBe(true);
    });

    it('should calculate eigenvector centrality', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      const eigenvectorValues = Array.from(metrics.values())
        .map(m => m.eigenvectorCentrality);

      expect(eigenvectorValues.every(val => val >= 0)).toBe(true);
    });
  });

  describe('clustering coefficient', () => {
    it('should calculate clustering coefficient between 0 and 1', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const metrics = networkAnalyzer.analyzeNetworkMetrics(graph);

      const clusteringValues = Array.from(metrics.values())
        .map(m => m.clusteringCoefficient);

      expect(clusteringValues.every(val => val >= 0 && val <= 1)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty graph', () => {
      const emptyGraph = {
        nodes: new Map(),
        edges: new Map(),
        metadata: {
          totalNodes: 0,
          totalEdges: 0,
          timeRange: {
            start: new Date(),
            end: new Date()
          },
          platforms: []
        }
      };

      const metrics = networkAnalyzer.analyzeNetworkMetrics(emptyGraph);
      expect(metrics.size).toBe(0);

      const communities = networkAnalyzer.detectCommunities(emptyGraph);
      expect(communities.length).toBe(0);
    });

    it('should handle single node graph', () => {
      const singleNodeGraph = {
        nodes: new Map([['node1', {
          id: 'node1',
          type: 'user' as const,
          data: { id: 'user1' },
          timestamp: new Date()
        }]]),
        edges: new Map(),
        metadata: {
          totalNodes: 1,
          totalEdges: 0,
          timeRange: {
            start: new Date(),
            end: new Date()
          },
          platforms: ['twitter']
        }
      };

      const metrics = networkAnalyzer.analyzeNetworkMetrics(singleNodeGraph);
      expect(metrics.size).toBe(1);

      const nodeMetrics = metrics.get('node1');
      expect(nodeMetrics?.degree).toBe(0);
      expect(nodeMetrics?.clusteringCoefficient).toBe(0);
    });
  });
});