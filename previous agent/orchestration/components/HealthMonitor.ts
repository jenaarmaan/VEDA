/**
 * HealthMonitor - Tracks agent availability, performance, and errors
 * Provides real-time monitoring and alerting for agent health
 */

import { 
  AgentHealth,
  SpecializedAgent,
  VerificationRequest,
  AgentResponse
} from '../types';
import { agentRegistry } from '../agents';

export interface HealthMetrics {
  agentId: string;
  timestamp: number;
  responseTime: number;
  success: boolean;
  error?: string;
  confidence?: number;
  processingTime?: number;
}

export interface HealthAlert {
  id: string;
  agentId: string;
  type: 'performance' | 'availability' | 'error_rate' | 'response_time';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface HealthConfig {
  checkInterval: number;
  responseTimeThreshold: number;
  errorRateThreshold: number;
  availabilityThreshold: number;
  alertCooldown: number;
  maxHistorySize: number;
  enableAlerts: boolean;
}

export interface HealthStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  averageConfidence: number;
  uptime: number;
  lastCheck: number;
  healthScore: number;
}

export class HealthMonitor {
  private config: HealthConfig;
  private healthHistory: Map<string, HealthMetrics[]> = new Map();
  private agentStats: Map<string, HealthStats> = new Map();
  private alerts: Map<string, HealthAlert> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: ((alert: HealthAlert) => void)[] = [];

  constructor(config?: Partial<HealthConfig>) {
    this.config = {
      checkInterval: 60000, // 1 minute
      responseTimeThreshold: 10000, // 10 seconds
      errorRateThreshold: 0.2, // 20%
      availabilityThreshold: 0.95, // 95%
      alertCooldown: 300000, // 5 minutes
      maxHistorySize: 1000,
      enableAlerts: true,
      ...config
    };

    this.startMonitoring();
  }

  /**
   * Record a health metric for an agent
   */
  recordMetric(metric: HealthMetrics): void {
    const agentId = metric.agentId;
    
    // Initialize history if needed
    if (!this.healthHistory.has(agentId)) {
      this.healthHistory.set(agentId, []);
    }

    const history = this.healthHistory.get(agentId)!;
    history.push(metric);

    // Maintain history size limit
    if (history.length > this.config.maxHistorySize) {
      history.splice(0, history.length - this.config.maxHistorySize);
    }

    // Update agent stats
    this.updateAgentStats(agentId, metric);

    // Check for health issues
    this.checkHealthIssues(agentId);
  }

  /**
   * Get current health status for an agent
   */
  async getAgentHealth(agentId: string): Promise<AgentHealth> {
    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      return {
        agentId,
        status: 'unknown',
        responseTime: 0,
        successRate: 0,
        lastCheck: Date.now(),
        errorCount: 0,
        totalRequests: 0
      };
    }

