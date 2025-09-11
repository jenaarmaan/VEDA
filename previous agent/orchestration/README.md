# VEDA Orchestration Agent

The VEDA Orchestration Agent is a sophisticated system for coordinating multiple specialized AI agents to provide comprehensive misinformation verification. It acts as the central controller, routing verification requests, managing workflows, aggregating results, and producing unified reports.

## Overview

The orchestration system coordinates five specialized agents:
- **Content Analysis Agent**: Analyzes content patterns, sentiment, and linguistic features
- **Source Forensics Agent**: Verifies source credibility and authenticity
- **Multilingual Agent**: Handles content in multiple languages
- **Social Graph Agent**: Analyzes social media patterns and viral potential
- **Educational Content Agent**: Validates educational accuracy and scientific claims

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OrchestrationAgent                       │
├─────────────────────────────────────────────────────────────┤
│  RequestRouter  │  WorkflowManager  │  ResultAggregator     │
│  DecisionEngine │  ReportUnifier    │  HealthMonitor        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Specialized Agents                       │
├─────────────────────────────────────────────────────────────┤
│ Content Analysis │ Source Forensics │ Multilingual          │
│ Social Graph     │ Educational      │ (Your Custom Agents)  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```typescript
import { orchestrationAgent } from './orchestration';

// Verify content
const result = await orchestrationAgent.verifyContent(
  'Scientists discover new planet with potential for life',
  'news_article',
  {
    source: 'reuters.com',
    language: 'en',
    platform: 'news'
  },
  'high'
);

if (result.success) {
  console.log('Verdict:', result.report?.finalVerdict);
  console.log('Confidence:', result.report?.confidence);
  console.log('Summary:', result.report?.summary);
} else {
  console.error('Verification failed:', result.error);
}
```

### Advanced Configuration

```typescript
import { OrchestrationAgent } from './orchestration';

const customAgent = new OrchestrationAgent({
  defaultTimeout: 30000,
  maxRetries: 3,
  parallelExecution: true,
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour
  agentWeights: {
    'content-analysis': 1.0,
    'source-forensics': 1.2,
    'multilingual': 0.8,
    'social-graph': 0.9,
    'educational-content': 0.7
  },
  confidenceThresholds: {
    high: 0.8,
    medium: 0.6,
    low: 0.4
  }
});
```

## Core Components

### 1. RequestRouter

Determines which agents should analyze the content based on content type and metadata.

```typescript
import { RequestRouter } from './orchestration';

const router = new RequestRouter();
const decision = await router.routeRequest(request);

console.log('Selected agents:', decision.selectedAgents);
console.log('Execution order:', decision.executionOrder);
console.log('Estimated time:', decision.estimatedTime);
```

### 2. WorkflowManager

Manages agent execution with support for parallel and sequential workflows.

```typescript
import { WorkflowManager } from './orchestration';

const workflowManager = new WorkflowManager({
  defaultTimeout: 30000,
  maxRetries: 3
});

const workflow = await workflowManager.executeWorkflow(
  request,
  selectedAgents,
  executionOrder
);
```

### 3. ResultAggregator

Combines multiple agent outputs with weighted confidence scores.

```typescript
import { ResultAggregator } from './orchestration';

const aggregator = new ResultAggregator({
  agentWeights: { 'content-analysis': 1.0 },
  consensusThreshold: 0.6
});

const aggregation = await aggregator.aggregateResults(workflow, agentHealth);
```

### 4. DecisionEngine

Applies ensemble voting and confidence thresholds for final verdicts.

```typescript
import { DecisionEngine } from './orchestration';

const decisionEngine = new DecisionEngine();
const decision = decisionEngine.makeDecision(aggregation, request);
```

### 5. ReportUnifier

Creates unified, user-friendly reports from diverse agent outputs.

```typescript
import { ReportUnifier } from './orchestration';

const reportUnifier = new ReportUnifier();
const report = reportUnifier.createUnifiedReport(request, aggregation, decision);
```

### 6. HealthMonitor

Tracks agent availability, performance, and errors.

```typescript
import { HealthMonitor } from './orchestration';

const healthMonitor = new HealthMonitor();
const health = await healthMonitor.getAllAgentHealth();
```

## Creating Custom Agents

To integrate your existing agents, implement the `SpecializedAgent` interface:

```typescript
import { SpecializedAgent, VerificationRequest, AgentResponse, AgentHealth } from './types';

export class MyCustomAgent implements SpecializedAgent {
  readonly agentId = 'my-custom-agent';
  readonly agentName = 'My Custom Agent';
  readonly supportedContentTypes = ['news_article', 'social_media_post'];
  readonly maxProcessingTime = 15000;

  async analyze(request: VerificationRequest): Promise<AgentResponse> {
    // Your agent's analysis logic here
    return {
      agentId: this.agentId,
      agentName: this.agentName,
      confidence: 0.8,
      verdict: 'verified_true',
      reasoning: 'Analysis complete',
      evidence: [],
      processingTime: 5000,
      timestamp: Date.now(),
      metadata: {}
    };
  }

  async getHealth(): Promise<AgentHealth> {
    return {
      agentId: this.agentId,
      status: 'healthy',
      responseTime: 1000,
      successRate: 0.95,
      lastCheck: Date.now(),
      errorCount: 0,
      totalRequests: 100
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// Register your agent
import { agentRegistry } from './orchestration';
agentRegistry.registerAgent(new MyCustomAgent());
```

