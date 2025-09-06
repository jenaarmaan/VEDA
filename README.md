# VEDA Source Forensics Agent

A comprehensive TypeScript implementation for digital forensics, source tracing, and metadata analysis as part of the VEDA misinformation verification platform.

## Overview

The VEDA Source Forensics Agent works alongside the Content Analysis Agent to perform digital forensics, source tracing, and metadata analysis for misinformation verification. It provides comprehensive analysis capabilities including reverse image/video search, metadata analysis, timeline reconstruction, chain of custody tracking, and content fingerprinting.

## Features

### Core Capabilities

- **Reverse Image/Video Search**: Integration with Google Vision API and TinEye for finding similar content across the web
- **Metadata Analysis**: EXIF data extraction and manipulation detection for images and videos
- **Timeline Reconstruction**: Publication chronology tracking across multiple platforms
- **Chain of Custody**: Evidence trail management and integrity verification
- **Content Fingerprinting**: Digital fingerprinting and duplicate content detection
- **Source Authenticity Verification**: Tampering detection and authenticity scoring

### Key Components

- **ReverseSearchEngine**: Handles reverse image/video searches using multiple APIs
- **MetadataAnalyzer**: Extracts and analyzes EXIF data with manipulation detection
- **TimelineTracker**: Reconstructs publication chronology across platforms
- **ChainOfCustody**: Maintains evidence trail and provenance tracking
- **FingerprintGenerator**: Creates unique content identifiers using multiple hashing algorithms
- **SourceForensicsAgent**: Main orchestrator class that coordinates all analysis components

## Installation

```bash
npm install
```

## Configuration

Create a configuration object with your API keys and preferences:

```typescript
import { SourceForensicsAgent, DEFAULT_CONFIG } from './src/index';

const config = {
  ...DEFAULT_CONFIG,
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  tineyeApiKey: process.env.TINEYE_API_KEY,
  tineyeApiId: process.env.TINEYE_API_ID,
  manipulationThreshold: 0.7,
  similarityThreshold: 0.8,
};

const agent = new SourceForensicsAgent(config);
```

## Usage

### Basic Analysis

```typescript
import { SourceForensicsAgent } from './src/index';

const agent = new SourceForensicsAgent(config);

const mediaFile = {
  id: 'example-1',
  url: 'https://example.com/image.jpg',
  type: 'image',
  filename: 'image.jpg',
  mimeType: 'image/jpeg',
};

// Comprehensive analysis
const report = await agent.analyzeMedia(mediaFile);

console.log('Authenticity Score:', report.authenticityScore);
console.log('Risk Level:', report.riskAssessment.level);
console.log('Manipulation Indicators:', report.metadata.manipulationIndicators.length);
```

### Quick Analysis

```typescript
// Quick analysis for real-time verification
const quickResult = await agent.quickAnalysis(mediaFile);

console.log('Risk Level:', quickResult.riskLevel);
console.log('Key Findings:', quickResult.keyFindings);
```

### Media Comparison

```typescript
// Compare two media files
const comparison = await agent.compareMedia(mediaFile1, mediaFile2);

console.log('Similarity:', comparison.similarity);
console.log('Exact Match:', comparison.fingerprintComparison.exactMatch);
```

### Duplicate Detection

```typescript
// Detect duplicates across multiple files
const duplicates = await agent.detectDuplicates(mediaFiles);

console.log('Duplicates found:', duplicates.duplicates.length);
console.log('Unique files:', duplicates.uniqueFiles.length);
```

## API Reference

### SourceForensicsAgent

Main orchestrator class for source forensics analysis.

#### Methods

- `analyzeMedia(mediaFile: MediaFile): Promise<SourceForensicsReport>`
- `quickAnalysis(mediaFile: MediaFile): Promise<QuickAnalysisResult>`
- `compareMedia(mediaFile1: MediaFile, mediaFile2: MediaFile): Promise<ComparisonResult>`
- `detectDuplicates(mediaFiles: MediaFile[]): Promise<DuplicateDetectionResult>`

### ReverseSearchEngine

Handles reverse image/video searches using multiple APIs.

#### Methods

- `searchImage(mediaFile: MediaFile): Promise<ReverseSearchResult[]>`
- `searchVideo(mediaFile: MediaFile): Promise<ReverseSearchResult[]>`
- `combineResults(results: ReverseSearchResult[]): SearchMatch[]`

### MetadataAnalyzer

Extracts and analyzes EXIF data with manipulation detection.

#### Methods

