/**
 * BehaviorDetector - Detects bot patterns and coordinated inauthentic behavior
 */

import {
  PropagationGraph,
  SocialUser,
  SocialPost,
  SocialInteraction,
  BotDetectionMetrics,
  CoordinationAnalysis,
  ViralityMetrics,
  MisinformationPathway,
  InterventionPoint,
  TemporalPattern
} from '../types';
import { BehaviorDetectorConfig } from '../types/api';
import { NetworkAnalyzer } from './NetworkAnalyzer';

export class BehaviorDetector {
  private config: BehaviorDetectorConfig;
  private networkAnalyzer: NetworkAnalyzer;

  constructor(config: BehaviorDetectorConfig, networkAnalyzer: NetworkAnalyzer) {
    this.config = config;
    this.networkAnalyzer = networkAnalyzer;
  }

  /**
   * Detect bot-like behavior for all users in the graph
   */
  detectBotBehavior(graph: PropagationGraph): Map<string, BotDetectionMetrics> {
    const botMetrics = new Map<string, BotDetectionMetrics>();
    const users = this.extractUsers(graph);

    for (const user of users) {
      const metrics = this.analyzeUserBehavior(user, graph);
      botMetrics.set(user.id, metrics);
    }

    return botMetrics;
  }

  /**
   * Analyze individual user behavior for bot detection
   */
  private analyzeUserBehavior(user: SocialUser, graph: PropagationGraph): BotDetectionMetrics {
    const userPosts = this.getUserPosts(user.id, graph);
    const userInteractions = this.getUserInteractions(user.id, graph);

    // Calculate various bot indicators
    const activityBursts = this.calculateActivityBursts(userPosts, userInteractions);
    const postingFrequency = this.calculatePostingFrequency(userPosts);
    const followerRatio = this.calculateFollowerRatio(user);
    const contentSimilarity = this.calculateContentSimilarity(userPosts);
    const networkReciprocity = this.calculateNetworkReciprocity(user.id, graph);
    const accountAge = this.calculateAccountAge(user);

    // Combine metrics into bot score
    const botScore = this.calculateBotScore({
      activityBursts,
      postingFrequency,
      followerRatio,
      contentSimilarity,
      networkReciprocity,
      accountAge,
      verificationStatus: user.verified
    });

    const suspiciousPatterns = this.identifySuspiciousPatterns({
      activityBursts,
      postingFrequency,
      followerRatio,
      contentSimilarity,
      networkReciprocity,
      accountAge,
      verificationStatus: user.verified
    });

    return {
      userId: user.id,
      botScore,
      activityBursts,
      postingFrequency,
      followerRatio,
      contentSimilarity,
      networkReciprocity,
      accountAge,
      verificationStatus: user.verified,
      suspiciousPatterns
    };
  }

  /**
   * Calculate activity bursts (sudden spikes in activity)
   */
  private calculateActivityBursts(posts: SocialPost[], interactions: SocialInteraction[]): number {
    if (posts.length === 0) return 0;

    // Group posts by hour
    const hourlyActivity = new Map<number, number>();
    
    for (const post of posts) {
      const hour = Math.floor(post.createdAt.getTime() / (1000 * 60 * 60));
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    }

    // Calculate standard deviation of hourly activity
    const activities = Array.from(hourlyActivity.values());
    const mean = activities.reduce((sum, val) => sum + val, 0) / activities.length;
    const variance = activities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / activities.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-1 scale (higher std dev = more bursts)
    return Math.min(stdDev / 10, 1.0);
  }

  /**
   * Calculate posting frequency (posts per hour)
   */
  private calculatePostingFrequency(posts: SocialPost[]): number {
    if (posts.length === 0) return 0;

    const timeSpan = this.getTimeSpan(posts);
    if (timeSpan === 0) return 0;

    return posts.length / timeSpan;
  }

  /**
   * Calculate follower ratio (followers / following)
   */
  private calculateFollowerRatio(user: SocialUser): number {
    if (user.followingCount === 0) {
      return user.followerCount > 0 ? 1.0 : 0.0;
    }
    return user.followerCount / user.followingCount;
  }

