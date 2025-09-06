# VEDA Social Graph Agent

A comprehensive TypeScript implementation for analyzing social media propagation patterns to detect misinformation, coordinated inauthentic behavior, and bot networks. Part of the VEDA (Verification and Evidence-based Detection Architecture) hybrid agent system.

## 🎯 Overview

The VEDA Social Graph Agent analyzes the propagation and network patterns of content across social platforms to detect amplification of misinformation and coordinated inauthentic behavior. It builds directed graphs of content propagation, applies advanced graph algorithms, and identifies suspicious patterns through behavioral analysis.

## ✨ Key Features

- **Multi-Platform Data Collection**: Integrates with Twitter API v2 and Facebook Graph API
- **Advanced Graph Analysis**: Implements PageRank, centrality measures, and community detection
- **Bot Detection**: Identifies bot-like behavior using multiple heuristics
- **Coordination Analysis**: Detects coordinated inauthentic behavior patterns
- **Virality Tracking**: Calculates virality scores and propagation metrics
- **Misinformation Pathways**: Identifies and traces misinformation propagation
- **Real-time Monitoring**: Supports continuous monitoring with alerting
- **Comprehensive Testing**: Full unit and integration test coverage

## 🏗️ Architecture

### Core Components

1. **SocialDataFetcher**: Collects post, share, and retweet data via platform APIs
2. **GraphBuilder**: Constructs directed graphs of content propagation
3. **NetworkAnalyzer**: Applies graph algorithms (centrality, community detection)
4. **BehaviorDetector**: Flags bot patterns and coordination using behavioral metrics
5. **SocialGraphAgent**: Orchestrates the entire analysis pipeline

### Data Flow

```
Social Platforms → Data Fetcher → Graph Builder → Network Analyzer → Behavior Detector → Analysis Results
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```typescript
import { SocialGraphAgent, defaultConfig } from './src';
import { SocialPlatform } from './src/types';

// Initialize the agent
const agent = new SocialGraphAgent(defaultConfig);

// Perform analysis
const result = await agent.analyzeSocialGraph(
  'misinformation OR fake news',
  [SocialPlatform.TWITTER, SocialPlatform.FACEBOOK],
  {
    timeWindow: 24, // hours
    includeBotDetection: true,
    includeCommunityDetection: true,
    includeViralityAnalysis: true
  }
);

console.log(`Risk Level: ${result.analysis.summary.riskLevel}`);
console.log(`Flagged Accounts: ${result.flaggedAccounts.length}`);
```

### Configuration

```typescript
import { SocialGraphAgentConfig } from './src/types';

const config: SocialGraphAgentConfig = {
  dataFetcher: {
    twitter: {
      bearerToken: 'your-twitter-bearer-token',
      apiKey: 'your-api-key',
      apiSecret: 'your-api-secret',
      accessToken: 'your-access-token',
      accessTokenSecret: 'your-access-token-secret',
      rateLimitDelay: 1000,
      maxRetries: 3
    },
    facebook: {
      appId: 'your-facebook-app-id',
      appSecret: 'your-facebook-app-secret',
      accessToken: 'your-facebook-access-token',
      version: 'v18.0',
      rateLimitDelay: 1000,
      maxRetries: 3
    },
    defaultTimeWindow: 24,
    maxResults: 1000,
    enableCaching: true,
    cacheExpiry: 60
  },
  // ... other configuration options
};
```

## 📊 Analysis Capabilities

### Bot Detection

The agent identifies bot-like behavior using multiple metrics:

- **Activity Bursts**: Sudden spikes in posting activity
- **Posting Frequency**: Unusually high posting rates
- **Follower Ratio**: Suspicious follower/following ratios
- **Content Similarity**: High similarity between posts
- **Network Reciprocity**: Low mutual interaction rates
- **Account Age**: New accounts with high activity

### Coordination Analysis

Detects coordinated inauthentic behavior through:

- **Content Similarity**: Similar posts across accounts
- **Temporal Patterns**: Synchronized posting times
- **Network Overlap**: Shared connections and interactions
- **Behavioral Patterns**: Similar posting frequencies and styles

### Virality Metrics

Calculates comprehensive virality scores based on:

- **Reach**: Number of unique users reached
- **Engagement**: Total interactions (likes, shares, comments)
- **Velocity**: Rate of propagation over time
- **Amplification**: Share-to-like ratios
- **Cascade Depth**: Maximum propagation depth
- **Time to Viral**: Speed of initial spread

### Misinformation Pathways

Identifies and analyzes misinformation propagation:

- **Source Tracking**: Traces content back to original sources
- **Propagation Paths**: Maps how content spreads through networks
- **Key Nodes**: Identifies influential spreaders
- **Intervention Points**: Suggests optimal intervention locations
- **Credibility Assessment**: Evaluates content credibility

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run with Coverage

```bash
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete analysis pipelines
- **Mock Data**: Comprehensive test data for various scenarios
- **Edge Cases**: Tests for small datasets, empty graphs, etc.