## Event System

Subscribe to real-time events during verification:

```typescript
orchestrationAgent.onEvent((event) => {
  switch (event.type) {
    case 'workflow_started':
      console.log('Workflow started:', event.data.workflowId);
      break;
    case 'workflow_completed':
      console.log('Workflow completed:', event.data.status);
      break;
    case 'agent_response':
      console.log('Agent response:', event.data.agentId);
      break;
    case 'error':
      console.error('Error:', event.data.error);
      break;
    case 'health_update':
      console.log('Health alert:', event.data.alert);
      break;
  }
});
```

## Monitoring and Health

### System Statistics

```typescript
const stats = orchestrationAgent.getStats();
console.log('Total requests:', stats.totalRequests);
console.log('Success rate:', stats.successfulRequests / stats.totalRequests);
console.log('Average processing time:', stats.averageProcessingTime);
console.log('System health:', stats.systemHealth);
```

### Agent Health

```typescript
const agentHealth = await orchestrationAgent.getAgentHealth();
for (const [agentId, health] of agentHealth) {
  console.log(`${agentId}: ${health.status} (${health.successRate * 100}% success)`);
}
```

### Health Alerts

```typescript
const alerts = orchestrationAgent.getAlerts();
alerts.forEach(alert => {
  console.log(`Alert: ${alert.type} - ${alert.message}`);
});
```

## Configuration Options

### OrchestrationConfig

```typescript
interface OrchestrationConfig {
  defaultTimeout: number;           // Default timeout for agent operations
  maxRetries: number;              // Maximum retry attempts
  parallelExecution: boolean;      // Enable parallel agent execution
  cacheEnabled: boolean;           // Enable result caching
  cacheTTL: number;               // Cache time-to-live in milliseconds
  healthCheckInterval: number;     // Health check interval in milliseconds
  agentWeights: Record<string, number>;  // Agent weight configuration
  confidenceThresholds: {         // Confidence level thresholds
    high: number;
    medium: number;
    low: number;
  };
}
```

### Agent Weights

Adjust agent influence on final decisions:

```typescript
orchestrationAgent.updateConfig({
  agentWeights: {
    'content-analysis': 1.0,      // Standard weight
    'source-forensics': 1.2,      // Higher weight (more trusted)
    'multilingual': 0.8,          // Lower weight
    'social-graph': 0.9,
    'educational-content': 0.7
  }
});
```

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const result = await orchestrationAgent.verifyContent(content, type, metadata);
  
  if (!result.success) {
    console.error('Verification failed:', result.error);
    // Handle specific error types
    if (result.error.includes('timeout')) {
      // Handle timeout
    } else if (result.error.includes('no agents')) {
      // Handle no available agents
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Performance Optimization

### Caching

Enable caching to avoid redundant processing:

```typescript
const agent = new OrchestrationAgent({
  cacheEnabled: true,
  cacheTTL: 3600000 // 1 hour
});
```

### Parallel Execution

Enable parallel agent execution for faster processing:

```typescript
const agent = new OrchestrationAgent({
  parallelExecution: true,
  defaultTimeout: 30000
});
```

### Health Monitoring

Monitor agent health to identify performance issues:

```typescript
orchestrationAgent.onEvent((event) => {
  if (event.type === 'health_update') {
    const alert = event.data.alert;
    if (alert.severity === 'critical') {
      // Handle critical health issues
      console.error('Critical agent issue:', alert.message);
    }
  }
});
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- Unit tests for each component
- Integration tests for end-to-end workflows
- Mock agent implementations
- Error scenario testing
- Performance testing

## Production Deployment

### Environment Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Agents**: Register your actual agent implementations
3. **Set Environment Variables**:
   ```bash
   export ORCHESTRATION_TIMEOUT=30000
   export ORCHESTRATION_CACHE_TTL=3600000
   export ORCHESTRATION_MAX_RETRIES=3
   ```

4. **Health Monitoring**: Set up monitoring for agent health and system performance

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple orchestration instances behind a load balancer
- **Agent Scaling**: Scale individual agents independently based on demand
- **Caching**: Use distributed caching (Redis) for production deployments
- **Monitoring**: Implement comprehensive logging and monitoring

## API Reference

### OrchestrationAgent

#### Methods

- `verifyContent(content, contentType, metadata?, priority?)`: Main verification method
- `getVerificationStatus(requestId)`: Get status of ongoing verification
- `cancelVerification(requestId)`: Cancel ongoing verification
- `getStats()`: Get system statistics
- `getSystemHealth()`: Get overall system health
- `getAgentHealth()`: Get individual agent health
- `getAlerts()`: Get active health alerts
- `onEvent(callback)`: Subscribe to events
- `offEvent(callback)`: Unsubscribe from events
- `updateConfig(config)`: Update configuration
- `clearCache()`: Clear result cache
- `destroy()`: Clean up resources

### Types

See `types.ts` for complete type definitions including:
- `VerificationRequest`
- `UnifiedReport`
- `AgentResponse`
- `WorkflowExecution`
- `HealthAlert`
- And many more...

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Submit a pull request

## License

This project is part of the VEDA misinformation verification platform.

## Support

For questions and support, please refer to the VEDA documentation or contact the development team.