  /**
   * Calculate content similarity between user's posts
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
   * Calculate network reciprocity (mutual connections)
   */
  private calculateNetworkReciprocity(userId: string, graph: PropagationGraph): number {
    const userNodeId = `user_${userId}`;
    const userNode = graph.nodes.get(userNodeId);
    
    if (!userNode) return 0;

    // Find users this user interacts with
    const interactedUsers = new Set<string>();
    
    for (const [_, edge] of graph.edges) {
      if (edge.source === userNodeId && edge.target.startsWith('user_')) {
        interactedUsers.add(edge.target.replace('user_', ''));
      }
    }

    // Count mutual interactions
    let mutualInteractions = 0;
    for (const interactedUser of interactedUsers) {
      const interactedUserNodeId = `user_${interactedUser}`;
      
      for (const [_, edge] of graph.edges) {
        if (edge.source === interactedUserNodeId && edge.target === userNodeId) {
          mutualInteractions++;
          break;
        }
      }
    }

    return interactedUsers.size > 0 ? mutualInteractions / interactedUsers.size : 0;
  }

  /**
   * Calculate account age in days
   */
  private calculateAccountAge(user: SocialUser): number {
    const now = Date.now();
    const created = user.accountCreatedAt.getTime();
    return (now - created) / (1000 * 60 * 60 * 24);
  }

