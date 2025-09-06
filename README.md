# VEDA Content Analysis Agent

An AI-driven misinformation verification platform built on a hybrid multi-agent architecture for the VEDA platform.

## Overview

The VEDA Content Analysis Agent is designed to automatically extract factual claims from free-form text, fact-check them against external trusted APIs, and generate detailed, explainable reports with confidence scores and evidence timelines.

## Features

- **Claim Extraction**: Uses NLP techniques including Named Entity Recognition and dependency parsing to identify factual claims
- **Fact-Checking**: Integrates with external APIs (Gemini API, IndiaFactCheck API) for evidence gathering
- **Confidence Aggregation**: Implements weighted scoring algorithm considering source credibility
- **Explainable Reports**: Generates detailed reports with reasoning and chronological evidence timelines
- **Multi-Agent Architecture**: Modular design with specialized components for each task

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ClaimExtractor │    │   FactChecker   │    │ConfidenceAggreg│
│                 │    │                 │    │     ator        │
│ • NLP Analysis  │───▶│ • API Integration│───▶│ • Weighted      │
│ • Entity Recog. │    │ • Evidence      │    │   Scoring       │
│ • Pattern Match │    │   Normalization │    │ • Source        │
└─────────────────┘    └─────────────────┘    │   Credibility   │
         │                       │             └─────────────────┘
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              ▼
│ContentAnalysis  │    │ ReportGenerator │    ┌─────────────────┐
│     Agent       │◀───│                 │◀───│   Final Report  │
│                 │    │ • JSON Export   │    │                 │
│ • Orchestration │    │ • Text Export   │    │ • Verdict       │
│ • Workflow Mgmt │    │ • Timeline      │    │ • Confidence    │
└─────────────────┘    └─────────────────┘    │ • Explanation   │
                                              └─────────────────┘
```

## Installation

```bash
npm install
npm run build
```

## Quick Start

```typescript
import { ContentAnalysisAgent, defaultConfig } from './src/index';

const agent = new ContentAnalysisAgent(defaultConfig);

const result = await agent.analyzeContent(
  'A house fire in Mumbai killed five people yesterday.'
);

console.log(`Verdict: ${result.reports[0].finalVerdict}`);
console.log(`Confidence: ${result.reports[0].confidenceScore}`);
```

## Configuration

### Environment Variables

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export INDIA_FACT_CHECK_API_KEY="your-india-fact-check-api-key"
```

### Custom Configuration

```typescript
import { APIConfig } from './src/types';

const customConfig: APIConfig = {
  gemini: {
    apiKey: 'your-api-key',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-pro'
  },
  indiaFactCheck: {
    apiKey: 'your-api-key',
    baseUrl: 'https://api.indiafactcheck.com'
  },
  timeout: 30000,
  maxRetries: 3
};

const agent = new ContentAnalysisAgent(customConfig);
```

## API Reference

### ContentAnalysisAgent

Main orchestrator class that coordinates all components.

#### Methods

- `analyzeContent(text: string): Promise<ContentAnalysisResult>`
- `analyzeContentWithConfig(text: string, config: Partial<APIConfig>): Promise<ContentAnalysisResult>`
- `getAnalysisStats(result: ContentAnalysisResult): any`
- `exportResult(result: ContentAnalysisResult, format: 'json' | 'text' | 'both'): any`
- `updateConfig(newConfig: Partial<APIConfig>): void`
- `healthCheck(): Promise<{[key: string]: boolean}>`

### ClaimExtractor

Extracts factual claims from text using NLP techniques.

#### Methods

- `extractClaims(text: string): Promise<Claim[]>`

### FactChecker

Verifies claims against external APIs.

#### Methods

- `checkClaim(claim: string): Promise<Evidence[]>`
- `checkClaims(claims: string[]): Promise<Evidence[][]>`

### ConfidenceAggregator

Aggregates evidence using weighted scoring.

#### Methods

- `aggregateConfidence(evidence: Evidence[]): AggregatedConfidence`
- `calculateVerdictConfidence(evidence: Evidence[], verdict: Verdict): number`
- `getVerdictBreakdown(evidence: Evidence[]): Map<Verdict, number>`

### ReportGenerator

Generates explainable reports.

