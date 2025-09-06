/**
 * Integration tests for the complete multilingual processing pipeline
 */

import { MultilingualAgent } from '../MultilingualAgent';
import { AgentConfig, ProcessingOptions } from '../types';

describe('Integration Tests', () => {
  let agent: MultilingualAgent;
  let config: AgentConfig;

  beforeEach(() => {
    config = MultilingualAgent.createDefaultConfig();
    agent = new MultilingualAgent(config);
  });

  describe('Complete Processing Pipeline', () => {
    it('should process Hindi text through complete pipeline', async () => {
      const text = 'यार, डॉ. शर्मा ने कहा कि यह अफवाह है';
      const result = await agent.processText(text);

      // Language Detection
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.detectedLanguage.confidence).toBeGreaterThan(0);
      expect(result.detectedLanguage.script).toBe('Devanagari');

      // Translation
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);

      // Context Enrichment
      expect(result.contextNotes.region).toBeDefined();
      expect(result.contextNotes.culturalNotes.length).toBeGreaterThan(0);
      expect(result.contextNotes.commonMisinformationPatterns).toContain('अफवाह');

      // Normalization
      expect(result.normalizedText).toBeDefined();
      expect(result.normalizedText).toContain('दोस्त'); // यार -> दोस्त
      expect(result.normalizedText).toContain('डॉक्टर'); // डॉ. -> डॉक्टर

      // Metadata
      expect(result.processingMetadata.componentsUsed).toContain('LanguageDetector');
      expect(result.processingMetadata.componentsUsed).toContain('ContextFetcher');
      expect(result.processingMetadata.componentsUsed).toContain('Translator');
      expect(result.processingMetadata.componentsUsed).toContain('Normalizer');
      expect(result.processingMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should process Bengali text through complete pipeline', async () => {
      const text = 'বন্ধু, ডা. রায় বলেছেন যে এটি গুজব';
      const result = await agent.processText(text);

      expect(result.detectedLanguage.language).toBe('bn');
      expect(result.detectedLanguage.script).toBe('Bengali');
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes.commonMisinformationPatterns).toContain('গুজব');
      expect(result.normalizedText).toBeDefined();
    });

    it('should process Telugu text through complete pipeline', async () => {
      const text = 'అన్న, డా. రెడ్డి చెప్పారు ఇది పుకారు';
      const result = await agent.processText(text);

      expect(result.detectedLanguage.language).toBe('te');
      expect(result.detectedLanguage.script).toBe('Telugu');
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes.commonMisinformationPatterns).toContain('పుకారు');
      expect(result.normalizedText).toBeDefined();
    });

    it('should process Tamil text through complete pipeline', async () => {
      const text = 'தம்பி, டா. குமார் சொன்னார் இது வதந்தி';
      const result = await agent.processText(text);

      expect(result.detectedLanguage.language).toBe('ta');
      expect(result.detectedLanguage.script).toBe('Tamil');
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes.commonMisinformationPatterns).toContain('வதந்தி');
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Cross-Language Processing', () => {
    it('should handle code-switching between Hindi and English', async () => {
      const text = 'Hello नमस्ते, how are you? आप कैसे हैं?';
      const result = await agent.processText(text);

      expect(result.detectedLanguage.language).toBe('hi'); // Primary language
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle code-switching between Bengali and English', async () => {
      const text = 'Hello নমস্কার, how are you? আপনি কেমন আছেন?';
      const result = await agent.processText(text);

      expect(result.detectedLanguage.language).toBe('bn');
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple texts in different languages', async () => {
      const texts = [
        'नमस्ते, आप कैसे हैं?',
        'নমস্কার, আপনি কেমন আছেন?',
        'నమస్కారం, మీరు ఎలా ఉన్నారు?',
        'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
        'Hello, how are you?'
      ];

      const results = await agent.processBatch(texts);

      expect(results).toHaveLength(5);
      expect(results[0].detectedLanguage.language).toBe('hi');
      expect(results[1].detectedLanguage.language).toBe('bn');
      expect(results[2].detectedLanguage.language).toBe('te');
      expect(results[3].detectedLanguage.language).toBe('ta');
      expect(results[4].detectedLanguage.language).toBe('en');

      // All results should have complete processing
      results.forEach(result => {
        expect(result.translatedText).toBeDefined();
        expect(result.contextNotes.region).toBeDefined();
        expect(result.normalizedText).toBeDefined();
        expect(result.processingMetadata.componentsUsed.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Custom Processing Options', () => {
    it('should process with translation disabled', async () => {
      const options: ProcessingOptions = {
        enableTranslation: false,
        enableContextEnrichment: true,
        enableNormalization: true,
        targetLanguage: 'en',
        includeConfidence: true,
        includeMetadata: true
      };

      const result = await agent.processText('नमस्ते, आप कैसे हैं?', options);

      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBe('नमस्ते, आप कैसे हैं?'); // No translation
      expect(result.contextNotes.region).toBeDefined(); // Context enabled
      expect(result.normalizedText).toBeDefined(); // Normalization enabled
      expect(result.processingMetadata.componentsUsed).not.toContain('Translator');
    });

    it('should process with context enrichment disabled', async () => {
      const options: ProcessingOptions = {
        enableTranslation: true,
        enableContextEnrichment: false,
        enableNormalization: true,
        targetLanguage: 'en',
        includeConfidence: true,
        includeMetadata: true
      };

      const result = await agent.processText('नमस्ते, आप कैसे हैं?', options);

      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined(); // Translation enabled
      expect(result.contextNotes.region).toBe('Unknown'); // Context disabled
      expect(result.normalizedText).toBeDefined(); // Normalization enabled
      expect(result.processingMetadata.componentsUsed).not.toContain('ContextFetcher');
    });

    it('should process with normalization disabled', async () => {
      const options: ProcessingOptions = {
        enableTranslation: true,
        enableContextEnrichment: true,
        enableNormalization: false,
        targetLanguage: 'en',
        includeConfidence: true,
        includeMetadata: true
      };

      const result = await agent.processText('यार, आप कैसे हैं?', options);

      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined(); // Translation enabled
      expect(result.contextNotes.region).toBeDefined(); // Context enabled
      expect(result.normalizedText).toBe('यार, आप कैसे हैं?'); // No normalization
      expect(result.processingMetadata.componentsUsed).not.toContain('Normalizer');
    });
  });

  describe('Error Recovery', () => {
    it('should handle processing errors gracefully', async () => {
      // Test with text that might cause issues
      const text = '!@#$%^&*()_+{}|:"<>?[]\\;\',./';
      const result = await agent.processText(text);

      expect(result).toBeDefined();
      expect(result.detectedLanguage).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes).toBeDefined();
      expect(result.normalizedText).toBeDefined();
      expect(result.processingMetadata).toBeDefined();
    });

    it('should handle very long text', async () => {
      const longText = 'नमस्ते '.repeat(1000);
      const result = await agent.processText(longText);

      expect(result).toBeDefined();
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined();
      expect(result.contextNotes.region).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should process text within reasonable time', async () => {
      const startTime = Date.now();
      await agent.processText('नमस्ते, आप कैसे हैं?');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle batch processing efficiently', async () => {
      const texts = Array(10).fill('नमस्ते, आप कैसे हैं?');
      const startTime = Date.now();
      
      const results = await agent.processBatch(texts);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Configuration Changes', () => {
    it('should handle configuration updates', async () => {
      // Update configuration
      agent.updateConfig({
        languageDetection: {
          minConfidence: 0.5,
          fallbackLanguage: 'hi'
        }
      });

      const result = await agent.processText('नमस्ते, आप कैसे हैं?');
      expect(result.detectedLanguage.language).toBe('hi');
    });
  });
});