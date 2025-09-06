/**
 * Real-time monitoring example for VEDA Social Graph Agent
 * Demonstrates continuous monitoring and alerting capabilities
 */

import { SocialGraphAgent, defaultConfig } from '../src';
import { SocialPlatform, SocialGraphAgentConfig } from '../src/types';

interface MonitoringConfig {
  query: string;
  platforms: SocialPlatform[];
  timeWindow: number; // minutes
  checkInterval: number; // minutes
  alertThresholds: {
    botScore: number;
    coordinationScore: number;
    viralityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

class RealTimeMonitor {
  private agent: SocialGraphAgent;
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private alertHistory: Array<{
    timestamp: Date;
    type: string;
    severity: string;
    message: string;
    data: any;
  }> = [];

  constructor(agent: SocialGraphAgent, config: MonitoringConfig) {
    this.agent = agent;
    this.config = config;
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Real-time Social Graph Monitoring');
    console.log('==============================================');
    console.log(`📊 Query: "${this.config.query}"`);
    console.log(`📱 Platforms: ${this.config.platforms.join(', ')}`);
    console.log(`⏰ Time Window: ${this.config.timeWindow} minutes`);
    console.log(`🔄 Check Interval: ${this.config.checkInterval} minutes`);
    console.log(`🚨 Alert Thresholds:`);
    console.log(`   Bot Score: ${this.config.alertThresholds.botScore}`);
    console.log(`   Coordination Score: ${this.config.alertThresholds.coordinationScore}`);
    console.log(`   Virality Score: ${this.config.alertThresholds.viralityScore}`);
    console.log(`   Risk Level: ${this.config.alertThresholds.riskLevel}`);
    console.log('');

    this.isRunning = true;

    // Perform initial analysis
    await this.performAnalysis();

    // Set up interval for continuous monitoring
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.performAnalysis();
      }
    }, this.config.checkInterval * 60 * 1000);

