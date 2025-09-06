/**
 * Unit tests for Translator
 */

import { Translator } from '../components/Translator';
import { BharatTranslateConfig } from '../types';

describe('Translator', () => {
  let translator: Translator;
  let config: BharatTranslateConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.test.com',
      timeout: 5000,
      retryAttempts: 2
    };
    translator = new Translator(config, true); // Mock mode
  });

  describe('translate', () => {
    it('should translate Hindi to English', async () => {
      const result = await translator.translate('नमस्ते', 'hi', 'en');
      
      expect(result.originalText).toBe('नमस्ते');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('hi');
      expect(result.targetLanguage).toBe('en');
      expect(result.confidence).toBe(0.85);
    });

    it('should translate Bengali to English', async () => {
      const result = await translator.translate('নমস্কার', 'bn', 'en');
      
      expect(result.originalText).toBe('নমস্কার');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('bn');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Telugu to English', async () => {
      const result = await translator.translate('నమస్కారం', 'te', 'en');
      
      expect(result.originalText).toBe('నమస్కారం');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('te');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Tamil to English', async () => {
      const result = await translator.translate('வணக்கம்', 'ta', 'en');
      
      expect(result.originalText).toBe('வணக்கம்');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('ta');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Marathi to English', async () => {
      const result = await translator.translate('नमस्कार', 'mr', 'en');
      
      expect(result.originalText).toBe('नमस्कार');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('mr');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Gujarati to English', async () => {
      const result = await translator.translate('નમસ્તે', 'gu', 'en');
      
      expect(result.originalText).toBe('નમસ્તે');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('gu');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Kannada to English', async () => {
      const result = await translator.translate('ನಮಸ್ಕಾರ', 'kn', 'en');
      
      expect(result.originalText).toBe('ನಮಸ್ಕಾರ');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('kn');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Malayalam to English', async () => {
      const result = await translator.translate('നമസ്കാരം', 'ml', 'en');
      
      expect(result.originalText).toBe('നമസ്കാരം');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('ml');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Odia to English', async () => {
      const result = await translator.translate('ନମସ୍କାର', 'or', 'en');
      
      expect(result.originalText).toBe('ନମସ୍କାର');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('or');
      expect(result.targetLanguage).toBe('en');
    });

    it('should translate Punjabi to English', async () => {
      const result = await translator.translate('ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'pa', 'en');
      
      expect(result.originalText).toBe('ਸਤ ਸ੍ਰੀ ਅਕਾਲ');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('pa');
      expect(result.targetLanguage).toBe('en');
    });

    it('should handle cross-language translations', async () => {
      const result = await translator.translate('नमस्ते', 'hi', 'bn');
      
      expect(result.originalText).toBe('नमस्ते');
      expect(result.translatedText).toBe('[Hindi to Bengali: नमस्ते]');
      expect(result.sourceLanguage).toBe('hi');
      expect(result.targetLanguage).toBe('bn');
    });

    it('should handle same source and target language', async () => {
      const result = await translator.translate('Hello', 'en', 'en');
      
      expect(result.originalText).toBe('Hello');
      expect(result.translatedText).toBe('Hello');
      expect(result.sourceLanguage).toBe('en');
      expect(result.targetLanguage).toBe('en');
      expect(result.confidence).toBe(1.0);
    });

    it('should detect dialect from text', async () => {
      const result = await translator.translate('हरियाणा में बहुत अच्छा है', 'hi', 'en');
      
      expect(result.detectedDialect).toBe('Haryanvi');
    });

    it('should handle unknown text gracefully', async () => {
      const result = await translator.translate('unknown text', 'hi', 'en');
      
      expect(result.originalText).toBe('unknown text');
      expect(result.translatedText).toBe('[Hindi to English: unknown text]');
      expect(result.sourceLanguage).toBe('hi');
      expect(result.targetLanguage).toBe('en');
    });
  });

  describe('translateBatch', () => {
    it('should translate multiple texts', async () => {
      const texts = ['नमस्ते', 'धन्यवाद', 'कैसे हैं आप'];
      const results = await translator.translateBatch(texts, 'hi', 'en');
      
      expect(results).toHaveLength(3);
      expect(results[0].translatedText).toBe('Hello');
      expect(results[1].translatedText).toBe('Thank you');
      expect(results[2].translatedText).toBe('How are you');
    });

    it('should handle empty batch', async () => {
      const results = await translator.translateBatch([], 'hi', 'en');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('getSupportedLanguagePairs', () => {
    it('should return supported language pairs', () => {
      const pairs = translator.getSupportedLanguagePairs();
      
      expect(pairs).toBeInstanceOf(Array);
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs).toContainEqual({ source: 'hi', target: 'en' });
      expect(pairs).toContainEqual({ source: 'bn', target: 'en' });
      expect(pairs).toContainEqual({ source: 'te', target: 'en' });
    });
  });

  describe('error handling', () => {
    it('should handle empty text', async () => {
      const result = await translator.translate('', 'hi', 'en');
      
      expect(result.originalText).toBe('');
      expect(result.translatedText).toBe('[Hindi to English: ]');
    });

    it('should handle very long text', async () => {
      const longText = 'नमस्ते '.repeat(1000);
      const result = await translator.translate(longText, 'hi', 'en');
      
      expect(result.originalText).toBe(longText);
      expect(result.translatedText).toBe(`[Hindi to English: ${longText}]`);
    });

    it('should handle special characters', async () => {
      const result = await translator.translate('!@#$%^&*()', 'hi', 'en');
      
      expect(result.originalText).toBe('!@#$%^&*()');
      expect(result.translatedText).toBe('[Hindi to English: !@#$%^&*()]');
    });
  });

  describe('configuration', () => {
    it('should use provided configuration', () => {
      expect(translator).toBeDefined();
      // Configuration is used internally, so we test that the object is created
    });

    it('should handle different timeout values', () => {
      const customConfig = { ...config, timeout: 10000 };
      const customTranslator = new Translator(customConfig, true);
      
      expect(customTranslator).toBeDefined();
    });

    it('should handle different retry attempts', () => {
      const customConfig = { ...config, retryAttempts: 5 };
      const customTranslator = new Translator(customConfig, true);
      
      expect(customTranslator).toBeDefined();
    });
  });
});