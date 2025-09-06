/**
 * Unit tests for LanguageDetector
 */

import { LanguageDetector } from '../components/LanguageDetector';

describe('LanguageDetector', () => {
  let detector: LanguageDetector;

  beforeEach(() => {
    detector = new LanguageDetector(0.3, 'en');
  });

  describe('detectLanguage', () => {
    it('should detect Hindi text', async () => {
      const result = await detector.detectLanguage('नमस्ते, आप कैसे हैं?');
      expect(result.language).toBe('hi');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.script).toBe('Devanagari');
    });

    it('should detect Bengali text', async () => {
      const result = await detector.detectLanguage('নমস্কার, আপনি কেমন আছেন?');
      expect(result.language).toBe('bn');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.script).toBe('Bengali');
    });

    it('should detect Telugu text', async () => {
      const result = await detector.detectLanguage('నమస్కారం, మీరు ఎలా ఉన్నారు?');
      expect(result.language).toBe('te');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.script).toBe('Telugu');
    });

    it('should detect Tamil text', async () => {
      const result = await detector.detectLanguage('வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?');
      expect(result.language).toBe('ta');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.script).toBe('Tamil');
    });

    it('should detect English text', async () => {
      const result = await detector.detectLanguage('Hello, how are you?');
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.script).toBe('Latin');
    });

    it('should handle empty text', async () => {
      const result = await detector.detectLanguage('');
      expect(result.language).toBe('en');
      expect(result.confidence).toBe(0);
      expect(result.script).toBe('Unknown');
    });

    it('should handle whitespace-only text', async () => {
      const result = await detector.detectLanguage('   \n\t   ');
      expect(result.language).toBe('en');
      expect(result.confidence).toBe(0);
      expect(result.script).toBe('Unknown');
    });

    it('should detect dialect for Hindi text', async () => {
      const result = await detector.detectLanguage('हरियाणा में बहुत अच्छा है');
      expect(result.language).toBe('hi');
      expect(result.dialect).toBe('Haryanvi');
    });

    it('should detect dialect for Bengali text', async () => {
      const result = await detector.detectLanguage('সিলেটে খুব ভালো');
      expect(result.language).toBe('bn');
      expect(result.dialect).toBe('Sylheti');
    });
  });

  describe('detectCodeSwitching', () => {
    it('should detect code-switching between Hindi and English', async () => {
      const result = await detector.detectCodeSwitching('Hello नमस्ते, how are you? आप कैसे हैं?');
      expect(result.isCodeSwitching).toBe(true);
      expect(result.languages).toContain('hi');
      expect(result.languages).toContain('en');
      expect(result.segments.length).toBeGreaterThan(1);
    });

    it('should detect single language text', async () => {
      const result = await detector.detectCodeSwitching('नमस्ते, आप कैसे हैं?');
      expect(result.isCodeSwitching).toBe(false);
      expect(result.languages).toHaveLength(1);
      expect(result.languages[0]).toBe('hi');
    });

    it('should handle empty text in code-switching detection', async () => {
      const result = await detector.detectCodeSwitching('');
      expect(result.isCodeSwitching).toBe(false);
      expect(result.languages).toHaveLength(0);
      expect(result.segments).toHaveLength(0);
    });
  });

  describe('configuration', () => {
    it('should use custom minimum confidence', async () => {
      const customDetector = new LanguageDetector(0.8, 'en');
      const result = await customDetector.detectLanguage('नमस्ते');
      // The exact behavior depends on franc's confidence scores
      expect(result.language).toBeDefined();
    });

    it('should use custom fallback language', async () => {
      const customDetector = new LanguageDetector(0.3, 'hi');
      const result = await customDetector.detectLanguage('');
      expect(result.language).toBe('hi');
    });
  });

  describe('error handling', () => {
    it('should handle malformed text gracefully', async () => {
      const result = await detector.detectLanguage('!@#$%^&*()');
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long text', async () => {
      const longText = 'नमस्ते '.repeat(1000);
      const result = await detector.detectLanguage(longText);
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });
});