#### Methods

- `generateClaimReport(claim: Claim, evidence: Evidence[], confidence: AggregatedConfidence, processingTime: number): AnalysisReport`
- `generateContentAnalysisResult(inputText: string, claims: Claim[], reports: AnalysisReport[], processingTime: number): ContentAnalysisResult`
- `exportReport(result: ContentAnalysisResult, format: 'json' | 'text' | 'both'): any`

## Data Types

### Core Types

```typescript
interface Claim {
  id: string;
  text: string;
  entityType: EntityType;
  startOffset: number;
  endOffset: number;
  confidence: number;
  context?: string;
}

interface Evidence {
  source: string;
  sourceType: SourceType;
  timestamp: Date;
  verdict: Verdict;
  confidenceScore: number;
  url?: string;
  title?: string;
  summary?: string;
  rawResponse?: any;
}

interface AnalysisReport {
  claimId: string;
  claimText: string;
  finalVerdict: Verdict;
  confidenceScore: number;
  evidence: Evidence[];
  confidenceBreakdown: AggregatedConfidence;
  timeline: Evidence[];
  explanation: string;
  processingTime: number;
  timestamp: Date;
}
```

### Enums

```typescript
enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  DATE = 'DATE',
  NUMBER = 'NUMBER',
  CLAIM = 'CLAIM'
}

enum SourceType {
  OFFICIAL = 'OFFICIAL',
  MAJOR_NEWS = 'MAJOR_NEWS',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  BLOG = 'BLOG',
  UNKNOWN = 'UNKNOWN'
}

enum Verdict {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  UNCERTAIN = 'UNCERTAIN',
  PARTIALLY_TRUE = 'PARTIALLY_TRUE',
  MISLEADING = 'MISLEADING'
}
```

## Algorithm Details

### Confidence Aggregation

The system uses a weighted sum algorithm: `C = Σ(wi * si)`

Where:
- `C` = Final confidence score
- `wi` = Source credibility weight
- `si` = Source confidence score

### Source Credibility Weights

- **Official Sources**: 1.0
- **Major News**: 0.8
- **Blogs**: 0.6
- **Social Media**: 0.5
- **Unknown**: 0.3

### Verdict Scoring

- **TRUE**: 1.0
- **PARTIALLY_TRUE**: 0.6
- **UNCERTAIN**: 0.5
- **MISLEADING**: 0.3
- **FALSE**: 0.0

## Examples

### Basic Usage

```typescript
import { ContentAnalysisAgent, defaultConfig } from './src/index';

const agent = new ContentAnalysisAgent(defaultConfig);
const result = await agent.analyzeContent('A fire in Mumbai killed five people.');

console.log(result.reports[0].finalVerdict);
console.log(result.reports[0].explanation);
```

### Conflicting Evidence

```typescript
const text = 'A fire killed five people. Later reports say only three died.';
const result = await agent.analyzeContent(text);

// The agent will handle conflicting evidence and provide reasoning
result.reports.forEach(report => {
  console.log(`Claim: ${report.claimText}`);
  console.log(`Verdict: ${report.finalVerdict}`);
  console.log(`Confidence: ${report.confidenceScore}`);
  console.log(`Explanation: ${report.explanation}`);
});
```

### Batch Processing

```typescript
const texts = [
  'A fire in Mumbai killed five people.',
  'The government announced new policies.',
  'Social media reports suggest an incident.'
];

const results = [];
for (const text of texts) {
  const result = await agent.analyzeContent(text);
  results.push(result);
}
```

## Testing

```bash
npm test
npm run test:watch
```

The test suite includes comprehensive scenarios for:
- Conflicting evidence handling
- Evolving information processing
- Source credibility weighting
- Temporal analysis
- Error handling

## Error Handling

The agent includes robust error handling for:
- API failures
- Network timeouts
- Invalid input
- Processing errors

Failed API calls result in fallback evidence with low confidence scores.

## Performance

- **Claim Extraction**: ~100-500ms per text
- **Fact-Checking**: ~1-5s per claim (depending on API response times)
- **Report Generation**: ~50-100ms per report
- **Total Processing**: ~2-10s per text (depending on claim count and API performance)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository or contact the VEDA platform team.