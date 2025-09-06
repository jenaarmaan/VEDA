/**
 * Unit tests for GraphBuilder
 */

import { GraphBuilder } from '../components/GraphBuilder';
import { GraphBuilderConfig } from '../types/api';
import { mockDataCollection } from './mocks/socialData';

describe('GraphBuilder', () => {
  let graphBuilder: GraphBuilder;
  let config: GraphBuilderConfig;

  beforeEach(() => {
    config = {
      includeUserNodes: true,
      includePostNodes: true,
      edgeWeightCalculation: 'weighted',
      timeDecayFactor: 0.1,
      minEdgeWeight: 0.1,
      maxGraphSize: 1000
    };
    graphBuilder = new GraphBuilder(config);
  });

  describe('buildPropagationGraph', () => {
    it('should build a graph with users and posts', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);

      expect(graph.metadata.totalNodes).toBeGreaterThan(0);
      expect(graph.metadata.totalEdges).toBeGreaterThan(0);
      expect(graph.metadata.platforms).toContain('twitter');
    });

    it('should include user nodes when configured', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      const userNodes = Array.from(graph.nodes.values())
        .filter(node => node.type === 'user');
      
      expect(userNodes.length).toBeGreaterThan(0);
    });

    it('should include post nodes when configured', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      const postNodes = Array.from(graph.nodes.values())
        .filter(node => node.type === 'post');
      
      expect(postNodes.length).toBeGreaterThan(0);
    });

    it('should exclude user nodes when configured', () => {
      config.includeUserNodes = false;
      graphBuilder = new GraphBuilder(config);
      
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      const userNodes = Array.from(graph.nodes.values())
        .filter(node => node.type === 'user');
      
      expect(userNodes.length).toBe(0);
    });

    it('should exclude post nodes when configured', () => {
      config.includePostNodes = false;
      graphBuilder = new GraphBuilder(config);
      
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      const postNodes = Array.from(graph.nodes.values())
        .filter(node => node.type === 'post');
      
      expect(postNodes.length).toBe(0);
    });

    it('should filter edges by minimum weight', () => {
      config.minEdgeWeight = 1.0;
      graphBuilder = new GraphBuilder(config);
      
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      for (const [_, edge] of graph.edges) {
        expect(edge.weight).toBeGreaterThanOrEqual(1.0);
      }
    });

    it('should limit graph size when configured', () => {
      config.maxGraphSize = 2;
      graphBuilder = new GraphBuilder(config);
      
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      expect(graph.metadata.totalNodes).toBeLessThanOrEqual(2);
    });
  });

  describe('toGraphLib', () => {
    it('should convert propagation graph to GraphLib format', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const graphLib = graphBuilder.toGraphLib(graph);

      expect(graphLib.nodes().length).toBe(graph.metadata.totalNodes);
      expect(graphLib.edges().length).toBe(graph.metadata.totalEdges);
    });
  });

  describe('getGraphStatistics', () => {
    it('should return correct graph statistics', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      const stats = graphBuilder.getGraphStatistics(graph);

      expect(stats.totalNodes).toBe(graph.metadata.totalNodes);
      expect(stats.totalEdges).toBe(graph.metadata.totalEdges);
      expect(stats.nodeTypes).toHaveProperty('user');
      expect(stats.nodeTypes).toHaveProperty('post');
      expect(stats.platforms).toContain('twitter');
      expect(stats.timeSpan).toBeGreaterThan(0);
    });
  });

  describe('edge weight calculation', () => {
    it('should calculate different weights for different interaction types', () => {
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      const edgeWeights = Array.from(graph.edges.values())
        .map(edge => edge.weight);
      
      // Should have some variation in weights
      const uniqueWeights = new Set(edgeWeights);
      expect(uniqueWeights.size).toBeGreaterThan(1);
    });

    it('should apply time decay when configured', () => {
      config.edgeWeightCalculation = 'temporal';
      config.timeDecayFactor = 0.5;
      graphBuilder = new GraphBuilder(config);
      
      const graph = graphBuilder.buildPropagationGraph([mockDataCollection]);
      
      // Should have edges with time-decayed weights
      expect(graph.metadata.totalEdges).toBeGreaterThan(0);
    });
  });
});