    console.log('✅ Monitoring started successfully!');
  }

  stop(): void {
    console.log('🛑 Stopping real-time monitoring...');
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('✅ Monitoring stopped.');
  }

  private async performAnalysis(): Promise<void> {
    const timestamp = new Date();
    console.log(`\n🔍 [${timestamp.toLocaleString()}] Performing analysis...`);

    try {
      const result = await this.agent.analyzeSocialGraph(
        this.config.query,
        this.config.platforms,
        {
          timeWindow: this.config.timeWindow / 60, // Convert to hours
          includeBotDetection: true,
          includeCommunityDetection: true,
          includeViralityAnalysis: true,
          includeCoordinationAnalysis: true,
          includeMisinformationPathways: true
        }
      );

      // Check for alerts
      await this.checkAlerts(result, timestamp);

      // Display summary
      this.displaySummary(result, timestamp);

    } catch (error) {
      console.error(`❌ [${timestamp.toLocaleString()}] Analysis failed:`, error);
      this.addAlert('error', 'critical', 'Analysis failed', { error: error.message });
    }
  }

  private async checkAlerts(result: any, timestamp: Date): Promise<void> {
    // Check bot detection alerts
    const highBotScores = Array.from(result.analysis.botDetection.values())
      .filter((metrics: any) => metrics.botScore > this.config.alertThresholds.botScore);

    if (highBotScores.length > 0) {
      const alertMessage = `Detected ${highBotScores.length} accounts with bot scores above ${this.config.alertThresholds.botScore}`;
      this.addAlert('bot_detection', 'high', alertMessage, {
        count: highBotScores.length,
        threshold: this.config.alertThresholds.botScore,
        accounts: highBotScores.map((m: any) => ({
          userId: m.userId,
          botScore: m.botScore
        }))
      });
    }

    // Check coordination alerts
    const highCoordination = result.analysis.coordinationAnalysis
      .filter((coord: any) => coord.coordinationScore > this.config.alertThresholds.coordinationScore);

    if (highCoordination.length > 0) {
      const alertMessage = `Detected ${highCoordination.length} coordinated groups with scores above ${this.config.alertThresholds.coordinationScore}`;
      this.addAlert('coordination', 'high', alertMessage, {
        count: highCoordination.length,
        threshold: this.config.alertThresholds.coordinationScore,
        groups: highCoordination.map((c: any) => ({
          groupId: c.groupId,
          participants: c.participants.length,
          coordinationScore: c.coordinationScore
        }))
      });
    }

    // Check virality alerts
    const highVirality = Array.from(result.analysis.viralityMetrics.values())
      .filter((metrics: any) => metrics.viralityScore > this.config.alertThresholds.viralityScore);

    if (highVirality.length > 0) {
      const alertMessage = `Detected ${highVirality.length} posts with virality scores above ${this.config.alertThresholds.viralityScore}`;
      this.addAlert('virality', 'medium', alertMessage, {
        count: highVirality.length,
        threshold: this.config.alertThresholds.viralityScore,
        posts: highVirality.map((v: any) => ({
          postId: v.postId,
          viralityScore: v.viralityScore,
          reach: v.reach
        }))
      });
    }

    // Check risk level alerts
    const riskLevels = ['low', 'medium', 'high', 'critical'];
    const currentRiskIndex = riskLevels.indexOf(result.analysis.summary.riskLevel);
    const thresholdRiskIndex = riskLevels.indexOf(this.config.alertThresholds.riskLevel);

    if (currentRiskIndex >= thresholdRiskIndex) {
      const alertMessage = `Risk level elevated to ${result.analysis.summary.riskLevel.toUpperCase()}`;
      this.addAlert('risk_level', 'critical', alertMessage, {
        currentRisk: result.analysis.summary.riskLevel,
        thresholdRisk: this.config.alertThresholds.riskLevel,
        summary: result.analysis.summary
      });
    }

    // Check misinformation pathways
    if (result.analysis.misinformationPathways.length > 0) {
      const alertMessage = `Detected ${result.analysis.misinformationPathways.length} misinformation pathways`;
      this.addAlert('misinformation', 'high', alertMessage, {
        count: result.analysis.misinformationPathways.length,
        pathways: result.analysis.misinformationPathways.map((p: any) => ({
          id: p.id,
          reach: p.reach,
          credibility: p.credibility
        }))
      });
    }
  }

  private addAlert(type: string, severity: string, message: string, data: any): void {
    const alert = {
      timestamp: new Date(),
      type,
      severity,
      message,
      data
    };

    this.alertHistory.push(alert);

    // Display alert
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    console.log(`\n${severityEmoji[severity as keyof typeof severityEmoji]} ALERT [${alert.timestamp.toLocaleString()}]`);
    console.log(`Type: ${type.toUpperCase()}`);
    console.log(`Severity: ${severity.toUpperCase()}`);
    console.log(`Message: ${message}`);
    console.log(`Data:`, JSON.stringify(data, null, 2));
    console.log('');

    // In a real implementation, you would send alerts to:
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - Dashboard updates
    // - Log aggregation systems
  }

  private displaySummary(result: any, timestamp: Date): void {
    console.log(`📊 [${timestamp.toLocaleString()}] Analysis Summary:`);
    console.log(`   👥 Users: ${result.analysis.summary.totalUsers}`);
    console.log(`   📝 Posts: ${result.analysis.summary.totalPosts}`);
    console.log(`   🤖 Suspicious Users: ${result.analysis.summary.suspiciousUsers}`);
    console.log(`   🔥 Viral Posts: ${result.analysis.summary.viralPosts}`);
    console.log(`   👥 Coordinated Groups: ${result.analysis.summary.coordinatedGroups}`);
    console.log(`   ⚠️  Misinformation Pathways: ${result.analysis.summary.misinformationPathways}`);
    console.log(`   🚨 Risk Level: ${result.analysis.summary.riskLevel.toUpperCase()}`);
    console.log(`   ⏱️  Processing Time: ${result.metadata.processingTime}ms`);
  }

  getAlertHistory(): Array<any> {
    return [...this.alertHistory];
  }

  getAlertStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: number; // Last hour
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recent = this.alertHistory.filter(alert => alert.timestamp > oneHourAgo).length;

    const byType = this.alertHistory.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = this.alertHistory.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.alertHistory.length,
      byType,
      bySeverity,
      recent
    };
  }
}