## 📈 Examples

### Basic Analysis

```typescript
import { basicExample } from './examples/basic-usage';

// Run basic analysis example
await basicExample();
```

### Advanced Analysis

```typescript
import { advancedExample } from './examples/advanced-usage';

// Run advanced analysis with custom configuration
await advancedExample();
```

### Real-time Monitoring

```typescript
import { RealTimeMonitor } from './examples/real-time-monitoring';

const monitor = new RealTimeMonitor(agent, {
  query: 'election OR voting',
  platforms: [SocialPlatform.TWITTER],
  timeWindow: 30, // minutes
  checkInterval: 5, // minutes
  alertThresholds: {
    botScore: 0.7,
    coordinationScore: 0.6,
    viralityScore: 0.8,
    riskLevel: 'medium'
  }
});

await monitor.start();
```

## 🔧 API Reference

### SocialGraphAgent

Main orchestrator class for social graph analysis.

#### Methods

- `analyzeSocialGraph(query, platforms, options?)`: Perform complete analysis
- `getConfig()`: Get current configuration
- `updateConfig(newConfig)`: Update configuration
- `getStatistics()`: Get component statistics
- `clearCaches()`: Clear all caches
- `healthCheck()`: Perform health check

### SocialDataFetcher

Collects data from social media platforms.

#### Methods

- `fetchSocialData(query, platforms, timeWindow?)`: Fetch data from platforms
- `fetchUserDetails(userId, platform)`: Get user details
- `clearCache()`: Clear data cache
- `getCacheStats()`: Get cache statistics

### GraphBuilder

Constructs propagation graphs from social data.

#### Methods

- `buildPropagationGraph(collections)`: Build graph from data collections
- `toGraphLib(graph)`: Convert to GraphLib format
- `getGraphStatistics(graph)`: Get graph statistics

### NetworkAnalyzer

Applies graph algorithms for network analysis.

#### Methods

- `analyzeNetworkMetrics(graph)`: Calculate network metrics
- `detectCommunities(graph)`: Detect communities using Louvain algorithm

### BehaviorDetector

Detects bot behavior and coordination patterns.

#### Methods

- `detectBotBehavior(graph)`: Detect bot-like behavior
- `detectCoordination(graph)`: Detect coordinated behavior
- `calculateViralityMetrics(graph)`: Calculate virality metrics
- `identifyMisinformationPathways(graph)`: Identify misinformation pathways

## 📋 Configuration Options

### Data Fetcher Configuration

```typescript
interface SocialDataFetcherConfig {
  twitter?: TwitterApiConfig;
  facebook?: FacebookApiConfig;
  defaultTimeWindow: number; // hours
  maxResults: number;
  enableCaching: boolean;
  cacheExpiry: number; // minutes
}
```

### Graph Builder Configuration

```typescript
interface GraphBuilderConfig {
  includeUserNodes: boolean;
  includePostNodes: boolean;
  edgeWeightCalculation: 'uniform' | 'weighted' | 'temporal';
  timeDecayFactor: number;
  minEdgeWeight: number;
  maxGraphSize: number;
}
```

