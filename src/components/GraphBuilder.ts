/**
 * GraphBuilder - Constructs directed graphs of content propagation
 */

import { Graph } from 'graphlib';
import {
  SocialUser,
  SocialPost,
  SocialInteraction,
  SocialDataCollection,
  PropagationGraph,
  PropagationNode,
  PropagationEdge,
  EdgeType,
  SocialPlatform
} from '../types';
import { GraphBuilderConfig } from '../types/api';

export class GraphBuilder {
  private config: GraphBuilderConfig;

  constructor(config: GraphBuilderConfig) {
    this.config = config;
  }

  /**
   * Build propagation graph from social data collections
   */
  buildPropagationGraph(collections: SocialDataCollection[]): PropagationGraph {
    const nodes = new Map<string, PropagationNode>();
    const edges = new Map<string, PropagationEdge>();
    const platforms = new Set<SocialPlatform>();
    let earliestTime = new Date();
    let latestTime = new Date(0);

    // Process each collection
    for (const collection of collections) {
      platforms.add(collection.platform);

      // Add user nodes
      if (this.config.includeUserNodes) {
        this.addUserNodes(collection.users, nodes, earliestTime, latestTime);
      }

      // Add post nodes
      if (this.config.includePostNodes) {
        this.addPostNodes(collection.posts, nodes, earliestTime, latestTime);
      }

      // Add edges based on interactions
      this.addInteractionEdges(collection, edges, nodes);
    }

    // Add user-to-user edges (follows, mentions, etc.)
    this.addUserToUserEdges(collections, edges, nodes);

    // Add post-to-post edges (replies, retweets, etc.)
    this.addPostToPostEdges(collections, edges, nodes);

    // Filter edges by minimum weight
    this.filterEdgesByWeight(edges);

    // Limit graph size if needed
    if (nodes.size > this.config.maxGraphSize) {
      this.limitGraphSize(nodes, edges);
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.size,
        totalEdges: edges.size,
        timeRange: {
          start: earliestTime,
          end: latestTime
        },
        platforms: Array.from(platforms)
      }
    };
  }

  /**
   * Add user nodes to the graph
   */
  private addUserNodes(
    users: SocialUser[],
    nodes: Map<string, PropagationNode>,
    earliestTime: Date,
    latestTime: Date
  ): void {
    for (const user of users) {
      const nodeId = `user_${user.id}`;
      const node: PropagationNode = {
        id: nodeId,
        type: 'user',
        data: user,
        timestamp: user.accountCreatedAt
      };

      nodes.set(nodeId, node);

      // Update time range
      if (user.accountCreatedAt < earliestTime) {
        earliestTime = user.accountCreatedAt;
      }
      if (user.accountCreatedAt > latestTime) {
        latestTime = user.accountCreatedAt;
      }
    }
  }

  /**
   * Add post nodes to the graph
   */
  private addPostNodes(
    posts: SocialPost[],
    nodes: Map<string, PropagationNode>,
    earliestTime: Date,
    latestTime: Date
  ): void {
    for (const post of posts) {
      const nodeId = `post_${post.id}`;
      const node: PropagationNode = {
        id: nodeId,
        type: 'post',
        data: post,
        timestamp: post.createdAt
      };

      nodes.set(nodeId, node);

      // Update time range
      if (post.createdAt < earliestTime) {
        earliestTime = post.createdAt;
      }
      if (post.createdAt > latestTime) {
        latestTime = post.createdAt;
      }
    }
  }

  /**
   * Add edges based on social interactions
   */
  private addInteractionEdges(
    collection: SocialDataCollection,
    edges: Map<string, PropagationEdge>,
    nodes: Map<string, PropagationNode>
  ): void {
    for (const interaction of collection.interactions) {
      const userNodeId = `user_${interaction.userId}`;
      const postNodeId = `post_${interaction.postId}`;

      // Only add edges if both nodes exist
      if (nodes.has(userNodeId) && nodes.has(postNodeId)) {
        const edgeId = `${userNodeId}_${postNodeId}_${interaction.type}`;
        const weight = this.calculateEdgeWeight(interaction, collection);

        if (weight >= this.config.minEdgeWeight) {
          const edge: PropagationEdge = {
            source: userNodeId,
            target: postNodeId,
            type: this.mapInteractionToEdgeType(interaction.type),
            weight,
            timestamp: interaction.timestamp,
            metadata: {
              interactionType: interaction.type,
              platform: interaction.platform
            }
          };

          edges.set(edgeId, edge);
        }
      }
    }
  }

  /**
   * Add user-to-user edges (follows, mentions, etc.)
   */
  private addUserToUserEdges(
    collections: SocialDataCollection[],
    edges: Map<string, PropagationEdge>,
    nodes: Map<string, PropagationNode>
  ): void {
    for (const collection of collections) {
      for (const post of collection.posts) {
        const authorNodeId = `user_${post.authorId}`;

        // Add mention edges
        for (const mention of post.mentions) {
          const mentionedUserNodeId = `user_${mention}`;
          
          if (nodes.has(authorNodeId) && nodes.has(mentionedUserNodeId)) {
            const edgeId = `${authorNodeId}_${mentionedUserNodeId}_mention`;
            const weight = this.calculateMentionWeight(post);

            if (weight >= this.config.minEdgeWeight) {
              const edge: PropagationEdge = {
                source: authorNodeId,
                target: mentionedUserNodeId,
                type: EdgeType.MENTIONS,
                weight,
                timestamp: post.createdAt,
                metadata: {
                  postId: post.id,
                  platform: post.platform
                }
              };

              edges.set(edgeId, edge);
            }
          }
        }
      }
    }
  }

  /**
   * Add post-to-post edges (replies, retweets, etc.)
   */
  private addPostToPostEdges(
    collections: SocialDataCollection[],
    edges: Map<string, PropagationEdge>,
    nodes: Map<string, PropagationNode>
  ): void {
    for (const collection of collections) {
      for (const post of collection.posts) {
        if (post.parentPostId) {
          const postNodeId = `post_${post.id}`;
          const parentNodeId = `post_${post.parentPostId}`;

          if (nodes.has(postNodeId) && nodes.has(parentNodeId)) {
            const edgeId = `${postNodeId}_${parentNodeId}_reply`;
            const weight = this.calculateReplyWeight(post);

            if (weight >= this.config.minEdgeWeight) {
              const edge: PropagationEdge = {
                source: postNodeId,
                target: parentNodeId,
                type: EdgeType.REPLIES,
                weight,
                timestamp: post.createdAt,
                metadata: {
                  platform: post.platform,
                  isRetweet: post.retweetCount !== undefined
                }
              };

              edges.set(edgeId, edge);
            }
          }
        }
      }
    }
  }

  /**
   * Calculate edge weight based on interaction type and configuration
   */
  private calculateEdgeWeight(
    interaction: SocialInteraction,
    collection: SocialDataCollection
  ): number {
    let baseWeight = 1;

    switch (interaction.type) {
      case 'like':
        baseWeight = 0.5;
        break;
      case 'share':
        baseWeight = 2.0;
        break;
      case 'comment':
        baseWeight = 1.5;
        break;
      case 'retweet':
        baseWeight = 2.5;
        break;
      case 'reply':
        baseWeight = 1.8;
        break;
      case 'mention':
        baseWeight = 1.2;
        break;
      default:
        baseWeight = 1.0;
    }

    // Apply time decay if configured
    if (this.config.edgeWeightCalculation === 'temporal') {
      const timeDiff = Date.now() - interaction.timestamp.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const decayFactor = Math.exp(-this.config.timeDecayFactor * hoursDiff);
      baseWeight *= decayFactor;
    }

    return baseWeight;
  }

  /**
   * Calculate weight for mention edges
   */
  private calculateMentionWeight(post: SocialPost): number {
    let weight = 1.0;

    // Weight based on post engagement
    const totalEngagement = post.likeCount + post.shareCount + post.commentCount;
    if (totalEngagement > 100) {
      weight *= 1.5;
    } else if (totalEngagement > 10) {
      weight *= 1.2;
    }

    return weight;
  }

  /**
   * Calculate weight for reply edges
   */
  private calculateReplyWeight(post: SocialPost): number {
    let weight = 1.0;

    // Weight based on reply engagement
    const totalEngagement = post.likeCount + post.shareCount + post.commentCount;
    if (totalEngagement > 50) {
      weight *= 2.0;
    } else if (totalEngagement > 5) {
      weight *= 1.5;
    }

    return weight;
  }

  /**
   * Map interaction type to edge type
   */
  private mapInteractionToEdgeType(interactionType: string): EdgeType {
    switch (interactionType) {
      case 'like':
        return EdgeType.LIKES;
      case 'share':
        return EdgeType.SHARES;
      case 'comment':
        return EdgeType.COMMENTS;
      case 'retweet':
        return EdgeType.RETWEETS;
      case 'reply':
        return EdgeType.REPLIES;
      case 'mention':
        return EdgeType.MENTIONS;
      default:
        return EdgeType.LIKES;
    }
  }

  /**
   * Filter edges by minimum weight
   */
  private filterEdgesByWeight(edges: Map<string, PropagationEdge>): void {
    const edgesToRemove: string[] = [];

    for (const [edgeId, edge] of edges) {
      if (edge.weight < this.config.minEdgeWeight) {
        edgesToRemove.push(edgeId);
      }
    }

    for (const edgeId of edgesToRemove) {
      edges.delete(edgeId);
    }
  }

  /**
   * Limit graph size by keeping most important nodes and edges
   */
  private limitGraphSize(
    nodes: Map<string, PropagationNode>,
    edges: Map<string, PropagationEdge>
  ): void {
    // Calculate node importance scores
    const nodeScores = new Map<string, number>();

    for (const [nodeId, node] of nodes) {
      let score = 0;

      if (node.type === 'user') {
        const user = node.data as SocialUser;
        score = user.followerCount + user.followingCount;
      } else if (node.type === 'post') {
        const post = node.data as SocialPost;
        score = post.likeCount + post.shareCount + post.commentCount;
      }

      nodeScores.set(nodeId, score);
    }

    // Sort nodes by importance
    const sortedNodes = Array.from(nodeScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.maxGraphSize);

    const nodesToKeep = new Set(sortedNodes.map(([nodeId]) => nodeId));

    // Remove less important nodes
    const nodesToRemove: string[] = [];
    for (const nodeId of nodes.keys()) {
      if (!nodesToKeep.has(nodeId)) {
        nodesToRemove.push(nodeId);
      }
    }

    for (const nodeId of nodesToRemove) {
      nodes.delete(nodeId);
    }

    // Remove edges connected to removed nodes
    const edgesToRemove: string[] = [];
    for (const [edgeId, edge] of edges) {
      if (!nodesToKeep.has(edge.source) || !nodesToKeep.has(edge.target)) {
        edgesToRemove.push(edgeId);
      }
    }

    for (const edgeId of edgesToRemove) {
      edges.delete(edgeId);
    }
  }

  /**
   * Convert propagation graph to GraphLib format for analysis
   */
  toGraphLib(graph: PropagationGraph): Graph {
    const g = new Graph({ directed: true });

    // Add nodes
    for (const [nodeId, node] of graph.nodes) {
      g.setNode(nodeId, {
        type: node.type,
        data: node.data,
        timestamp: node.timestamp
      });
    }

    // Add edges
    for (const [edgeId, edge] of graph.edges) {
      g.setEdge(edge.source, edge.target, {
        type: edge.type,
        weight: edge.weight,
        timestamp: edge.timestamp,
        metadata: edge.metadata
      });
    }

    return g;
  }

  /**
   * Get graph statistics
   */
  getGraphStatistics(graph: PropagationGraph): {
    totalNodes: number;
    totalEdges: number;
    nodeTypes: Record<string, number>;
    edgeTypes: Record<string, number>;
    platforms: string[];
    timeSpan: number; // hours
  } {
    const nodeTypes: Record<string, number> = {};
    const edgeTypes: Record<string, number> = {};
    const platforms = new Set<string>();

    // Count node types
    for (const [_, node] of graph.nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
      
      if (node.type === 'user') {
        platforms.add((node.data as SocialUser).platform);
      } else if (node.type === 'post') {
        platforms.add((node.data as SocialPost).platform);
      }
    }

    // Count edge types
    for (const [_, edge] of graph.edges) {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
    }

    const timeSpan = (graph.metadata.timeRange.end.getTime() - 
                     graph.metadata.timeRange.start.getTime()) / (1000 * 60 * 60);

    return {
      totalNodes: graph.metadata.totalNodes,
      totalEdges: graph.metadata.totalEdges,
      nodeTypes,
      edgeTypes,
      platforms: Array.from(platforms),
      timeSpan
    };
  }
}