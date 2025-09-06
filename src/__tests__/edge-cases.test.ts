/**
 * Edge case tests for the multilingual processing agent
 */

import { MultilingualAgent } from '../MultilingualAgent';
import { LanguageDetector } from '../components/LanguageDetector';
import { ContextFetcher } from '../components/ContextFetcher';
import { Translator } from '../components/Translator';
import { Normalizer } from '../components/Normalizer';
import { AgentConfig } from '../types';

describe('Edge Cases', () => {
  let agent: MultilingualAgent;
  let config: AgentConfig;

  beforeEach(() => {
    config = MultilingualAgent.createDefaultConfig();
    agent = new MultilingualAgent(config);
  });

  describe('Empty and Null Inputs', () => {
    it('should handle empty string', async () => {
      const result = await agent.processText('');
      expect(result.detectedLanguage.language).toBe('en');
      expect(result.detectedLanguage.confidence).toBe(0);
      expect(result.translatedText).toBe('');
      expect(result.normalizedText).toBe('');
    });

    it('should handle whitespace-only string', async () => {
      const result = await agent.processText('   \n\t   ');
      expect(result.detectedLanguage.language).toBe('en');
      expect(result.detectedLanguage.confidence).toBe(0);
      expect(result.translatedText).toBe('   \n\t   ');
      expect(result.normalizedText).toBe('   \n\t   ');
    });

    it('should handle string with only punctuation', async () => {
      const result = await agent.processText('!@#$%^&*()');
      expect(result.detectedLanguage.language).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle string with only numbers', async () => {
      const result = await agent.processText('1234567890');
      expect(result.detectedLanguage.language).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Very Long Inputs', () => {
    it('should handle very long text', async () => {
      const longText = 'नमस्ते '.repeat(2000);
      const result = await agent.processText(longText);
      
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
      expect(result.processingMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle text with maximum length', async () => {
      const maxText = 'नमस्ते '.repeat(1000); // Close to 10000 characters
      const result = await agent.processText(maxText);
      
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle emojis', async () => {
      const result = await agent.processText('नमस्ते 😊 आप कैसे हैं?');
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle mixed scripts', async () => {
      const result = await agent.processText('नमस्ते Hello 你好');
      expect(result.detectedLanguage.language).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle Unicode normalization', async () => {
      const result = await agent.processText('नमस्ते'); // Normal form
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle zero-width characters', async () => {
      const result = await agent.processText('नमस्ते\u200Bआप'); // Zero-width space
      expect(result.detectedLanguage.language).toBe('hi');
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Language Detection Edge Cases', () => {
    it('should handle text with very low confidence', async () => {
      const result = await agent.processText('a');
      expect(result.detectedLanguage.language).toBeDefined();
      expect(result.detectedLanguage.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with mixed languages', async () => {
      const result = await agent.processText('Hello नमस्ते Bonjour');
      expect(result.detectedLanguage.language).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle text with no recognizable language', async () => {
      const result = await agent.processText('xyzabc123');
      expect(result.detectedLanguage.language).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Translation Edge Cases', () => {
    it('should handle untranslatable text', async () => {
      const result = await agent.processText('!@#$%^&*()');
      expect(result.translatedText).toBeDefined();
      expect(result.processingMetadata.errors.length).toBe(0);
    });

    it('should handle text with no translation needed', async () => {
      const result = await agent.processText('Hello, how are you?');
      expect(result.translatedText).toBe('Hello, how are you?');
      expect(result.processingMetadata.componentsUsed).not.toContain('Translator');
    });

    it('should handle text with special formatting', async () => {
      const result = await agent.processText('नमस्ते\n\nआप कैसे हैं?');
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('Context Enrichment Edge Cases', () => {
    it('should handle text with no cultural context', async () => {
      const result = await agent.processText('123456');
      expect(result.contextNotes.region).toBeDefined();
      expect(result.contextNotes.culturalNotes).toBeInstanceOf(Array);
    });

    it('should handle text with multiple cultural references', async () => {
      const result = await agent.processText('दिवाली त्योहार में राजनीतिक बहस चल रही है');
      expect(result.contextNotes.culturalNotes.length).toBeGreaterThan(0);
      expect(result.contextNotes.commonMisinformationPatterns).toBeInstanceOf(Array);
    });
  });

  describe('Normalization Edge Cases', () => {
    it('should handle text with no normalization needed', async () => {
      const result = await agent.processText('सामान्य पाठ');
      expect(result.normalizedText).toBe('सामान्य पाठ');
      expect(result.processingMetadata.componentsUsed).toContain('Normalizer');
    });

    it('should handle text with multiple normalization rules', async () => {
      const result = await agent.processText('यार, डॉ. शर्मा दिमाग खराब है');
      expect(result.normalizedText).toContain('दोस्त');
      expect(result.normalizedText).toContain('डॉक्टर');
      expect(result.normalizedText).toContain('पागल');
    });

    it('should handle text with overlapping normalization rules', async () => {
      const result = await agent.processText('यार यार यार');
      expect(result.normalizedText).toContain('दोस्त');
      expect(result.normalizedText).not.toContain('यार');
    });
  });

  describe('Code-Switching Edge Cases', () => {
    it('should handle rapid code-switching', async () => {
      const result = await agent.detectCodeSwitching('Hello नमस्ते Hello नमस्ते');
      expect(result.isCodeSwitching).toBe(true);
      expect(result.languages).toContain('hi');
      expect(result.languages).toContain('en');
    });

    it('should handle code-switching with punctuation', async () => {
      const result = await agent.detectCodeSwitching('Hello! नमस्ते? How are you? आप कैसे हैं?');
      expect(result.isCodeSwitching).toBe(true);
      expect(result.segments.length).toBeGreaterThan(1);
    });

    it('should handle single-word code-switching', async () => {
      const result = await agent.detectCodeSwitching('Hello नमस्ते');
      expect(result.isCodeSwitching).toBe(true);
      expect(result.languages).toContain('hi');
      expect(result.languages).toContain('en');
    });
  });

  describe('Batch Processing Edge Cases', () => {
    it('should handle empty batch', async () => {
      const results = await agent.processBatch([]);
      expect(results).toHaveLength(0);
    });

    it('should handle batch with mixed valid and invalid texts', async () => {
      const texts = ['नमस्ते', '', 'Hello', '   ', 'नमस्ते आप कैसे हैं?'];
      const results = await agent.processBatch(texts);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.detectedLanguage).toBeDefined();
        expect(result.translatedText).toBeDefined();
        expect(result.normalizedText).toBeDefined();
      });
    });

    it('should handle batch with very long texts', async () => {
      const texts = [
        'नमस्ते',
        'नमस्ते '.repeat(1000),
        'Hello'
      ];
      const results = await agent.processBatch(texts);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.detectedLanguage).toBeDefined();
        expect(result.translatedText).toBeDefined();
        expect(result.normalizedText).toBeDefined();
      });
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        ...config,
        languageDetection: {
          minConfidence: -1,
          fallbackLanguage: 'invalid'
        }
      };

      const customAgent = new MultilingualAgent(invalidConfig);
      const result = await customAgent.processText('नमस्ते');
      
      expect(result).toBeDefined();
      expect(result.detectedLanguage).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
    });

    it('should handle configuration updates during processing', async () => {
      const result1 = await agent.processText('नमस्ते');
      expect(result1.detectedLanguage.language).toBe('hi');

      agent.updateConfig({
        languageDetection: {
          minConfidence: 0.9,
          fallbackLanguage: 'en'
        }
      });

      const result2 = await agent.processText('नमस्ते');
      expect(result2).toBeDefined();
      expect(result2.detectedLanguage).toBeDefined();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle repeated processing without memory leaks', async () => {
      for (let i = 0; i < 100; i++) {
        const result = await agent.processText('नमस्ते, आप कैसे हैं?');
        expect(result).toBeDefined();
        expect(result.detectedLanguage.language).toBe('hi');
      }
    });

    it('should handle concurrent processing', async () => {
      const promises = Array(10).fill(null).map(() => 
        agent.processText('नमस्ते, आप कैसे हैं?')
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.detectedLanguage.language).toBe('hi');
      });
    });
  });

  describe('Error Recovery Edge Cases', () => {
    it('should handle processing errors gracefully', async () => {
      // Test with text that might cause issues
      const problematicText = 'नमस्ते'.repeat(10000) + '!@#$%^&*()';
      const result = await agent.processText(problematicText);
      
      expect(result).toBeDefined();
      expect(result.detectedLanguage).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.normalizedText).toBeDefined();
      expect(result.processingMetadata).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const result = await agent.processTextWithValidation('');
      expect(result.processingMetadata.errors).toContain('Text is empty or contains only whitespace');
      expect(result.processingMetadata.componentsUsed).toHaveLength(0);
    });
  });
});