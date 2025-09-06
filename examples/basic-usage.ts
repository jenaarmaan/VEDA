/**
 * Basic usage example for VEDA Social Graph Agent
 */

import { SocialGraphAgent, defaultConfig } from '../src';
import { SocialPlatform } from '../src/types';

async function basicExample() {
  console.log('🚀 VEDA Social Graph Agent - Basic Usage Example');
  console.log('================================================');

  // Initialize the agent with default configuration
  const agent = new SocialGraphAgent(defaultConfig);

  try {
    // Perform social graph analysis
    console.log('📊 Analyzing social graph for misinformation patterns...');
    
    const result = await agent.analyzeSocialGraph(
      'misinformation OR fake news OR disinformation',
      [SocialPlatform.TWITTER, SocialPlatform.FACEBOOK],
      {
        timeWindow: 24, // Last 24 hours
        includeBotDetection: true,
        includeCommunityDetection: true,
        includeViralityAnalysis: true,
        includeCoordinationAnalysis: true,
        includeMisinformationPathways: true
      }
    );

    // Display results
    console.log('\n📈 Analysis Results:');
    console.log('====================');
    
    console.log(`⏱️  Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`📊 Nodes Processed: ${result.metadata.nodesProcessed}`);
    console.log(`🔗 Edges Processed: ${result.metadata.edgesProcessed}`);
    console.log(`🧮 Algorithms Used: ${result.metadata.algorithmsUsed.join(', ')}`);

    console.log('\n🎯 Summary:');
    console.log('===========');
    console.log(`👥 Total Users: ${result.analysis.summary.totalUsers}`);
    console.log(`📝 Total Posts: ${result.analysis.summary.totalPosts}`);
    console.log(`🤖 Suspicious Users: ${result.analysis.summary.suspiciousUsers}`);
    console.log(`🔥 Viral Posts: ${result.analysis.summary.viralPosts}`);
    console.log(`👥 Coordinated Groups: ${result.analysis.summary.coordinatedGroups}`);
    console.log(`⚠️  Misinformation Pathways: ${result.analysis.summary.misinformationPathways}`);
    console.log(`🚨 Risk Level: ${result.analysis.summary.riskLevel.toUpperCase()}`);

    console.log('\n🔍 Key Findings:');
    console.log('================');
    result.analysis.summary.keyFindings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding}`);
    });

    console.log('\n💡 Recommendations:');
    console.log('===================');
    result.analysis.summary.recommendations.forEach((recommendation, index) => {
      console.log(`${index + 1}. ${recommendation}`);
    });

    console.log('\n🤖 Bot Detection Results:');
    console.log('=========================');
    const botUsers = Array.from(result.analysis.botDetection.values())
      .filter(metrics => metrics.botScore > 0.7)
      .sort((a, b) => b.botScore - a.botScore);

    if (botUsers.length > 0) {
      botUsers.slice(0, 5).forEach((metrics, index) => {
        console.log(`${index + 1}. User ${metrics.userId}:`);
        console.log(`   Bot Score: ${(metrics.botScore * 100).toFixed(1)}%`);
        console.log(`   Activity Bursts: ${metrics.activityBursts.toFixed(2)}`);
        console.log(`   Posting Frequency: ${metrics.postingFrequency.toFixed(2)} posts/hour`);
        console.log(`   Follower Ratio: ${metrics.followerRatio.toFixed(2)}`);
        console.log(`   Content Similarity: ${(metrics.contentSimilarity * 100).toFixed(1)}%`);
        console.log(`   Suspicious Patterns: ${metrics.suspiciousPatterns.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('No high-confidence bot accounts detected.');
    }

    console.log('\n👥 Community Analysis:');
    console.log('======================');
    const suspiciousCommunities = result.analysis.communities
      .filter(community => community.suspiciousScore > 0.5)
      .sort((a, b) => b.suspiciousScore - a.suspiciousScore);

    if (suspiciousCommunities.length > 0) {
      suspiciousCommunities.slice(0, 3).forEach((community, index) => {
        console.log(`${index + 1}. Community ${community.id}:`);
        console.log(`   Size: ${community.size} nodes`);
        console.log(`   Suspicious Score: ${(community.suspiciousScore * 100).toFixed(1)}%`);
        console.log(`   Density: ${(community.density * 100).toFixed(1)}%`);
        console.log(`   Modularity: ${community.modularity.toFixed(3)}`);
        console.log('');
      });
    } else {
      console.log('No highly suspicious communities detected.');
    }

    console.log('\n🔥 Viral Content Analysis:');
    console.log('==========================');
    const viralPosts = Array.from(result.analysis.viralityMetrics.values())
      .filter(metrics => metrics.viralityScore > 0.5)
      .sort((a, b) => b.viralityScore - a.viralityScore);

    if (viralPosts.length > 0) {
      viralPosts.slice(0, 3).forEach((metrics, index) => {
        console.log(`${index + 1}. Post ${metrics.postId}:`);
        console.log(`   Virality Score: ${(metrics.viralityScore * 100).toFixed(1)}%`);
        console.log(`   Reach: ${metrics.reach} users`);
        console.log(`   Engagement: ${metrics.engagement} interactions`);
        console.log(`   Velocity: ${metrics.velocity.toFixed(2)} interactions/hour`);
        console.log(`   Amplification: ${metrics.amplification.toFixed(2)}`);
        console.log(`   Cascade Depth: ${metrics.cascadeDepth}`);
        console.log('');
      });
    } else {
      console.log('No highly viral content detected.');
    }

    console.log('\n⚠️  Misinformation Pathways:');
    console.log('============================');
    if (result.analysis.misinformationPathways.length > 0) {
      result.analysis.misinformationPathways.slice(0, 3).forEach((pathway, index) => {
        console.log(`${index + 1}. Pathway ${pathway.id}:`);
        console.log(`   Source Post: ${pathway.sourcePost}`);
        console.log(`   Reach: ${pathway.reach} nodes`);
        console.log(`   Velocity: ${pathway.velocity.toFixed(2)} nodes/hour`);
        console.log(`   Credibility: ${(pathway.credibility * 100).toFixed(1)}%`);
        console.log(`   Key Nodes: ${pathway.keyNodes.length}`);
        console.log(`   Intervention Points: ${pathway.interventionPoints.length}`);
        
        if (pathway.interventionPoints.length > 0) {
          console.log('   High Priority Interventions:');
          pathway.interventionPoints
            .filter(ip => ip.priority === 'high' || ip.priority === 'critical')
            .slice(0, 2)
            .forEach(ip => {
              console.log(`     - ${ip.nodeId} (${ip.priority}): ${ip.reason}`);
            });
        }
        console.log('');
      });
    } else {
      console.log('No misinformation pathways detected.');
    }

    console.log('\n🚩 Flagged Accounts:');
    console.log('====================');
    if (result.flaggedAccounts.length > 0) {
      result.flaggedAccounts.slice(0, 10).forEach((accountId, index) => {
        console.log(`${index + 1}. ${accountId}`);
      });
      if (result.flaggedAccounts.length > 10) {
        console.log(`... and ${result.flaggedAccounts.length - 10} more`);
      }
    } else {
      console.log('No accounts flagged for suspicious behavior.');
    }

    console.log('\n✅ Analysis completed successfully!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

export { basicExample };