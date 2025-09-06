# VEDA Multilingual Processing Agent

A comprehensive TypeScript library for multilingual text processing, language detection, translation, and cultural context enrichment for the VEDA platform. This agent enables accurate verification across India's diverse languages by detecting language, providing cultural context, and translating content for the verification pipeline.

## Features

- **Language Detection**: Auto-detect content language among 22+ Indian languages using the `franc` library
- **Cultural Context**: Retrieve cultural and regional context patterns relevant to detected languages
- **Translation**: High-accuracy translation using BharatTranslate API integration
- **Text Normalization**: Normalize slang, dialects, and regional idioms for accurate analysis
- **Misinformation Detection**: Flag language-specific misinformation patterns and regional biases
- **Code-switching Detection**: Identify and handle mixed-language content
- **Batch Processing**: Process multiple texts efficiently
- **Comprehensive Testing**: Full test suite with unit, integration, and edge case tests

## Supported Languages

The agent supports 22+ Indian languages including:

- **Hindi** (hi) - Devanagari script
- **Bengali** (bn) - Bengali script
- **Telugu** (te) - Telugu script
- **Marathi** (mr) - Devanagari script
- **Tamil** (ta) - Tamil script
- **Gujarati** (gu) - Gujarati script
- **Kannada** (kn) - Kannada script
- **Malayalam** (ml) - Malayalam script
- **Odia** (or) - Odia script
- **Punjabi** (pa) - Gurmukhi script
- **Assamese** (as) - Assamese script
- **Nepali** (ne) - Devanagari script
- **Urdu** (ur) - Arabic script
- **Sindhi** (sd) - Arabic script
- **Kashmiri** (ks) - Arabic script
- **Bodo** (bo) - Devanagari script
- **Dogri** (dv) - Devanagari script
- **English** (en) - Latin script
- **Sanskrit** (sa) - Devanagari script
- **Konkani** (gom, kok) - Devanagari script
- **Manipuri** (mni) - Meitei script
- **Mizo** (lus) - Latin script

## Installation

```bash
npm install veda-multilingual-agent
```

## Quick Start

```typescript
import { MultilingualAgent } from 'veda-multilingual-agent';

// Create default configuration
const config = MultilingualAgent.createDefaultConfig();

// Initialize the agent
const agent = new MultilingualAgent(config);

// Process text
const result = await agent.processText('नमस्ते, आप कैसे हैं?');

console.log(`Detected Language: ${result.detectedLanguage.language}`);
console.log(`Translated: ${result.translatedText}`);
console.log(`Normalized: ${result.normalizedText}`);
console.log(`Cultural Context: ${result.contextNotes.region}`);
```

## Core Components

### 1. LanguageDetector

Identifies the language and dialect of input text.

```typescript
import { LanguageDetector } from 'veda-multilingual-agent';

const detector = new LanguageDetector(0.3, 'en');
const result = await detector.detectLanguage('नमस्ते, आप कैसे हैं?');

console.log(result);
// {
//   language: 'hi',
//   confidence: 0.95,
//   script: 'Devanagari',
//   dialect: 'Haryanvi'
// }
```

### 2. ContextFetcher

Queries knowledge base for cultural context insights.

```typescript
import { ContextFetcher } from 'veda-multilingual-agent';

const contextFetcher = new ContextFetcher(true); // Mock mode
const context = await contextFetcher.fetchContext('hi', 'Delhi');

console.log(context);
// {
//   region: 'Delhi',
//   culturalNotes: ['Hindi is widely spoken across North India', ...],
//   commonMisinformationPatterns: ['अफवाह', 'गलत जानकारी', ...],
//   regionalBiases: ['North vs South India comparisons', ...],
//   slangPatterns: ['यार', 'भाई', ...]
// }
```

### 3. Translator

Integrates with BharatTranslate API for high-accuracy translation.

```typescript
import { Translator } from 'veda-multilingual-agent';

const config = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.bharattranslate.com/v1',
  timeout: 30000,
  retryAttempts: 3
};

const translator = new Translator(config, true); // Mock mode
const result = await translator.translate('नमस्ते', 'hi', 'en');

console.log(result);
// {
//   originalText: 'नमस्ते',
//   translatedText: 'Hello',
//   sourceLanguage: 'hi',
//   targetLanguage: 'en',
//   confidence: 0.85
// }
```

### 4. Normalizer

Handles slang/idiom mapping and text normalization.

```typescript
import { Normalizer } from 'veda-multilingual-agent';

const normalizer = new Normalizer(false); // Non-strict mode
const result = await normalizer.normalize('यार, डॉ. शर्मा', 'hi');

console.log(result);
// {
//   originalText: 'यार, डॉ. शर्मा',
//   normalizedText: 'दोस्त, डॉक्टर शर्मा',
//   appliedRules: ['slang_mapping', 'abbreviation_expansion'],
//   slangMappings: [
//     { original: 'यार', normalized: 'दोस्त', type: 'slang' },
//     { original: 'डॉ.', normalized: 'डॉक्टर', type: 'slang' }
//   ]
// }
```

## Advanced Usage

### Custom Processing Options