    try {
      const startTime = Date.now();
      const isAvailable = await agent.isAvailable();
      const responseTime = Date.now() - startTime;

      const stats = this.agentStats.get(agentId);
      const successRate = stats ? stats.successfulRequests / stats.totalRequests : 0;
      const errorCount = stats ? stats.failedRequests : 0;
      const totalRequests = stats ? stats.totalRequests : 0;

      const status = this.determineHealthStatus(successRate, responseTime, isAvailable);

      return {
        agentId,
        status,
        responseTime,
        successRate,
        lastCheck: Date.now(),
        errorCount,
        totalRequests
      };
    } catch (error) {
      return {
        agentId,
        status: 'unhealthy',
        responseTime: 0,
        successRate: 0,
        lastCheck: Date.now(),
        errorCount: 1,
        totalRequests: 0
      };
    }
  }

  /**
   * Get health status for all agents
   */
  async getAllAgentHealth(): Promise<Map<string, AgentHealth>> {
    const healthMap = new Map<string, AgentHealth>();
    const agents = agentRegistry.getAllAgents();

    const healthPromises = agents.map(async (agent) => {
      const health = await this.getAgentHealth(agent.agentId);
      healthMap.set(agent.agentId, health);
    });

    await Promise.allSettled(healthPromises);
    return healthMap;
  }

  /**
   * Get health statistics for an agent
   */
  getAgentStats(agentId: string): HealthStats | null {
    return this.agentStats.get(agentId) || null;
  }

  /**
   * Get all health alerts
   */
  getAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get active alerts for an agent
   */
  getAgentAlerts(agentId: string): HealthAlert[] {
    return this.getAlerts().filter(alert => 
      alert.agentId === agentId && !alert.resolved
    );
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Subscribe to health alerts
   */
  onAlert(callback: (alert: HealthAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Unsubscribe from health alerts
   */
  offAlert(callback: (alert: HealthAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  private updateAgentStats(agentId: string, metric: HealthMetrics): void {
    let stats = this.agentStats.get(agentId);
    if (!stats) {
      stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        averageConfidence: 0,
        uptime: 0,
        lastCheck: Date.now(),
        healthScore: 1.0
      };
      this.agentStats.set(agentId, stats);
    }

    // Update counters
    stats.totalRequests++;
    if (metric.success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // Update averages
    stats.averageResponseTime = this.calculateMovingAverage(
      stats.averageResponseTime,
      metric.responseTime,
      stats.totalRequests
    );

    if (metric.confidence !== undefined) {
      stats.averageConfidence = this.calculateMovingAverage(
        stats.averageConfidence,
        metric.confidence,
        stats.totalRequests
      );
    }

    // Update uptime
    stats.uptime = stats.successfulRequests / stats.totalRequests;

    // Update health score
    stats.healthScore = this.calculateHealthScore(stats);

    stats.lastCheck = Date.now();
  }

  private calculateMovingAverage(current: number, newValue: number, count: number): number {
    return (current * (count - 1) + newValue) / count;
  }

  private calculateHealthScore(stats: HealthStats): number {
    const responseTimeScore = Math.max(0, 1 - (stats.averageResponseTime / this.config.responseTimeThreshold));
    const uptimeScore = stats.uptime;
    const confidenceScore = stats.averageConfidence;

    return (responseTimeScore * 0.3 + uptimeScore * 0.5 + confidenceScore * 0.2);
  }

  private determineHealthStatus(successRate: number, responseTime: number, isAvailable: boolean): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    if (!isAvailable) {
      return 'unhealthy';
    }

    if (successRate < this.config.availabilityThreshold) {
      return 'unhealthy';
    }

    if (responseTime > this.config.responseTimeThreshold || successRate < 0.98) {
      return 'degraded';
    }

    return 'healthy';
  }

  private checkHealthIssues(agentId: string): void {
    if (!this.config.enableAlerts) return;

    const stats = this.agentStats.get(agentId);
    if (!stats) return;

    const history = this.healthHistory.get(agentId) || [];
    const recentHistory = history.slice(-10); // Last 10 metrics

    // Check response time
    if (stats.averageResponseTime > this.config.responseTimeThreshold) {
      this.createAlert(agentId, 'response_time', 'high', 
        `Agent ${agentId} has high response time: ${Math.round(stats.averageResponseTime)}ms`);
    }

    // Check error rate
    const errorRate = stats.failedRequests / stats.totalRequests;
    if (errorRate > this.config.errorRateThreshold) {
      this.createAlert(agentId, 'error_rate', 'high',
        `Agent ${agentId} has high error rate: ${Math.round(errorRate * 100)}%`);
    }

    // Check availability
    if (stats.uptime < this.config.availabilityThreshold) {
      this.createAlert(agentId, 'availability', 'critical',
        `Agent ${agentId} has low availability: ${Math.round(stats.uptime * 100)}%`);
    }

    // Check for consecutive failures
    const consecutiveFailures = this.countConsecutiveFailures(recentHistory);
    if (consecutiveFailures >= 3) {
      this.createAlert(agentId, 'performance', 'critical',
        `Agent ${agentId} has ${consecutiveFailures} consecutive failures`);
    }
  }

  private countConsecutiveFailures(history: HealthMetrics[]): number {
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (!history[i].success) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private createAlert(agentId: string, type: HealthAlert['type'], severity: HealthAlert['severity'], message: string): void {
    const alertId = `${agentId}-${type}-${Date.now()}`;
    
    // Check if similar alert already exists and is not resolved
    const existingAlert = Array.from(this.alerts.values()).find(alert => 
      alert.agentId === agentId && 
      alert.type === type && 
      !alert.resolved &&
      (Date.now() - alert.timestamp) < this.config.alertCooldown
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: HealthAlert = {
      id: alertId,
      agentId,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(alertId, alert);

    // Notify subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  private startMonitoring(): void {
    this.checkInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.checkInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const agents = agentRegistry.getAllAgents();
    
    for (const agent of agents) {
      try {
        const startTime = Date.now();
        const isAvailable = await agent.isAvailable();
        const responseTime = Date.now() - startTime;

        const metric: HealthMetrics = {
          agentId: agent.agentId,
          timestamp: Date.now(),
          responseTime,
          success: isAvailable
        };

        this.recordMetric(metric);
      } catch (error) {
        const metric: HealthMetrics = {
          agentId: agent.agentId,
          timestamp: Date.now(),
          responseTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        this.recordMetric(metric);
      }
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    healthyAgents: number;
    totalAgents: number;
    activeAlerts: number;
    averageHealthScore: number;
  } {
    const agents = agentRegistry.getAllAgents();
    const healthyAgents = agents.filter(agent => {
      const stats = this.agentStats.get(agent.agentId);
      return stats && stats.healthScore > 0.7;
    }).length;

    const activeAlerts = this.getAlerts().filter(alert => !alert.resolved).length;
    
    const healthScores = Array.from(this.agentStats.values()).map(stats => stats.healthScore);
    const averageHealthScore = healthScores.length > 0 
      ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length 
      : 0;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (averageHealthScore < 0.5 || activeAlerts > 2) {
      overallStatus = 'unhealthy';
    } else if (averageHealthScore < 0.8 || activeAlerts > 0) {
      overallStatus = 'degraded';
    }

    return {
      overallStatus,
      healthyAgents,
      totalAgents: agents.length,
      activeAlerts,
      averageHealthScore
    };
  }

  /**
   * Clean up old data
   */
  cleanup(maxAge: number = 86400000): void { // 24 hours default
    const cutoff = Date.now() - maxAge;

    // Clean up old metrics
    for (const [agentId, history] of this.healthHistory) {
      const filtered = history.filter(metric => metric.timestamp > cutoff);
      this.healthHistory.set(agentId, filtered);
    }

    // Clean up old alerts
    for (const [alertId, alert] of this.alerts) {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.alerts.delete(alertId);
      }
    }
  }

  /**
   * Stop monitoring
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HealthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if interval changed
    if (newConfig.checkInterval) {
      this.destroy();
      this.startMonitoring();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): HealthConfig {
    return { ...this.config };
  }
}
