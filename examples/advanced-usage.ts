/**
 * Advanced usage example for VEDA Social Graph Agent
 * Demonstrates custom configuration, real-time monitoring, and detailed analysis
 */

import { SocialGraphAgent, defaultConfig } from '../src';
import { SocialPlatform, SocialGraphAgentConfig } from '../src/types';

async function advancedExample() {
  console.log('🚀 VEDA Social Graph Agent - Advanced Usage Example');
  console.log('===================================================');

  // Custom configuration for advanced analysis
  const customConfig: SocialGraphAgentConfig = {
    ...defaultConfig,
    dataFetcher: {
      ...defaultConfig.dataFetcher,
      defaultTimeWindow: 48, // 48 hours
      maxResults: 5000,
      enableCaching: true,
      cacheExpiry: 30 // 30 minutes
    },
    graphBuilder: {
      ...defaultConfig.graphBuilder,
      edgeWeightCalculation: 'temporal',
      timeDecayFactor: 0.2,
      minEdgeWeight: 0.05,
      maxGraphSize: 50000
    },
    networkAnalyzer: {
      ...defaultConfig.networkAnalyzer,
      algorithmConfig: {
        pageRankDamping: 0.9,
        pageRankIterations: 50,
        communityDetectionResolution: 0.8,
        centralityThreshold: 0.05
      },
      enableParallelProcessing: true,
      maxConcurrentAlgorithms: 8
    },
    behaviorDetector: {
      ...defaultConfig.behaviorDetector,
      botDetectionThreshold: 0.6,
      coordinationThreshold: 0.5,
      activityBurstThreshold: 0.3,
      contentSimilarityThreshold: 0.7,
      networkReciprocityThreshold: 0.2,
      enableMachineLearning: false
    },
    analysisOptions: {
      includeBotDetection: true,
      includeCommunityDetection: true,
      includeViralityAnalysis: true,
      includeCoordinationAnalysis: true,
      includeMisinformationPathways: true
    },
    outputFormat: 'json',
    enableLogging: true,
    logLevel: 'info'
  };

  // Initialize the agent with custom configuration
  const agent = new SocialGraphAgent(customConfig);

  try {
    console.log('🔧 Using custom configuration for enhanced analysis...');
    console.log(`📊 Max Graph Size: ${customConfig.graphBuilder.maxGraphSize}`);
    console.log(`⏰ Time Window: ${customConfig.dataFetcher.defaultTimeWindow} hours`);
    console.log(`🤖 Bot Detection Threshold: ${customConfig.behaviorDetector.botDetectionThreshold}`);

    // Perform comprehensive analysis
    console.log('\n📊 Performing comprehensive social graph analysis...');
    
    const result = await agent.analyzeSocialGraph(
      'election OR voting OR democracy OR politics',
      [SocialPlatform.TWITTER, SocialPlatform.FACEBOOK],
      {
        timeWindow: 48,
        includeBotDetection: true,
        includeCommunityDetection: true,
        includeViralityAnalysis: true,
        includeCoordinationAnalysis: true,
        includeMisinformationPathways: true,
        minEngagement: 5,
        maxNodes: 10000
      }
    );

    // Detailed analysis results
    console.log('\n📈 Detailed Analysis Results:');
    console.log('==============================');
    
    console.log(`⏱️  Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`📊 Nodes Processed: ${result.metadata.nodesProcessed}`);
    console.log(`🔗 Edges Processed: ${result.metadata.edgesProcessed}`);
    console.log(`🧮 Algorithms Used: ${result.metadata.algorithmsUsed.join(', ')}`);

    // Network topology analysis
    console.log('\n🌐 Network Topology Analysis:');
    console.log('=============================');
    
    const graphStats = result.propagationGraph.metadata;
    console.log(`📊 Total Nodes: ${graphStats.totalNodes}`);
    console.log(`🔗 Total Edges: ${graphStats.totalEdges}`);
    console.log(`📱 Platforms: ${graphStats.platforms.join(', ')}`);
    console.log(`⏰ Time Range: ${new Date(graphStats.timeRange.start).toLocaleString()} - ${new Date(graphStats.timeRange.end).toLocaleString()}`);

    // Node type distribution
    const nodeTypes = result.propagationGraph.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Node Type Distribution:');
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} (${((count / graphStats.totalNodes) * 100).toFixed(1)}%)`);
    });

    // Edge type distribution
    const edgeTypes = result.propagationGraph.edges.reduce((acc, edge) => {
      acc[edge.type] = (acc[edge.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🔗 Edge Type Distribution:');
    Object.entries(edgeTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} (${((count / graphStats.totalEdges) * 100).toFixed(1)}%)`);
    });

    // Centrality analysis
    console.log('\n🎯 Centrality Analysis:');
    console.log('=======================');
    
    const centralityMetrics = Array.from(result.analysis.networkMetrics.values());
    
    // Top nodes by PageRank
    const topPageRank = centralityMetrics
      .sort((a, b) => b.pageRank - a.pageRank)
      .slice(0, 5);

    console.log('\n📈 Top 5 Nodes by PageRank:');
    topPageRank.forEach((metrics, index) => {
      console.log(`${index + 1}. ${metrics.nodeId}: ${metrics.pageRank.toFixed(4)}`);
    });

    // Top nodes by Betweenness Centrality
    const topBetweenness = centralityMetrics
      .sort((a, b) => b.betweennessCentrality - a.betweennessCentrality)
      .slice(0, 5);

    console.log('\n🔗 Top 5 Nodes by Betweenness Centrality:');
    topBetweenness.forEach((metrics, index) => {
      console.log(`${index + 1}. ${metrics.nodeId}: ${metrics.betweennessCentrality.toFixed(4)}`);
    });

    // Community structure analysis
    console.log('\n👥 Community Structure Analysis:');
    console.log('=================================');
    
    const communities = result.analysis.communities;
    console.log(`📊 Total Communities: ${communities.length}`);
    
    if (communities.length > 0) {
      const communitySizes = communities.map(c => c.size);
      const avgSize = communitySizes.reduce((sum, size) => sum + size, 0) / communitySizes.length;
      const maxSize = Math.max(...communitySizes);
      const minSize = Math.min(...communitySizes);

      console.log(`📏 Community Size - Avg: ${avgSize.toFixed(1)}, Max: ${maxSize}, Min: ${minSize}`);

      // Community modularity distribution
      const modularities = communities.map(c => c.modularity);
      const avgModularity = modularities.reduce((sum, mod) => sum + mod, 0) / modularities.length;
      console.log(`🔧 Average Modularity: ${avgModularity.toFixed(3)}`);

      // Suspicious communities
      const suspiciousCommunities = communities.filter(c => c.suspiciousScore > 0.7);
      console.log(`🚨 Highly Suspicious Communities: ${suspiciousCommunities.length}`);

      if (suspiciousCommunities.length > 0) {
        console.log('\n🚨 Top Suspicious Communities:');
        suspiciousCommunities
          .sort((a, b) => b.suspiciousScore - a.suspiciousScore)
          .slice(0, 3)
          .forEach((community, index) => {
            console.log(`${index + 1}. ${community.id}:`);
            console.log(`   Size: ${community.size} nodes`);
            console.log(`   Suspicious Score: ${(community.suspiciousScore * 100).toFixed(1)}%`);
            console.log(`   Density: ${(community.density * 100).toFixed(1)}%`);
            console.log(`   Modularity: ${community.modularity.toFixed(3)}`);
            console.log(`   Avg Clustering: ${(community.averageClustering * 100).toFixed(1)}%`);
          });
      }
    }

    // Bot detection detailed analysis
    console.log('\n🤖 Bot Detection Detailed Analysis:');
    console.log('====================================');
    
    const botMetrics = Array.from(result.analysis.botDetection.values());
    const botScores = botMetrics.map(m => m.botScore);
    const avgBotScore = botScores.reduce((sum, score) => sum + score, 0) / botScores.length;
    const maxBotScore = Math.max(...botScores);

    console.log(`📊 Total Users Analyzed: ${botMetrics.length}`);
    console.log(`📈 Average Bot Score: ${(avgBotScore * 100).toFixed(1)}%`);
    console.log(`📈 Maximum Bot Score: ${(maxBotScore * 100).toFixed(1)}%`);

    // Bot score distribution
    const botScoreRanges = {
      'Low (0-0.3)': botScores.filter(s => s >= 0 && s < 0.3).length,
      'Medium (0.3-0.7)': botScores.filter(s => s >= 0.3 && s < 0.7).length,
      'High (0.7-1.0)': botScores.filter(s => s >= 0.7 && s <= 1.0).length
    };

    console.log('\n📊 Bot Score Distribution:');
    Object.entries(botScoreRanges).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} users (${((count / botMetrics.length) * 100).toFixed(1)}%)`);
    });

    // Top bot indicators
    const highBotScores = botMetrics.filter(m => m.botScore > 0.7);
    if (highBotScores.length > 0) {
      console.log('\n🚨 Top Bot Indicators:');
      highBotScores
        .sort((a, b) => b.botScore - a.botScore)
        .slice(0, 5)
        .forEach((metrics, index) => {
          console.log(`${index + 1}. User ${metrics.userId}:`);
          console.log(`   Bot Score: ${(metrics.botScore * 100).toFixed(1)}%`);
          console.log(`   Activity Bursts: ${metrics.activityBursts.toFixed(2)}`);
          console.log(`   Posting Frequency: ${metrics.postingFrequency.toFixed(2)} posts/hour`);
          console.log(`   Follower Ratio: ${metrics.followerRatio.toFixed(2)}`);
          console.log(`   Content Similarity: ${(metrics.contentSimilarity * 100).toFixed(1)}%`);
          console.log(`   Network Reciprocity: ${(metrics.networkReciprocity * 100).toFixed(1)}%`);
          console.log(`   Account Age: ${metrics.accountAge.toFixed(0)} days`);
          console.log(`   Verification: ${metrics.verificationStatus ? 'Yes' : 'No'}`);
          console.log(`   Patterns: ${metrics.suspiciousPatterns.join(', ')}`);
          console.log('');
        });
    }

    // Coordination analysis
    console.log('\n👥 Coordination Analysis:');
    console.log('=========================');
    
    const coordinationGroups = result.analysis.coordinationAnalysis;
    console.log(`📊 Total Coordinated Groups: ${coordinationGroups.length}`);

    if (coordinationGroups.length > 0) {
      const coordinationScores = coordinationGroups.map(c => c.coordinationScore);
      const avgCoordinationScore = coordinationScores.reduce((sum, score) => sum + score, 0) / coordinationScores.length;

      console.log(`📈 Average Coordination Score: ${(avgCoordinationScore * 100).toFixed(1)}%`);

      console.log('\n🚨 Top Coordinated Groups:');
      coordinationGroups
        .sort((a, b) => b.coordinationScore - a.coordinationScore)
        .slice(0, 3)
        .forEach((group, index) => {
          console.log(`${index + 1}. Group ${group.groupId}:`);
          console.log(`   Participants: ${group.participants.length}`);
          console.log(`   Coordination Score: ${(group.coordinationScore * 100).toFixed(1)}%`);
          console.log(`   Synchronized Activity: ${group.synchronizedActivity ? 'Yes' : 'No'}`);
          console.log(`   Content Similarity: ${(group.contentSimilarity * 100).toFixed(1)}%`);
          console.log(`   Network Overlap: ${(group.networkOverlap * 100).toFixed(1)}%`);
          console.log(`   Temporal Patterns: ${group.temporalPatterns.length}`);
          console.log(`   Suspicious Behaviors: ${group.suspiciousBehaviors.join(', ')}`);
          console.log('');
        });
    }

    // Virality analysis
    console.log('\n🔥 Virality Analysis:');
    console.log('=====================');
    
    const viralityMetrics = Array.from(result.analysis.viralityMetrics.values());
    console.log(`📊 Total Posts Analyzed: ${viralityMetrics.length}`);

    if (viralityMetrics.length > 0) {
      const viralityScores = viralityMetrics.map(v => v.viralityScore);
      const avgViralityScore = viralityScores.reduce((sum, score) => sum + score, 0) / viralityScores.length;
      const maxViralityScore = Math.max(...viralityScores);

      console.log(`📈 Average Virality Score: ${(avgViralityScore * 100).toFixed(1)}%`);
      console.log(`📈 Maximum Virality Score: ${(maxViralityScore * 100).toFixed(1)}%`);

      // Virality distribution
      const viralityRanges = {
        'Low (0-0.3)': viralityScores.filter(s => s >= 0 && s < 0.3).length,
        'Medium (0.3-0.7)': viralityScores.filter(s => s >= 0.3 && s < 0.7).length,
        'High (0.7-1.0)': viralityScores.filter(s => s >= 0.7 && s <= 1.0).length
      };

      console.log('\n📊 Virality Score Distribution:');
      Object.entries(viralityRanges).forEach(([range, count]) => {
        console.log(`   ${range}: ${count} posts (${((count / viralityMetrics.length) * 100).toFixed(1)}%)`);
      });

      // Top viral posts
      const topViralPosts = viralityMetrics
        .sort((a, b) => b.viralityScore - a.viralityScore)
        .slice(0, 3);

      console.log('\n🔥 Top Viral Posts:');
      topViralPosts.forEach((metrics, index) => {
        console.log(`${index + 1}. Post ${metrics.postId}:`);
        console.log(`   Virality Score: ${(metrics.viralityScore * 100).toFixed(1)}%`);
        console.log(`   Reach: ${metrics.reach} users`);
        console.log(`   Engagement: ${metrics.engagement} interactions`);
        console.log(`   Velocity: ${metrics.velocity.toFixed(2)} interactions/hour`);
        console.log(`   Amplification: ${metrics.amplification.toFixed(2)}`);
        console.log(`   Cascade Depth: ${metrics.cascadeDepth}`);
        console.log(`   Unique Users: ${metrics.uniqueUsers}`);
        console.log(`   Time to Viral: ${metrics.timeToViral.toFixed(0)} minutes`);
        console.log(`   Peak Activity: ${metrics.peakActivity.toLocaleString()}`);
        console.log('');
      });
    }

    // Misinformation pathways analysis
    console.log('\n⚠️  Misinformation Pathways Analysis:');
    console.log('=====================================');
    
    const pathways = result.analysis.misinformationPathways;
    console.log(`📊 Total Misinformation Pathways: ${pathways.length}`);

    if (pathways.length > 0) {
      const pathwayReaches = pathways.map(p => p.reach);
      const avgReach = pathwayReaches.reduce((sum, reach) => sum + reach, 0) / pathwayReaches.length;
      const maxReach = Math.max(...pathwayReaches);

      console.log(`📈 Average Reach: ${avgReach.toFixed(1)} nodes`);
      console.log(`📈 Maximum Reach: ${maxReach} nodes`);

      const pathwayVelocities = pathways.map(p => p.velocity);
      const avgVelocity = pathwayVelocities.reduce((sum, vel) => sum + vel, 0) / pathwayVelocities.length;

      console.log(`📈 Average Velocity: ${avgVelocity.toFixed(2)} nodes/hour`);

      const pathwayCredibilities = pathways.map(p => p.credibility);
      const avgCredibility = pathwayCredibilities.reduce((sum, cred) => sum + cred, 0) / pathwayCredibilities.length;

      console.log(`📈 Average Credibility: ${(avgCredibility * 100).toFixed(1)}%`);

      console.log('\n🚨 Top Misinformation Pathways:');
      pathways
        .sort((a, b) => b.reach - a.reach)
        .slice(0, 3)
        .forEach((pathway, index) => {
          console.log(`${index + 1}. Pathway ${pathway.id}:`);
          console.log(`   Source Post: ${pathway.sourcePost}`);
          console.log(`   Reach: ${pathway.reach} nodes`);
          console.log(`   Velocity: ${pathway.velocity.toFixed(2)} nodes/hour`);
          console.log(`   Credibility: ${(pathway.credibility * 100).toFixed(1)}%`);
          console.log(`   Key Nodes: ${pathway.keyNodes.length}`);
          console.log(`   Amplification Points: ${pathway.amplificationPoints.length}`);
          console.log(`   Intervention Points: ${pathway.interventionPoints.length}`);
          
          if (pathway.interventionPoints.length > 0) {
            console.log('   High Priority Interventions:');
            pathway.interventionPoints
              .filter(ip => ip.priority === 'high' || ip.priority === 'critical')
              .slice(0, 3)
              .forEach(ip => {
                console.log(`     - ${ip.nodeId} (${ip.priority}): ${ip.reason}`);
                console.log(`       Action: ${ip.suggestedAction}`);
                console.log(`       Impact: ${ip.impact.toFixed(2)}`);
              });
          }
          console.log('');
        });
    }

    // Risk assessment
    console.log('\n🚨 Risk Assessment:');
    console.log('===================');
    
    const riskLevel = result.analysis.summary.riskLevel;
    const riskEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    console.log(`${riskEmoji[riskLevel]} Risk Level: ${riskLevel.toUpperCase()}`);

    // Risk factors
    const riskFactors = [];
    if (result.analysis.summary.suspiciousUsers > result.analysis.summary.totalUsers * 0.1) {
      riskFactors.push('High percentage of suspicious users');
    }
    if (result.analysis.summary.coordinatedGroups > 3) {
      riskFactors.push('Multiple coordinated groups detected');
    }
    if (result.analysis.summary.misinformationPathways > 2) {
      riskFactors.push('Multiple misinformation pathways identified');
    }
    if (result.analysis.summary.viralPosts > result.analysis.summary.totalPosts * 0.1) {
      riskFactors.push('High percentage of viral content');
    }

    if (riskFactors.length > 0) {
      console.log('\n⚠️  Risk Factors:');
      riskFactors.forEach((factor, index) => {
        console.log(`${index + 1}. ${factor}`);
      });
    }

    // Actionable recommendations
    console.log('\n💡 Actionable Recommendations:');
    console.log('===============================');
    
    const recommendations = result.analysis.summary.recommendations;
    if (recommendations.length > 0) {
      recommendations.forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`);
      });
    } else {
      console.log('No specific recommendations at this time.');
    }

    // Export options
    console.log('\n📁 Export Options:');
    console.log('==================');
    console.log('The analysis results can be exported in the following formats:');
    console.log('• JSON: Complete analysis data');
    console.log('• GraphML: Network structure for visualization');
    console.log('• GEXF: Network data for Gephi');
    console.log('• CSV: Tabular data for further analysis');

    console.log('\n✅ Advanced analysis completed successfully!');

  } catch (error) {
    console.error('❌ Error during advanced analysis:', error);
  }
}

// Run the example
if (require.main === module) {
  advancedExample().catch(console.error);
}

export { advancedExample };