```typescript
const options = {
  enableTranslation: true,
  enableContextEnrichment: true,
  enableNormalization: true,
  targetLanguage: 'en',
  includeConfidence: true,
  includeMetadata: true
};

const result = await agent.processText('नमस्ते, आप कैसे हैं?', options);
```

### Batch Processing

```typescript
const texts = [
  'नमस्ते, आप कैसे हैं?',
  'নমস্কার, আপনি কেমন আছেন?',
  'నమస్కారం, మీరు ఎలా ఉన్నారు?'
];

const results = await agent.processBatch(texts);
```

### Code-switching Detection

```typescript
const result = await agent.detectCodeSwitching('Hello नमस्ते, how are you? आप कैसे हैं?');

console.log(result);
// {
//   isCodeSwitching: true,
//   languages: ['hi', 'en'],
//   segments: [
//     { text: 'Hello', language: 'en', confidence: 0.95 },
//     { text: 'नमस्ते', language: 'hi', confidence: 0.98 },
//     { text: 'how are you?', language: 'en', confidence: 0.92 },
//     { text: 'आप कैसे हैं?', language: 'hi', confidence: 0.97 }
//   ]
// }
```

### Configuration Management

```typescript
// Get current configuration
const config = agent.getConfig();

// Update configuration
agent.updateConfig({
  languageDetection: {
    minConfidence: 0.5,
    fallbackLanguage: 'hi'
  }
});
```

## Integration with Verification Pipeline

```typescript
class VEDAVerificationPipeline {
  private agent: MultilingualAgent;

  constructor(config: AgentConfig) {
    this.agent = new MultilingualAgent(config);
  }

  async verifyContent(content: string, contentId: string) {
    const result = await this.agent.processText(content);
    
    // Extract misinformation flags
    const flags = this.extractMisinformationFlags(
      result.normalizedText,
      result.contextNotes.commonMisinformationPatterns
    );
    
    return {
      id: contentId,
      detectedLanguage: result.detectedLanguage.language,
      translatedText: result.translatedText,
      normalizedText: result.normalizedText,
      culturalContext: result.contextNotes,
      misinformationFlags: flags,
      confidence: result.detectedLanguage.confidence
    };
  }
}
```

## Testing

The library includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end pipeline testing
- **Edge Case Tests**: Error handling and boundary conditions
- **Performance Tests**: Load and memory testing

## Examples

Check the `examples/` directory for:

- **Basic Usage** (`examples/basic-usage.ts`): Simple text processing
- **Advanced Usage** (`examples/advanced-usage.ts`): Custom options and batch processing
- **Verification Pipeline** (`examples/verification-pipeline.ts`): Integration example
- **Performance Testing** (`examples/performance-test.ts`): Load testing

## API Reference

### MultilingualAgent

Main orchestrator class for multilingual processing.

#### Methods

- `processText(text: string, options?: ProcessingOptions): Promise<MultilingualProcessingResult>`
- `processBatch(texts: string[], options?: ProcessingOptions): Promise<MultilingualProcessingResult[]>`
- `detectCodeSwitching(text: string): Promise<CodeSwitchingResult>`
- `processTextWithValidation(text: string, options?: ProcessingOptions): Promise<MultilingualProcessingResult>`
- `getProcessingStats(): ProcessingStats`
- `updateConfig(config: Partial<AgentConfig>): void`
- `getConfig(): AgentConfig`

#### Static Methods

- `createDefaultConfig(): AgentConfig`

### Types

#### MultilingualProcessingResult

```typescript
interface MultilingualProcessingResult {
  detectedLanguage: LanguageDetectionResult;
  translatedText: string;
  contextNotes: CulturalContext;
  normalizedText: string;
  processingMetadata: {
    processingTime: number;
    componentsUsed: string[];
    warnings: string[];
    errors: string[];
  };
}
```

#### ProcessingOptions

```typescript
interface ProcessingOptions {
  enableTranslation: boolean;
  enableContextEnrichment: boolean;
  enableNormalization: boolean;
  targetLanguage: string;
  includeConfidence: boolean;
  includeMetadata: boolean;
}
```

## Configuration

### AgentConfig

```typescript
interface AgentConfig {
  bharatTranslate: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  contextDatabase: {
    enabled: boolean;
    mockMode: boolean;
  };
  normalization: {
    enabled: boolean;
    strictMode: boolean;
  };
  languageDetection: {
    minConfidence: number;
    fallbackLanguage: string;
  };
}
```

## Performance

- **Language Detection**: ~50-100ms per text
- **Translation**: ~200-500ms per text (depending on API)
- **Context Enrichment**: ~10-50ms per text
- **Normalization**: ~20-100ms per text
- **Total Processing**: ~300-750ms per text

## Error Handling

The agent includes comprehensive error handling:

- Graceful fallbacks for API failures
- Validation for input text
- Retry logic for network requests
- Detailed error reporting in metadata

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the examples in the `examples/` directory
2. Review the test cases for usage patterns
3. Open an issue on GitHub
4. Contact the VEDA platform team

## Changelog

### v1.0.0
- Initial release
- Support for 22+ Indian languages
- Language detection with franc library
- BharatTranslate API integration
- Cultural context enrichment
- Text normalization
- Comprehensive test suite
- Performance testing tools
- Example usage scripts