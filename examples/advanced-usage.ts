/**
 * Advanced usage example for VEDA Multilingual Processing Agent
 */

import { MultilingualAgent, AgentConfig, ProcessingOptions } from '../src';

async function advancedUsageExample() {
  console.log('=== VEDA Multilingual Processing Agent - Advanced Usage ===\n');

  // Create custom configuration
  const config: AgentConfig = {
    bharatTranslate: {
      apiKey: 'your-api-key-here',
      baseUrl: 'https://api.bharattranslate.com/v1',
      timeout: 30000,
      retryAttempts: 3
    },
    contextDatabase: {
      enabled: true,
      mockMode: true
    },
    normalization: {
      enabled: true,
      strictMode: false
    },
    languageDetection: {
      minConfidence: 0.3,
      fallbackLanguage: 'en'
    }
  };

  const agent = new MultilingualAgent(config);

  // Example 1: Code-switching detection
  console.log('1. Code-switching Detection:');
  const codeSwitchingText = 'Hello नमस्ते, how are you? आप कैसे हैं?';
  const codeSwitchingResult = await agent.detectCodeSwitching(codeSwitchingText);
  
  console.log(`Text: ${codeSwitchingText}`);
  console.log(`Is Code-switching: ${codeSwitchingResult.isCodeSwitching}`);
  console.log(`Languages: ${codeSwitchingResult.languages.join(', ')}`);
  console.log(`Segments: ${codeSwitchingResult.segments.length}`);
  codeSwitchingResult.segments.forEach((segment, index) => {
    console.log(`  Segment ${index + 1}: "${segment.text}" (${segment.language}, confidence: ${segment.confidence.toFixed(2)})`);
  });
  console.log('\n');

  // Example 2: Custom processing options
  console.log('2. Custom Processing Options:');
  const customOptions: ProcessingOptions = {
    enableTranslation: true,
    enableContextEnrichment: true,
    enableNormalization: true,
    targetLanguage: 'en',
    includeConfidence: true,
    includeMetadata: true
  };

  const customResult = await agent.processText('यार, डॉ. शर्मा ने कहा कि यह अफवाह है', customOptions);
  console.log(`Input: यार, डॉ. शर्मा ने कहा कि यह अफवाह है`);
  console.log(`Translated: ${customResult.translatedText}`);
  console.log(`Normalized: ${customResult.normalizedText}`);
  console.log(`Misinformation Patterns: ${customResult.contextNotes.commonMisinformationPatterns.join(', ')}`);
  console.log('\n');

  // Example 3: Batch processing
  console.log('3. Batch Processing:');
  const batchTexts = [
    'नमस्ते, आप कैसे हैं?',
    'নমস্কার, আপনি কেমন আছেন?',
    'నమస్కారం, మీరు ఎలా ఉన్నారు?',
    'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?'
  ];

  const batchResults = await agent.processBatch(batchTexts);
  console.log(`Processed ${batchResults.length} texts:`);
  batchResults.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.detectedLanguage.language} - ${result.translatedText}`);
  });
  console.log('\n');

  // Example 4: Processing with validation
  console.log('4. Processing with Validation:');
  const validationTexts = [
    'नमस्ते, आप कैसे हैं?', // Valid
    '', // Empty
    'नमस्ते '.repeat(2000) // Too long
  ];

  for (const text of validationTexts) {
    const result = await agent.processTextWithValidation(text);
    console.log(`Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    console.log(`Valid: ${result.processingMetadata.errors.length === 0}`);
    if (result.processingMetadata.errors.length > 0) {
      console.log(`Errors: ${result.processingMetadata.errors.join(', ')}`);
    }
    console.log('---');
  }
  console.log('\n');

  // Example 5: Processing statistics
  console.log('5. Processing Statistics:');
  const stats = agent.getProcessingStats();
  console.log(`Supported Languages: ${stats.supportedLanguages.length}`);
  console.log(`Supported Language Pairs: ${stats.supportedLanguagePairs.length}`);
  console.log(`Normalization Rules: ${stats.normalizationRulesCount}`);
  console.log('\n');

  // Example 6: Configuration updates
  console.log('6. Configuration Updates:');
  console.log('Original config:');
  console.log(`  Min Confidence: ${agent.getConfig().languageDetection.minConfidence}`);
  console.log(`  Fallback Language: ${agent.getConfig().languageDetection.fallbackLanguage}`);

  agent.updateConfig({
    languageDetection: {
      minConfidence: 0.5,
      fallbackLanguage: 'hi'
    }
  });

  console.log('Updated config:');
  console.log(`  Min Confidence: ${agent.getConfig().languageDetection.minConfidence}`);
  console.log(`  Fallback Language: ${agent.getConfig().languageDetection.fallbackLanguage}`);
  console.log('\n');

  // Example 7: Error handling
  console.log('7. Error Handling:');
  try {
    const errorResult = await agent.processText('!@#$%^&*()');
    console.log('Error handling test passed');
    console.log(`Detected language: ${errorResult.detectedLanguage.language}`);
    console.log(`Processing time: ${errorResult.processingMetadata.processingTime}ms`);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
if (require.main === module) {
  advancedUsageExample().catch(console.error);
}

export { advancedUsageExample };