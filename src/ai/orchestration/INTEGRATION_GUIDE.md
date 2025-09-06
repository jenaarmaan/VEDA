# VEDA Orchestration Agent - Integration Guide

This guide will help you integrate your existing 5 agents (Content Analysis, Source Forensics, Multilingual, Social Graph, and Educational Content) with the VEDA orchestration system.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in your project root with your agent endpoints:

```bash
# Content Analysis Agent
CONTENT_ANALYSIS_AGENT_URL=http://localhost:3001/api/content-analysis
CONTENT_ANALYSIS_AGENT_API_KEY=your-content-analysis-api-key

# Source Forensics Agent
SOURCE_FORENSICS_AGENT_URL=http://localhost:3002/api/source-forensics
SOURCE_FORENSICS_AGENT_API_KEY=your-source-forensics-api-key

# Multilingual Agent
MULTILINGUAL_AGENT_URL=http://localhost:3003/api/multilingual
MULTILINGUAL_AGENT_API_KEY=your-multilingual-api-key

# Social Graph Agent
SOCIAL_GRAPH_AGENT_URL=http://localhost:3004/api/social-graph
SOCIAL_GRAPH_AGENT_API_KEY=your-social-graph-api-key

# Educational Content Agent
EDUCATIONAL_CONTENT_AGENT_URL=http://localhost:3005/api/educational-content
EDUCATIONAL_CONTENT_AGENT_API_KEY=your-educational-content-api-key
```

### 2. Agent API Requirements

Your existing agents need to implement the following API endpoints:

#### Health Check Endpoint
```
GET /health
Authorization: Bearer {api_key}
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Analysis Endpoint
```
POST /api/{agent-type}
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Content to analyze",
  "contentType": "news_article",
  "metadata": {
    "source": "example.com",
    "language": "en",
    "platform": "news",
    "url": "https://example.com/article"
  },
  "priority": "high",
  "timestamp": 1704067200000
}
```

**Response Body:**
```json
{
  "verdict": "verified_true",
  "confidence": 0.85,
  "reasoning": "Content appears to be accurate based on analysis",
  "evidence": [
    {
      "type": "source",
      "title": "Reliable Source",
      "description": "Content from verified reliable source",
      "url": "https://example.com",
      "reliability": 0.9
    }
  ],
  "metadata": {
    "modelVersion": "v1.0",
    "processingTime": 5000
  }
}
```

## 🔧 Agent-Specific Integration

### Content Analysis Agent

**Endpoint:** `POST /api/content-analysis`

**Expected Response Fields:**
- `verdict`: "true" | "false" | "misleading" | "unverified" | "insufficient_evidence" | "error"
- `confidence`: number (0-1)
- `reasoning`: string
- `evidence`: array of evidence objects
- `modelVersion`: string (optional)

### Source Forensics Agent

**Endpoint:** `POST /api/source-forensics`

**Expected Response Fields:**
- `verdict`: "verified" | "reliable" | "credible" | "unreliable" | "suspicious" | "fake" | "misleading" | "unverified" | "insufficient_evidence" | "error"
- `confidence`: number (0-1)
- `reasoning`: string
- `evidence`: array of evidence objects
- `domainReputation`: number (optional)
- `sslVerification`: boolean (optional)

### Multilingual Agent

**Endpoint:** `POST /api/multilingual`

**Expected Response Fields:**
- `verdict`: "accurate" | "translated_accurate" | "cultural_accurate" | "inaccurate" | "translation_error" | "cultural_misleading" | "untranslatable" | "language_not_supported" | "error"
- `confidence`: number (0-1)
- `reasoning`: string
- `evidence`: array of evidence objects
- `detectedLanguage`: string (optional)
- `translationQuality`: number (optional)
- `supportedLanguages`: array of strings (optional)

### Social Graph Agent

**Endpoint:** `POST /api/social-graph`

**Expected Response Fields:**
- `verdict`: "organic" | "authentic" | "legitimate" | "bot_network" | "artificial_amplification" | "coordinated_inauthentic" | "suspicious_patterns" | "manipulated_engagement" | "insufficient_data" | "network_unavailable" | "error"
- `confidence`: number (0-1)
- `reasoning`: string
- `evidence`: array of evidence objects
- `engagementScore`: number (optional)
- `viralPotential`: number (optional)
- `networkAnalysis`: object (optional)

### Educational Content Agent

**Endpoint:** `POST /api/educational-content`

**Expected Response Fields:**
- `verdict`: "educationally_accurate" | "scientifically_correct" | "pedagogically_sound" | "educationally_incorrect" | "scientifically_wrong" | "contains_misconceptions" | "misleading_educational" | "oversimplified" | "outdated_information" | "insufficient_educational_value" | "not_educational_content" | "error"
- `confidence`: number (0-1)
- `reasoning`: string
- `evidence`: array of evidence objects
- `educationalValue`: number (optional)
- `accuracyScore`: number (optional)
- `subjectArea`: string (optional)
- `difficultyLevel`: string (optional)
- `scientificAccuracy`: number (optional)

## 🧪 Testing Your Integration

### 1. Run Integration Tests

```bash
npm test -- --testPathPattern=integration
```

### 2. Test Individual Agents

```typescript
import { orchestrationAgent } from './src/ai/orchestration';