- `analyzeMetadata(mediaFile: MediaFile): Promise<MetadataInfo>`
- `validateExifIntegrity(exifData: Record<string, any>): boolean`

### TimelineTracker

Reconstructs publication chronology across platforms.

#### Methods

- `reconstructTimeline(mediaFile: MediaFile, searchResults: SearchMatch[]): Promise<PublicationTimeline>`
- `validateTimeline(timeline: PublicationTimeline): ValidationResult`

### ChainOfCustodyTracker

Maintains evidence trail and provenance tracking.

#### Methods

- `createChain(mediaFile: MediaFile, initialActor: string): ChainOfCustody`
- `addEntry(chain: ChainOfCustody, entryData: EntryData): ChainOfCustodyEntry`
- `transferCustody(chain: ChainOfCustody, fromActor: string, toActor: string, reason: string): ChainOfCustodyEntry`

### FingerprintGenerator

Creates unique content identifiers using multiple hashing algorithms.

#### Methods

- `generateFingerprint(mediaFile: MediaFile): Promise<ContentFingerprint>`
- `compareFingerprints(fingerprint1: ContentFingerprint, fingerprint2: ContentFingerprint): ComparisonResult`
- `detectDuplicates(fingerprints: ContentFingerprint[]): DuplicateGroup[]`

## VEDA Integration

The Source Forensics Agent is designed to integrate seamlessly with the VEDA platform:

### Content Analysis Agent Integration

```typescript
import { VEDAIntegration } from './examples/veda-integration';

const vedaIntegration = new VEDAIntegration();

// Process content from Content Analysis Agent
const forensicsResult = await vedaIntegration.processContentAnalysisResult(
  contentAnalysisResult
);

// Generate VEDA-compatible output
const vedaOutput = vedaIntegration.generateVEDAOutput(forensicsResult);
```

### VEDA Reporting System

```typescript
import { VEDAReporter } from './examples/veda-integration';

// Format report for VEDA reporting system
const vedaReport = VEDAReporter.formatForVEDAReport(forensicsReport);
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Run specific test files:

```bash
npm test -- --testNamePattern="SourceForensicsAgent"
npm test -- --testNamePattern="MetadataAnalyzer"
npm test -- --testNamePattern="integration"
```

## Examples

See the `examples/` directory for comprehensive usage examples:

- `basic-usage.ts`: Basic usage examples
- `veda-integration.ts`: VEDA platform integration examples

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableMetadataAnalysis` | boolean | true | Enable metadata analysis |
| `enableReverseSearch` | boolean | true | Enable reverse search |
| `enableTimelineTracking` | boolean | true | Enable timeline tracking |
| `enableChainOfCustody` | boolean | true | Enable chain of custody |
| `enableFingerprinting` | boolean | true | Enable content fingerprinting |
| `manipulationThreshold` | number | 0.7 | Threshold for manipulation detection |
| `similarityThreshold` | number | 0.8 | Threshold for similarity matching |

## API Keys

The following API keys are required for full functionality:

- **Google Vision API**: For reverse image search
- **TinEye API**: For additional reverse image search capabilities

Set these as environment variables:

```bash
export GOOGLE_VISION_API_KEY="your-google-vision-api-key"
export TINEYE_API_KEY="your-tineye-api-key"
export TINEYE_API_ID="your-tineye-api-id"
```

## Output Format

The agent generates comprehensive reports in JSON format compatible with the VEDA reporting system:

```json
{
  "mediaId": "example-1",
  "timestamp": "2023-12-07T10:00:00.000Z",
  "authenticityScore": 0.85,
  "riskAssessment": {
    "level": "medium",
    "factors": ["Low manipulation indicators"],
    "recommendations": ["Additional verification recommended"]
  },
  "metadata": {
    "exif": { /* EXIF data */ },
    "manipulationIndicators": [ /* manipulation indicators */ ],
    "authenticityScore": 0.85
  },
  "reverseSearch": [ /* reverse search results */ ],
  "timeline": { /* publication timeline */ },
  "chainOfCustody": { /* evidence trail */ },
  "fingerprint": { /* content fingerprints */ }
}
```

## Performance Considerations

- **Concurrent Analysis**: The agent supports concurrent analysis of multiple media files
- **Large Files**: Optimized for handling large image and video files
- **Caching**: Results can be cached for improved performance
- **Rate Limiting**: Built-in rate limiting for API calls

## Security

- **Chain of Custody**: Maintains cryptographic integrity of evidence trails
- **API Security**: Secure handling of API keys and credentials
- **Data Privacy**: No sensitive data is stored or transmitted unnecessarily

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please contact the VEDA development team.