async function realTimeMonitoringExample() {
  console.log('🚀 VEDA Social Graph Agent - Real-time Monitoring Example');
  console.log('=========================================================');

  // Custom configuration for real-time monitoring
  const monitoringConfig: SocialGraphAgentConfig = {
    ...defaultConfig,
    dataFetcher: {
      ...defaultConfig.dataFetcher,
      defaultTimeWindow: 1, // 1 hour
      maxResults: 2000,
      enableCaching: true,
      cacheExpiry: 5 // 5 minutes
    },
    graphBuilder: {
      ...defaultConfig.graphBuilder,
      edgeWeightCalculation: 'temporal',
      timeDecayFactor: 0.3,
      minEdgeWeight: 0.05,
      maxGraphSize: 10000
    },
    networkAnalyzer: {
      ...defaultConfig.networkAnalyzer,
      algorithmConfig: {
        pageRankDamping: 0.85,
        pageRankIterations: 20,
        communityDetectionResolution: 1.0,
        centralityThreshold: 0.1
      },
      enableParallelProcessing: true,
      maxConcurrentAlgorithms: 4
    },
    behaviorDetector: {
      ...defaultConfig.behaviorDetector,
      botDetectionThreshold: 0.6,
      coordinationThreshold: 0.5,
      activityBurstThreshold: 0.4,
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

  // Initialize the agent
  const agent = new SocialGraphAgent(monitoringConfig);

  // Configure monitoring
  const monitorConfig: MonitoringConfig = {
    query: 'election OR voting OR democracy OR politics OR government',
    platforms: [SocialPlatform.TWITTER, SocialPlatform.FACEBOOK],
    timeWindow: 30, // 30 minutes
    checkInterval: 5, // Check every 5 minutes
    alertThresholds: {
      botScore: 0.7,
      coordinationScore: 0.6,
      viralityScore: 0.8,
      riskLevel: 'medium'
    }
  };

  // Create and start the monitor
  const monitor = new RealTimeMonitor(agent, monitorConfig);

  try {
    // Start monitoring
    await monitor.start();

    // Simulate monitoring for a period (in real usage, this would run indefinitely)
    console.log('\n⏰ Simulating 30 minutes of monitoring...');
    
    // In a real implementation, you would let this run continuously
    // For this example, we'll simulate by running a few analysis cycles
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    // Display alert statistics
    const alertStats = monitor.getAlertStats();
    console.log('\n📊 Alert Statistics:');
    console.log('====================');
    console.log(`Total Alerts: ${alertStats.total}`);
    console.log(`Recent Alerts (last hour): ${alertStats.recent}`);
    
    console.log('\nAlerts by Type:');
    Object.entries(alertStats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\nAlerts by Severity:');
    Object.entries(alertStats.bySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });

    // Display recent alerts
    const recentAlerts = monitor.getAlertHistory().slice(-5);
    if (recentAlerts.length > 0) {
      console.log('\n🚨 Recent Alerts:');
      console.log('=================');
      recentAlerts.forEach((alert, index) => {
        console.log(`${index + 1}. [${alert.timestamp.toLocaleString()}] ${alert.type.toUpperCase()}`);
        console.log(`   Severity: ${alert.severity}`);
        console.log(`   Message: ${alert.message}`);
        console.log('');
      });
    }

    // Stop monitoring
    monitor.stop();

    console.log('\n✅ Real-time monitoring example completed!');

  } catch (error) {
    console.error('❌ Error during real-time monitoring:', error);
    monitor.stop();
  }
}

// Run the example
if (require.main === module) {
  realTimeMonitoringExample().catch(console.error);
}

export { RealTimeMonitor, realTimeMonitoringExample };