### Network Analyzer Configuration

```typescript
interface NetworkAnalyzerConfig {
  algorithmConfig: {
    pageRankDamping: number;
    pageRankIterations: number;
    communityDetectionResolution: number;
    centralityThreshold: number;
  };
  enableParallelProcessing: boolean;
  maxConcurrentAlgorithms: number;
}
```

### Behavior Detector Configuration

```typescript
interface BehaviorDetectorConfig {
  botDetectionThreshold: number;
  coordinationThreshold: number;
  activityBurstThreshold: number;
  contentSimilarityThreshold: number;
  networkReciprocityThreshold: number;
  enableMachineLearning: boolean;
}
```

## 🔍 Output Format

### Analysis Response

```typescript
interface SocialGraphAgentResponse {
  propagationGraph: SerializedGraph;
  viralityScore: number;
  communities: Community[];
  flaggedAccounts: string[];
  analysis: SocialGraphAnalysis;
  metadata: {
    processingTime: number;
    nodesProcessed: number;
    edgesProcessed: number;
    algorithmsUsed: string[];
  };
}
```

### Analysis Summary

```typescript
interface AnalysisSummary {
  totalUsers: number;
  totalPosts: number;
  suspiciousUsers: number;
  viralPosts: number;
  coordinatedGroups: number;
  misinformationPathways: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFindings: string[];
  recommendations: string[];
}
```

## 🚨 Alerting and Monitoring

The agent supports real-time monitoring with configurable alerts:

- **Bot Detection Alerts**: High-confidence bot accounts
- **Coordination Alerts**: Coordinated behavior patterns
- **Virality Alerts**: Highly viral content
- **Risk Level Alerts**: Elevated risk levels
- **Misinformation Alerts**: Misinformation pathways

## 🔒 Security and Privacy

- **API Key Management**: Secure handling of platform API credentials
- **Data Caching**: Configurable caching with expiration
- **Rate Limiting**: Built-in rate limiting for API calls
- **Error Handling**: Comprehensive error handling and logging

## 🛠️ Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Development Mode

```bash
npm run dev
```

## 📚 Dependencies

### Core Dependencies

- **graphlib**: Graph data structures and algorithms
- **cytoscape**: Graph visualization and analysis
- **axios**: HTTP client for API requests
- **twitter-api-v2**: Twitter API integration
- **facebook-nodejs-business-sdk**: Facebook API integration
- **lodash**: Utility functions
- **uuid**: UUID generation

### Development Dependencies

- **TypeScript**: Type safety and modern JavaScript features
- **Jest**: Testing framework
- **ESLint**: Code linting
- **ts-jest**: TypeScript support for Jest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the examples directory for usage patterns
- Review the test files for implementation examples

## 🔮 Future Enhancements

- **Machine Learning Integration**: Enhanced bot detection using ML models
- **Additional Platforms**: Support for Instagram, LinkedIn, TikTok
- **Graph Visualization**: Built-in graph visualization capabilities
- **Dashboard Interface**: Web-based monitoring dashboard
- **API Endpoints**: REST API for external integration
- **Streaming Analysis**: Real-time streaming data analysis
- **Advanced Algorithms**: Additional graph algorithms and metrics

## 📊 Performance Considerations

- **Graph Size Limits**: Configurable maximum graph sizes
- **Parallel Processing**: Multi-threaded algorithm execution
- **Caching**: Intelligent caching strategies
- **Memory Management**: Efficient memory usage for large datasets
- **Rate Limiting**: Respectful API usage

## 🧪 Testing Scenarios

The test suite covers:

- **Normal Social Data**: Typical social media interactions
- **Bot Networks**: Coordinated bot behavior
- **Viral Content**: High-engagement content
- **Misinformation**: False information propagation
- **Edge Cases**: Empty graphs, single nodes, etc.
- **Multi-Platform**: Cross-platform analysis
- **Performance**: Large dataset handling

---

**VEDA Social Graph Agent** - Empowering misinformation detection through advanced social network analysis.