// Test content verification
const result = await orchestrationAgent.verifyContent(
  'Your test content here',
  'news_article',
  {
    source: 'example.com',
    language: 'en'
  },
  'high'
);

console.log('Result:', result);
```

### 3. Check Agent Health

```typescript
import { orchestrationAgent } from './src/ai/orchestration';

// Check system health
const health = orchestrationAgent.getSystemHealth();
console.log('System Health:', health);

// Check individual agent health
const agentHealth = await orchestrationAgent.getAgentHealth();
console.log('Agent Health:', agentHealth);
```

## 🔍 Troubleshooting

### Common Issues

1. **Agent Not Available**
   - Check if your agent service is running
   - Verify the endpoint URL is correct
   - Check API key authentication

2. **Invalid Response Format**
   - Ensure your agent returns the expected JSON structure
   - Check that required fields are present
   - Verify data types match expectations

3. **Timeout Errors**
   - Increase timeout values in agent configuration
   - Optimize your agent's processing time
   - Check network connectivity

4. **Authentication Errors**
   - Verify API keys are correct
   - Check authorization header format
   - Ensure your agent accepts Bearer token authentication

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=orchestration:*
```

### Health Check Issues

If health checks are failing:

1. Ensure your agent implements the `/health` endpoint
2. Check that the endpoint returns a 200 status code
3. Verify the response format matches expectations

## 📊 Monitoring

### System Statistics

```typescript
const stats = orchestrationAgent.getStats();
console.log('Total Requests:', stats.totalRequests);
console.log('Success Rate:', stats.successfulRequests / stats.totalRequests);
console.log('Average Processing Time:', stats.averageProcessingTime);
```

### Event Monitoring

```typescript
orchestrationAgent.onEvent((event) => {
  console.log('Event:', event.type, event.data);
});
```

## 🚀 Production Deployment

### 1. Environment Variables

Set production environment variables:

```bash
# Production URLs
CONTENT_ANALYSIS_AGENT_URL=https://your-domain.com/api/content-analysis
SOURCE_FORENSICS_AGENT_URL=https://your-domain.com/api/source-forensics
# ... etc
```

### 2. Load Balancing

If you have multiple instances of agents:

```bash
CONTENT_ANALYSIS_AGENT_URL=https://content-analysis-lb.your-domain.com/api/content-analysis
```

### 3. Security

- Use HTTPS for all agent endpoints
- Implement proper API key rotation
- Set up rate limiting
- Monitor for suspicious activity

### 4. Scaling

- Monitor agent response times
- Scale agents based on demand
- Implement circuit breakers for failing agents
- Use caching for repeated requests

## 📝 Customization

### Custom Agent Weights

```typescript
orchestrationAgent.updateConfig({
  agentWeights: {
    'content-analysis': 1.0,
    'source-forensics': 1.2, // Higher weight
    'multilingual': 0.8,
    'social-graph': 0.9,
    'educational-content': 0.7
  }
});
```

### Custom Timeouts

```typescript
orchestrationAgent.updateConfig({
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3
});
```

## 🆘 Support

If you encounter issues:

1. Check the integration tests
2. Review the agent adapter code
3. Verify your agent API implementation
4. Check the orchestration logs
5. Contact the VEDA development team

## 📚 Additional Resources

- [Orchestration Agent README](./README.md)
- [API Documentation](./API.md)
- [Example Usage](./examples/usage.ts)
- [Integration Examples](./examples/integration.ts)
