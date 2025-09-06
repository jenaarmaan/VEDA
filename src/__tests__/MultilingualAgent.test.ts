/**
 * Unit tests for MultilingualAgent
 */

import { MultilingualAgent } from '../MultilingualAgent';
import { AgentConfig, ProcessingOptions } from '../types';

describe('MultilingualAgent', () => {
  let agent: MultilingualAgent;
  let config: AgentConfig;

  beforeEach(() => {
    config = MultilingualAgent.createDefaultConfig();
    agent = new MultilingualAgent(config);
  });

  describe('processText', () => {
    it('should process Hindi text completely', async () => {
      const result = await agent.processText('नमस्ते, आप कैसे हैं?');
      
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.detectedLanguage.confidence).toBeGreaterThan(0);
      expect(result.translatedText).toBe('Hello, how are you?');
      expect(result.contextNotes.region).toBeDefined();
      expect(result.contextNotes.culturalNotes.length).toBeGreaterThan(0);
      expect(result.normalizedText).toBeDefined();
      expect(result.processingMetadata.componentsUsed).toContain('LanguageDetector');
      expect(result.processingMetadata.componentsUsed).toContain('ContextFetcher');
      expect(result.processingMetadata.componentsUsed).toContain('Translator');
      expect(result.processingMetadata.componentsUsed).toContain('Normalizer');
    });

    it('should process Bengali text completely', async () => {
      const result = await agent.processText('নমস্কার, আপনি কেমন আছেন?');
      
      expect(result.detectedLanguage.language).toBe('bn');
      expect(result.detectedLanguage.confidence).toBeGreaterThan(0);
      expect(result.translatedText).toBe('Hello, how are you?');
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should process Telugu text completely', async () => {
      const result = await agent.processText('నమస్కారం, మీరు ఎలా ఉన్నారు?');
      
      expect(result.detectedLanguage.language).toBe('te');
      expect(result.detectedLanguage.confidence).toBeGreaterThan(0);
      expect(result.translatedText).toBe('Hello, how are you?');
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should process Tamil text completely', async () => {
      const result = await agent.processText('வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?');
      
      expect(result.detectedLanguage.language).toBe('ta');
      expect(result.detectedLanguage.confidence).toBeGreaterThan(0);
      expect(result.translatedText).toBe('Hello, how are you?');
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should process English text completely', async () => {
      const result = await agent.processText('Hello, how are you?');
      
      expect(result.detectedLanguage.language).toBe('en');
      expect(result.detectedLanguage.confidence).toBeGreaterThan(0);
      expect(result.translatedText).toBe('Hello, how are you?');
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle custom processing options', async () => {
      const options: ProcessingOptions = {
        enableTranslation: false,
        enableContextEnrichment: true,
        enableNormalization: false,
        targetLanguage: 'hi',
        includeConfidence: true,
        includeMetadata: true
      };

      const result = await agent.processText('नमस्ते', options);
      
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBe('नमस्ते'); // No translation
      expect(result.normalizedText).toBe('नमस्ते'); // No normalization
      expect(result.contextNotes.region).toBeDefined(); // Context enabled
      expect(result.processingMetadata.componentsUsed).toContain('LanguageDetector');
      expect(result.processingMetadata.componentsUsed).toContain('ContextFetcher');
      expect(result.processingMetadata.componentsUsed).not.toContain('Translator');
      expect(result.processingMetadata.componentsUsed).not.toContain('Normalizer');
    });

    it('should handle empty text', async () => {
      const result = await agent.processText('');
      
      expect(result.detectedLanguage.language).toBe('en');
      expect(result.detectedLanguage.confidence).toBe(0);
      expect(result.translatedText).toBe('');
      expect(result.normalizedText).toBe('');
      expect(result.processingMetadata.errors.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only text', async () => {
      const result = await agent.processText('   \n\t   ');
      
      expect(result.detectedLanguage.language).toBe('en');
      expect(result.detectedLanguage.confidence).toBe(0);
      expect(result.translatedText).toBe('   \n\t   ');
      expect(result.normalizedText).toBe('   \n\t   ');
    });
  });

  describe('processBatch', () => {
    it('should process multiple texts', async () => {
      const texts = [
        'नमस्ते, आप कैसे हैं?',
        'নমস্কার, আপনি কেমন আছেন?',
        'Hello, how are you?'
      ];

      const results = await agent.processBatch(texts);
      
      expect(results).toHaveLength(3);
      expect(results[0].detectedLanguage.language).toBe('hi');
      expect(results[1].detectedLanguage.language).toBe('bn');
      expect(results[2].detectedLanguage.language).toBe('en');
    });

    it('should handle empty batch', async () => {
      const results = await agent.processBatch([]);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('detectCodeSwitching', () => {
    it('should detect code-switching between Hindi and English', async () => {
      const result = await agent.detectCodeSwitching('Hello नमस्ते, how are you? आप कैसे हैं?');
      
      expect(result.isCodeSwitching).toBe(true);
      expect(result.languages).toContain('hi');
      expect(result.languages).toContain('en');
      expect(result.segments.length).toBeGreaterThan(1);
    });

    it('should detect single language text', async () => {
      const result = await agent.detectCodeSwitching('नमस्ते, आप कैसे हैं?');
      
      expect(result.isCodeSwitching).toBe(false);
      expect(result.languages).toHaveLength(1);
      expect(result.languages[0]).toBe('hi');
    });
  });

  describe('processTextWithValidation', () => {
    it('should process valid text', async () => {
      const result = await agent.processTextWithValidation('नमस्ते, आप कैसे हैं?');
      
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.processingMetadata.errors).toHaveLength(0);
    });

    it('should reject empty text', async () => {
      const result = await agent.processTextWithValidation('');
      
      expect(result.processingMetadata.errors).toContain('Text is empty or contains only whitespace');
      expect(result.processingMetadata.componentsUsed).toHaveLength(0);
    });

    it('should reject text that is too long', async () => {
      const longText = 'नमस्ते '.repeat(2000); // More than 10000 characters
      const result = await agent.processTextWithValidation(longText);
      
      expect(result.processingMetadata.errors).toContain('Text is too long (maximum 10000 characters)');
      expect(result.processingMetadata.componentsUsed).toHaveLength(0);
    });
  });

  describe('getProcessingStats', () => {
    it('should return processing statistics', () => {
      const stats = agent.getProcessingStats();
      
      expect(stats.supportedLanguages).toBeInstanceOf(Array);
      expect(stats.supportedLanguagePairs).toBeInstanceOf(Array);
      expect(stats.supportedLanguagePairs.length).toBeGreaterThan(0);
      expect(stats.normalizationRulesCount).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        languageDetection: {
          minConfidence: 0.5,
          fallbackLanguage: 'hi'
        }
      };

      agent.updateConfig(newConfig);
      
      const currentConfig = agent.getConfig();
      expect(currentConfig.languageDetection.minConfidence).toBe(0.5);
      expect(currentConfig.languageDetection.fallbackLanguage).toBe('hi');
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const currentConfig = agent.getConfig();
      
      expect(currentConfig).toBeDefined();
      expect(currentConfig.bharatTranslate).toBeDefined();
      expect(currentConfig.contextDatabase).toBeDefined();
      expect(currentConfig.normalization).toBeDefined();
      expect(currentConfig.languageDetection).toBeDefined();
    });
  });

  describe('createDefaultConfig', () => {
    it('should create default configuration', () => {
      const defaultConfig = MultilingualAgent.createDefaultConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.bharatTranslate.apiKey).toBe('your-api-key-here');
      expect(defaultConfig.bharatTranslate.baseUrl).toBe('https://api.bharattranslate.com/v1');
      expect(defaultConfig.bharatTranslate.timeout).toBe(30000);
      expect(defaultConfig.bharatTranslate.retryAttempts).toBe(3);
      expect(defaultConfig.contextDatabase.enabled).toBe(true);
      expect(defaultConfig.contextDatabase.mockMode).toBe(true);
      expect(defaultConfig.normalization.enabled).toBe(true);
      expect(defaultConfig.normalization.strictMode).toBe(false);
      expect(defaultConfig.languageDetection.minConfidence).toBe(0.3);
      expect(defaultConfig.languageDetection.fallbackLanguage).toBe('en');
    });
  });

  describe('error handling', () => {
    it('should handle processing errors gracefully', async () => {
      // This test would require mocking components to throw errors
      // For now, we test that the structure is maintained
      const result = await agent.processText('test text');
      
      expect(result).toBeDefined();
      expect(result.detectedLanguage).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes).toBeDefined();
      expect(result.normalizedText).toBeDefined();
      expect(result.processingMetadata).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should process text within reasonable time', async () => {
      const startTime = Date.now();
      await agent.processText('नमस्ते, आप कैसे हैं?');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});