  /**
   * Calculate overall bot score from individual metrics
   */
  private calculateBotScore(metrics: {
    activityBursts: number;
    postingFrequency: number;
    followerRatio: number;
    contentSimilarity: number;
    networkReciprocity: number;
    accountAge: number;
    verificationStatus: boolean;
  }): number {
    let score = 0;

    // High activity bursts suggest bot behavior
    if (metrics.activityBursts > 0.5) {
      score += 0.2;
    }

    // Very high posting frequency
    if (metrics.postingFrequency > 10) { // More than 10 posts per hour
      score += 0.2;
    }

    // Unusual follower ratio (either very high or very low)
    if (metrics.followerRatio > 10 || metrics.followerRatio < 0.1) {
      score += 0.15;
    }

    // High content similarity
    if (metrics.contentSimilarity > this.config.contentSimilarityThreshold) {
      score += 0.2;
    }

    // Low network reciprocity
    if (metrics.networkReciprocity < this.config.networkReciprocityThreshold) {
      score += 0.15;
    }

    // New account
    if (metrics.accountAge < 30) { // Less than 30 days old
      score += 0.1;
    }

    // Unverified account
    if (!metrics.verificationStatus) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Identify specific suspicious patterns
   */
  private identifySuspiciousPatterns(metrics: {
    activityBursts: number;
    postingFrequency: number;
    followerRatio: number;
    contentSimilarity: number;
    networkReciprocity: number;
    accountAge: number;
    verificationStatus: boolean;
  }): string[] {
    const patterns: string[] = [];

    if (metrics.activityBursts > 0.5) {
      patterns.push('High activity bursts detected');
    }

    if (metrics.postingFrequency > 10) {
      patterns.push('Unusually high posting frequency');
    }

    if (metrics.followerRatio > 10) {
      patterns.push('Suspiciously high follower ratio');
    } else if (metrics.followerRatio < 0.1) {
      patterns.push('Suspiciously low follower ratio');
    }

    if (metrics.contentSimilarity > this.config.contentSimilarityThreshold) {
      patterns.push('High content similarity across posts');
    }

    if (metrics.networkReciprocity < this.config.networkReciprocityThreshold) {
      patterns.push('Low network reciprocity');
    }

    if (metrics.accountAge < 7) {
      patterns.push('Very new account');
    }

    if (!metrics.verificationStatus && metrics.followerRatio > 5) {
      patterns.push('Unverified account with high follower ratio');
    }

    return patterns;
  }

  /**
   * Detect coordinated behavior between users
   */
  detectCoordination(graph: PropagationGraph): CoordinationAnalysis[] {
    const users = this.extractUsers(graph);
    const coordinationGroups: CoordinationAnalysis[] = [];

    // Group users by similar behavior patterns
    const userGroups = this.groupUsersByBehavior(users, graph);

    for (const group of userGroups) {
      if (group.length > 1) {
        const analysis = this.analyzeGroupCoordination(group, graph);
        if (analysis.coordinationScore > this.config.coordinationThreshold) {
          coordinationGroups.push(analysis);
        }
      }
    }

    return coordinationGroups.sort((a, b) => b.coordinationScore - a.coordinationScore);
  }

  /**
   * Group users by similar behavior patterns
   */
  private groupUsersByBehavior(users: SocialUser[], graph: PropagationGraph): SocialUser[][] {
    const groups: SocialUser[][] = [];
    const processed = new Set<string>();

    for (const user of users) {
      if (processed.has(user.id)) continue;

      const group = [user];
      processed.add(user.id);

      // Find users with similar behavior
      for (const otherUser of users) {
        if (processed.has(otherUser.id)) continue;

        if (this.areUsersSimilar(user, otherUser, graph)) {
          group.push(otherUser);
          processed.add(otherUser.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Check if two users have similar behavior patterns
   */
  private areUsersSimilar(user1: SocialUser, user2: SocialUser, graph: PropagationGraph): boolean {
    const posts1 = this.getUserPosts(user1.id, graph);
    const posts2 = this.getUserPosts(user2.id, graph);

    // Check content similarity
    const contentSimilarity = this.calculateCrossUserContentSimilarity(posts1, posts2);
    if (contentSimilarity > 0.6) return true;

    // Check temporal patterns
    const temporalSimilarity = this.calculateTemporalSimilarity(posts1, posts2);
    if (temporalSimilarity > 0.7) return true;

    // Check network overlap
    const networkOverlap = this.calculateNetworkOverlap(user1.id, user2.id, graph);
    if (networkOverlap > 0.5) return true;

    return false;
  }

  /**
   * Analyze coordination within a group
   */
  private analyzeGroupCoordination(users: SocialUser[], graph: PropagationGraph): CoordinationAnalysis {
    const groupId = `group_${users.map(u => u.id).join('_')}`;
    const participants = users.map(u => u.id);

    // Calculate coordination metrics
    const contentSimilarity = this.calculateGroupContentSimilarity(users, graph);
    const networkOverlap = this.calculateGroupNetworkOverlap(users, graph);
    const synchronizedActivity = this.detectSynchronizedActivity(users, graph);
    const temporalPatterns = this.analyzeTemporalPatterns(users, graph);

    // Calculate overall coordination score
    let coordinationScore = 0;
    if (contentSimilarity > 0.5) coordinationScore += 0.3;
    if (networkOverlap > 0.3) coordinationScore += 0.3;
    if (synchronizedActivity) coordinationScore += 0.4;

    const suspiciousBehaviors = this.identifyGroupSuspiciousBehaviors(users, graph);

    return {
      groupId,
      participants,
      coordinationScore,
      synchronizedActivity,
      contentSimilarity,
      networkOverlap,
      temporalPatterns,
      suspiciousBehaviors
    };
  }

  /**
   * Calculate virality metrics for posts
   */
  calculateViralityMetrics(graph: PropagationGraph): Map<string, ViralityMetrics> {
    const viralityMetrics = new Map<string, ViralityMetrics>();
    const posts = this.extractPosts(graph);

    for (const post of posts) {
      const metrics = this.analyzePostVirality(post, graph);
      viralityMetrics.set(post.id, metrics);
    }

    return viralityMetrics;
  }

  /**
   * Analyze individual post virality
   */
  private analyzePostVirality(post: SocialPost, graph: PropagationGraph): ViralityMetrics {
    const postNodeId = `post_${post.id}`;
    
    // Calculate reach (unique users who interacted)
    const reach = this.calculatePostReach(postNodeId, graph);
    
    // Calculate engagement rate
    const engagement = this.calculateEngagementRate(post);
    
    // Calculate velocity (interactions per hour)
    const velocity = this.calculatePostVelocity(postNodeId, graph);
    
    // Calculate amplification (shares/retweets per like)
    const amplification = this.calculateAmplification(post);
    
    // Calculate cascade depth
    const cascadeDepth = this.calculateCascadeDepth(postNodeId, graph);
    
    // Calculate unique users
    const uniqueUsers = this.calculateUniqueUsers(postNodeId, graph);
    
    // Calculate time to viral
    const timeToViral = this.calculateTimeToViral(postNodeId, graph);
    
    // Find peak activity time
    const peakActivity = this.findPeakActivity(postNodeId, graph);

    // Calculate overall virality score
    const viralityScore = this.calculateViralityScore({
      reach,
      engagement,
      velocity,
      amplification,
      cascadeDepth,
      uniqueUsers,
      timeToViral
    });

    return {
      postId: post.id,
      viralityScore,
      reach,
      engagement,
      velocity,
      amplification,
      cascadeDepth,
      uniqueUsers,
      timeToViral,
      peakActivity
    };
  }

  /**
   * Identify misinformation pathways
   */
  identifyMisinformationPathways(graph: PropagationGraph): MisinformationPathway[] {
    const pathways: MisinformationPathway[] = [];
    const posts = this.extractPosts(graph);

    // Find posts with high virality and low credibility indicators
    const suspiciousPosts = posts.filter(post => {
      const virality = this.analyzePostVirality(post, graph);
      const credibility = this.calculatePostCredibility(post, graph);
      
      return virality.viralityScore > 0.7 && credibility < 0.3;
    });

    for (const post of suspiciousPosts) {
      const pathway = this.tracePropagationPath(post, graph);
      if (pathway) {
        pathways.push(pathway);
      }
    }

    return pathways.sort((a, b) => b.reach - a.reach);
  }

  /**
   * Trace propagation path for a post
   */
  private tracePropagationPath(post: SocialPost, graph: PropagationGraph): MisinformationPathway | null {
    const postNodeId = `post_${post.id}`;
    const propagationPath: string[] = [postNodeId];
    const keyNodes: string[] = [];
    const amplificationPoints: string[] = [];

    // Trace the propagation through the graph
    const visited = new Set<string>();
    const queue = [postNodeId];
    visited.add(postNodeId);

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      
      // Find connected posts
      for (const [_, edge] of graph.edges) {
        if (edge.source === currentNode && edge.target.startsWith('post_') && !visited.has(edge.target)) {
          propagationPath.push(edge.target);
          queue.push(edge.target);
          visited.add(edge.target);

          // Check if this is an amplification point
          if (edge.type === 'retweets' || edge.type === 'shares') {
            amplificationPoints.push(edge.target);
          }
        }
      }
    }

    // Identify key nodes (high centrality)
    const networkMetrics = this.networkAnalyzer.analyzeNetworkMetrics(graph);
    for (const nodeId of propagationPath) {
      const metrics = networkMetrics.get(nodeId);
      if (metrics && metrics.betweennessCentrality > 0.1) {
        keyNodes.push(nodeId);
      }
    }

    const reach = propagationPath.length;
    const velocity = this.calculatePathVelocity(propagationPath, graph);
    const credibility = this.calculatePostCredibility(post, graph);
    const interventionPoints = this.identifyInterventionPoints(propagationPath, graph);

    return {
      id: `pathway_${post.id}`,
      sourcePost: post.id,
      propagationPath,
      keyNodes,
      amplificationPoints,
      reach,
      velocity,
      credibility,
      interventionPoints
    };
  }

  /**
   * Identify intervention points in a pathway
   */
  private identifyInterventionPoints(path: string[], graph: PropagationGraph): InterventionPoint[] {
    const interventionPoints: InterventionPoint[] = [];
    const networkMetrics = this.networkAnalyzer.analyzeNetworkMetrics(graph);

    for (const nodeId of path) {
      const metrics = networkMetrics.get(nodeId);
      if (!metrics) continue;

      let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let reason = '';
      let suggestedAction = '';

      // High centrality nodes are good intervention points
      if (metrics.betweennessCentrality > 0.2) {
        priority = 'high';
        reason = 'High betweenness centrality - key connector node';
        suggestedAction = 'Monitor and potentially limit reach';
      }

      // High PageRank nodes
      if (metrics.pageRank > 0.1) {
        if (priority === 'low') {
          priority = 'medium';
          reason = 'High PageRank - influential node';
          suggestedAction = 'Monitor content and engagement patterns';
        }
      }

      // Bot-like behavior
      const userNodeId = nodeId.replace('post_', 'user_');
      const userNode = graph.nodes.get(userNodeId);
      if (userNode && userNode.type === 'user') {
        const user = userNode.data as SocialUser;
        if (user.followerCount > 10000 && !user.verified) {
          if (priority === 'low') {
            priority = 'medium';
            reason = 'Unverified high-follower account';
            suggestedAction = 'Verify authenticity and monitor behavior';
          }
        }
      }

      if (priority !== 'low') {
        interventionPoints.push({
          nodeId,
          type: nodeId.startsWith('user_') ? 'user' : 'post',
          priority,
          reason,
          suggestedAction,
          impact: metrics.betweennessCentrality + metrics.pageRank
        });
      }
    }

    return interventionPoints.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods
  private extractUsers(graph: PropagationGraph): SocialUser[] {
    const users: SocialUser[] = [];
    for (const [_, node] of graph.nodes) {
      if (node.type === 'user') {
        users.push(node.data as SocialUser);
      }
    }
    return users;
  }

  private extractPosts(graph: PropagationGraph): SocialPost[] {
    const posts: SocialPost[] = [];
    for (const [_, node] of graph.nodes) {
      if (node.type === 'post') {
        posts.push(node.data as SocialPost);
      }
    }
    return posts;
  }

  private getUserPosts(userId: string, graph: PropagationGraph): SocialPost[] {
    const posts: SocialPost[] = [];
    for (const [_, node] of graph.nodes) {
      if (node.type === 'post') {
        const post = node.data as SocialPost;
        if (post.authorId === userId) {
          posts.push(post);
        }
      }
    }
    return posts;
  }

  private getUserInteractions(userId: string, graph: PropagationGraph): SocialInteraction[] {
    const interactions: SocialInteraction[] = [];
    const userNodeId = `user_${userId}`;
    
    for (const [_, edge] of graph.edges) {
      if (edge.source === userNodeId) {
        // This would need to be reconstructed from edge data
        // For now, return empty array
      }
    }
    
    return interactions;
  }

  private getTimeSpan(posts: SocialPost[]): number {
    if (posts.length === 0) return 0;
    
    const times = posts.map(p => p.createdAt.getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return (maxTime - minTime) / (1000 * 60 * 60); // hours
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Additional helper methods for coordination analysis
  private calculateCrossUserContentSimilarity(posts1: SocialPost[], posts2: SocialPost[]): number {
    if (posts1.length === 0 || posts2.length === 0) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (const post1 of posts1) {
      for (const post2 of posts2) {
        const similarity = this.calculateTextSimilarity(post1.content, post2.content);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private calculateTemporalSimilarity(posts1: SocialPost[], posts2: SocialPost[]): number {
    if (posts1.length === 0 || posts2.length === 0) return 0;

    // Group posts by hour of day
    const hourlyActivity1 = new Map<number, number>();
    const hourlyActivity2 = new Map<number, number>();

    for (const post of posts1) {
      const hour = post.createdAt.getHours();
      hourlyActivity1.set(hour, (hourlyActivity1.get(hour) || 0) + 1);
    }

    for (const post of posts2) {
      const hour = post.createdAt.getHours();
      hourlyActivity2.set(hour, (hourlyActivity2.get(hour) || 0) + 1);
    }

    // Calculate correlation between hourly patterns
    let correlation = 0;
    for (let hour = 0; hour < 24; hour++) {
      const activity1 = hourlyActivity1.get(hour) || 0;
      const activity2 = hourlyActivity2.get(hour) || 0;
      correlation += Math.min(activity1, activity2);
    }

    const maxActivity1 = Math.max(...Array.from(hourlyActivity1.values()));
    const maxActivity2 = Math.max(...Array.from(hourlyActivity2.values()));

    return maxActivity1 > 0 && maxActivity2 > 0 ? correlation / Math.max(maxActivity1, maxActivity2) : 0;
  }

  private calculateNetworkOverlap(userId1: string, userId2: string, graph: PropagationGraph): number {
    const connections1 = new Set<string>();
    const connections2 = new Set<string>();

    const userNodeId1 = `user_${userId1}`;
    const userNodeId2 = `user_${userId2}`;

    // Find connections for user1
    for (const [_, edge] of graph.edges) {
      if (edge.source === userNodeId1 && edge.target.startsWith('user_')) {
        connections1.add(edge.target);
      }
    }

    // Find connections for user2
    for (const [_, edge] of graph.edges) {
      if (edge.source === userNodeId2 && edge.target.startsWith('user_')) {
        connections2.add(edge.target);
      }
    }

    // Calculate Jaccard similarity
    const intersection = new Set([...connections1].filter(conn => connections2.has(conn)));
    const union = new Set([...connections1, ...connections2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private detectSynchronizedActivity(users: SocialUser[], graph: PropagationGraph): boolean {
    // Check if users post at similar times
    const postingTimes = users.map(user => {
      const posts = this.getUserPosts(user.id, graph);
      return posts.map(post => post.createdAt.getTime());
    });

    if (postingTimes.length < 2) return false;

    // Check for temporal clustering
    let synchronizedPosts = 0;
    let totalPosts = 0;

    for (let i = 0; i < postingTimes.length; i++) {
      for (let j = i + 1; j < postingTimes.length; j++) {
        const times1 = postingTimes[i];
        const times2 = postingTimes[j];

        for (const time1 of times1) {
          for (const time2 of times2) {
            totalPosts++;
            if (Math.abs(time1 - time2) < 5 * 60 * 1000) { // Within 5 minutes
              synchronizedPosts++;
            }
          }
        }
      }
    }

    return totalPosts > 0 && (synchronizedPosts / totalPosts) > 0.1;
  }

  private analyzeTemporalPatterns(users: SocialUser[], graph: PropagationGraph): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];

    // Analyze posting patterns for each user
    for (const user of users) {
      const posts = this.getUserPosts(user.id, graph);
      if (posts.length < 5) continue;

      const postingTimes = posts.map(post => post.createdAt.getTime()).sort((a, b) => a - b);
      
      // Check for burst patterns
      const bursts = this.detectBurstPatterns(postingTimes);
      if (bursts.length > 0) {
        patterns.push({
          type: 'burst',
          frequency: bursts.length,
          duration: this.calculateAverageBurstDuration(bursts),
          confidence: 0.8,
          description: `User ${user.id} shows burst posting patterns`
        });
      }

      // Check for periodic patterns
      const periodicity = this.detectPeriodicPatterns(postingTimes);
      if (periodicity > 0) {
        patterns.push({
          type: 'periodic',
          frequency: periodicity,
          duration: 60, // 1 hour
          confidence: 0.6,
          description: `User ${user.id} shows periodic posting patterns`
        });
      }
    }

    return patterns;
  }

  private identifyGroupSuspiciousBehaviors(users: SocialUser[], graph: PropagationGraph): string[] {
    const behaviors: string[] = [];

    // Check for similar account creation dates
    const creationDates = users.map(user => user.accountCreatedAt.getTime());
    const dateVariance = this.calculateVariance(creationDates);
    if (dateVariance < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days variance
      behaviors.push('Users created accounts around the same time');
    }

    // Check for similar follower ratios
    const followerRatios = users.map(user => this.calculateFollowerRatio(user));
    const ratioVariance = this.calculateVariance(followerRatios);
    if (ratioVariance < 0.1) {
      behaviors.push('Users have very similar follower ratios');
    }

    // Check for coordinated content
    const contentSimilarity = this.calculateGroupContentSimilarity(users, graph);
    if (contentSimilarity > 0.7) {
      behaviors.push('Users post very similar content');
    }

    return behaviors;
  }

  private calculateGroupContentSimilarity(users: SocialUser[], graph: PropagationGraph): number {
    const allPosts = users.flatMap(user => this.getUserPosts(user.id, graph));
    return this.calculateContentSimilarity(allPosts);
  }

  private calculateGroupNetworkOverlap(users: SocialUser[], graph: PropagationGraph): number {
    if (users.length < 2) return 0;

    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const overlap = this.calculateNetworkOverlap(users[i].id, users[j].id, graph);
        totalOverlap += overlap;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalOverlap / comparisons : 0;
  }

  // Virality analysis helper methods
  private calculatePostReach(postNodeId: string, graph: PropagationGraph): number {
    const uniqueUsers = new Set<string>();
    
    for (const [_, edge] of graph.edges) {
      if (edge.target === postNodeId && edge.source.startsWith('user_')) {
        uniqueUsers.add(edge.source);
      }
    }

    return uniqueUsers.size;
  }

  private calculateEngagementRate(post: SocialPost): number {
    const totalEngagement = post.likeCount + post.shareCount + post.commentCount;
    return totalEngagement;
  }

  private calculatePostVelocity(postNodeId: string, graph: PropagationGraph): number {
    const interactions: Date[] = [];
    
    for (const [_, edge] of graph.edges) {
      if (edge.target === postNodeId) {
        interactions.push(edge.timestamp);
      }
    }

    if (interactions.length === 0) return 0;

    const timeSpan = this.getTimeSpanFromDates(interactions);
    return timeSpan > 0 ? interactions.length / timeSpan : 0;
  }

  private calculateAmplification(post: SocialPost): number {
    const totalLikes = post.likeCount;
    const totalShares = post.shareCount + (post.retweetCount || 0);
    
    return totalLikes > 0 ? totalShares / totalLikes : 0;
  }

  private calculateCascadeDepth(postNodeId: string, graph: PropagationGraph): number {
    const visited = new Set<string>();
    const queue = [{ node: postNodeId, depth: 0 }];
    let maxDepth = 0;

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      
      if (visited.has(node)) continue;
      visited.add(node);
      maxDepth = Math.max(maxDepth, depth);

      for (const [_, edge] of graph.edges) {
        if (edge.source === node && edge.target.startsWith('post_') && !visited.has(edge.target)) {
          queue.push({ node: edge.target, depth: depth + 1 });
        }
      }
    }

    return maxDepth;
  }

  private calculateUniqueUsers(postNodeId: string, graph: PropagationGraph): number {
    return this.calculatePostReach(postNodeId, graph);
  }

  private calculateTimeToViral(postNodeId: string, graph: PropagationGraph): number {
    const postNode = graph.nodes.get(postNodeId);
    if (!postNode) return 0;

    const post = postNode.data as SocialPost;
    const postTime = post.createdAt.getTime();

    // Find first significant interaction
    let firstInteractionTime = postTime;
    
    for (const [_, edge] of graph.edges) {
      if (edge.target === postNodeId) {
        if (edge.timestamp.getTime() < firstInteractionTime) {
          firstInteractionTime = edge.timestamp.getTime();
        }
      }
    }

    return (firstInteractionTime - postTime) / (1000 * 60); // minutes
  }

  private findPeakActivity(postNodeId: string, graph: PropagationGraph): Date {
    const hourlyActivity = new Map<number, number>();
    
    for (const [_, edge] of graph.edges) {
      if (edge.target === postNodeId) {
        const hour = Math.floor(edge.timestamp.getTime() / (1000 * 60 * 60));
        hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
      }
    }

    let peakHour = 0;
    let maxActivity = 0;

    for (const [hour, activity] of hourlyActivity) {
      if (activity > maxActivity) {
        maxActivity = activity;
        peakHour = hour;
      }
    }

    return new Date(peakHour * 60 * 60 * 1000);
  }

  private calculateViralityScore(metrics: {
    reach: number;
    engagement: number;
    velocity: number;
    amplification: number;
    cascadeDepth: number;
    uniqueUsers: number;
    timeToViral: number;
  }): number {
    let score = 0;

    // Normalize and weight each metric
    score += Math.min(metrics.reach / 1000, 1) * 0.2; // Reach weight: 20%
    score += Math.min(metrics.engagement / 100, 1) * 0.2; // Engagement weight: 20%
    score += Math.min(metrics.velocity / 10, 1) * 0.2; // Velocity weight: 20%
    score += Math.min(metrics.amplification / 2, 1) * 0.15; // Amplification weight: 15%
    score += Math.min(metrics.cascadeDepth / 5, 1) * 0.15; // Cascade depth weight: 15%
    score += Math.min(metrics.uniqueUsers / 500, 1) * 0.1; // Unique users weight: 10%

    return Math.min(score, 1.0);
  }

  private calculatePostCredibility(post: SocialPost, graph: PropagationGraph): number {
    let credibility = 0.5; // Base credibility

    // Check author verification
    const authorNodeId = `user_${post.authorId}`;
    const authorNode = graph.nodes.get(authorNodeId);
    if (authorNode && authorNode.type === 'user') {
      const author = authorNode.data as SocialUser;
      if (author.verified) {
        credibility += 0.2;
      }
    }

    // Check for URLs (might indicate external sources)
    if (post.urls.length > 0) {
      credibility += 0.1;
    }

    // Check for hashtags (might indicate topic relevance)
    if (post.hashtags.length > 0) {
      credibility += 0.1;
    }

    // Check content length (longer content might be more thoughtful)
    if (post.content.length > 100) {
      credibility += 0.1;
    }

    return Math.min(credibility, 1.0);
  }

  private calculatePathVelocity(path: string[], graph: PropagationGraph): number {
    if (path.length < 2) return 0;

    const times = path.map(nodeId => {
      const node = graph.nodes.get(nodeId);
      return node ? node.timestamp.getTime() : 0;
    }).sort((a, b) => a - b);

    const timeSpan = (times[times.length - 1] - times[0]) / (1000 * 60 * 60); // hours
    return timeSpan > 0 ? path.length / timeSpan : 0;
  }

  // Additional helper methods
  private getTimeSpanFromDates(dates: Date[]): number {
    if (dates.length === 0) return 0;
    
    const times = dates.map(d => d.getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return (maxTime - minTime) / (1000 * 60 * 60); // hours
  }

  private detectBurstPatterns(postingTimes: number[]): number[][] {
    const bursts: number[][] = [];
    const burstThreshold = 5 * 60 * 1000; // 5 minutes
    let currentBurst: number[] = [];

    for (let i = 0; i < postingTimes.length; i++) {
      if (i === 0 || postingTimes[i] - postingTimes[i - 1] <= burstThreshold) {
        currentBurst.push(postingTimes[i]);
      } else {
        if (currentBurst.length > 1) {
          bursts.push([...currentBurst]);
        }
        currentBurst = [postingTimes[i]];
      }
    }

    if (currentBurst.length > 1) {
      bursts.push(currentBurst);
    }

    return bursts;
  }

  private calculateAverageBurstDuration(bursts: number[][]): number {
    if (bursts.length === 0) return 0;

    const durations = bursts.map(burst => {
      const min = Math.min(...burst);
      const max = Math.max(...burst);
      return (max - min) / (1000 * 60); // minutes
    });

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private detectPeriodicPatterns(postingTimes: number[]): number {
    if (postingTimes.length < 3) return 0;

    // Simple periodicity detection - check for regular intervals
    const intervals: number[] = [];
    for (let i = 1; i < postingTimes.length; i++) {
      intervals.push(postingTimes[i] - postingTimes[i - 1]);
    }

    // Check if intervals are similar (within 20% variance)
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / avgInterval < 0.2 ? avgInterval / (1000 * 60 * 60) : 0; // hours
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }
}