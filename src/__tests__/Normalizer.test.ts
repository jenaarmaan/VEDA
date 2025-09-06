/**
 * Unit tests for Normalizer
 */

import { Normalizer } from '../components/Normalizer';

describe('Normalizer', () => {
  let normalizer: Normalizer;

  beforeEach(() => {
    normalizer = new Normalizer(false); // Non-strict mode
  });

  describe('normalize', () => {
    it('should normalize Hindi slang', async () => {
      const result = await normalizer.normalize('यार, तुम कैसे हो?', 'hi');
      
      expect(result.originalText).toBe('यार, तुम कैसे हो?');
      expect(result.normalizedText).toContain('दोस्त');
      expect(result.appliedRules).toContain('slang_mapping');
      expect(result.slangMappings).toContainEqual({
        original: 'यार',
        normalized: 'दोस्त',
        type: 'slang'
      });
    });

    it('should normalize Bengali slang', async () => {
      const result = await normalizer.normalize('বন্ধু, তুমি কেমন আছো?', 'bn');
      
      expect(result.originalText).toBe('বন্ধু, তুমি কেমন আছো?');
      expect(result.normalizedText).toContain('বন্ধু');
      expect(result.appliedRules).toContain('slang_mapping');
    });

    it('should normalize Telugu slang', async () => {
      const result = await normalizer.normalize('అన్న, మీరు ఎలా ఉన్నారు?', 'te');
      
      expect(result.originalText).toBe('అన్న, మీరు ఎలా ఉన్నారు?');
      expect(result.normalizedText).toContain('అన్న');
      expect(result.appliedRules).toContain('slang_mapping');
    });

    it('should normalize Tamil slang', async () => {
      const result = await normalizer.normalize('தம்பி, நீங்கள் எப்படி இருக்கிறீர்கள்?', 'ta');
      
      expect(result.originalText).toBe('தம்பி, நீங்கள் எப்படி இருக்கிறீர்கள்?');
      expect(result.normalizedText).toContain('தம்பி');
      expect(result.appliedRules).toContain('slang_mapping');
    });

    it('should normalize English slang', async () => {
      const result = await normalizer.normalize('Hey bro, how are you?', 'en');
      
      expect(result.originalText).toBe('Hey bro, how are you?');
      expect(result.normalizedText).toContain('brother');
      expect(result.appliedRules).toContain('slang_mapping');
      expect(result.slangMappings).toContainEqual({
        original: 'bro',
        normalized: 'brother',
        type: 'slang'
      });
    });

    it('should normalize abbreviations', async () => {
      const result = await normalizer.normalize('डॉ. शर्मा आए हैं', 'hi');
      
      expect(result.originalText).toBe('डॉ. शर्मा आए हैं');
      expect(result.normalizedText).toContain('डॉक्टर');
      expect(result.appliedRules).toContain('abbreviation_expansion');
    });

    it('should normalize idioms', async () => {
      const result = await normalizer.normalize('वह दिमाग खराब है', 'hi');
      
      expect(result.originalText).toBe('वह दिमाग खराब है');
      expect(result.normalizedText).toContain('पागल');
      expect(result.appliedRules).toContain('idiom_mapping');
      expect(result.slangMappings).toContainEqual({
        original: 'दिमाग खराब',
        normalized: 'पागल',
        type: 'idiom'
      });
    });

    it('should handle text with no normalization needed', async () => {
      const result = await normalizer.normalize('सामान्य पाठ', 'hi');
      
      expect(result.originalText).toBe('सामान्य पाठ');
      expect(result.normalizedText).toBe('सामान्य पाठ');
      expect(result.appliedRules).toContain('text_cleanup');
      expect(result.slangMappings).toHaveLength(0);
    });

    it('should handle unsupported language', async () => {
      const result = await normalizer.normalize('test text', 'xyz');
      
      expect(result.originalText).toBe('test text');
      expect(result.normalizedText).toBe('test text');
      expect(result.appliedRules).toContain('no_rules_found');
      expect(result.slangMappings).toHaveLength(0);
    });

    it('should clean up extra spaces', async () => {
      const result = await normalizer.normalize('  यार   ,   तुम   कैसे   हो?  ', 'hi');
      
      expect(result.originalText).toBe('  यार   ,   तुम   कैसे   हो?  ');
      expect(result.normalizedText).toBe('दोस्त, तुम कैसे हो?');
      expect(result.appliedRules).toContain('text_cleanup');
    });

    it('should handle multiple types of normalization', async () => {
      const result = await normalizer.normalize('यार, डॉ. शर्मा दिमाग खराब है', 'hi');
      
      expect(result.originalText).toBe('यार, डॉ. शर्मा दिमाग खराब है');
      expect(result.normalizedText).toContain('दोस्त');
      expect(result.normalizedText).toContain('डॉक्टर');
      expect(result.normalizedText).toContain('पागल');
      expect(result.appliedRules).toContain('slang_mapping');
      expect(result.appliedRules).toContain('abbreviation_expansion');
      expect(result.appliedRules).toContain('idiom_mapping');
    });
  });

  describe('normalizeBatch', () => {
    it('should normalize multiple texts', async () => {
      const texts = ['यार, कैसे हो?', 'बहुत अच्छा', 'डॉ. शर्मा'];
      const results = await normalizer.normalizeBatch(texts, 'hi');
      
      expect(results).toHaveLength(3);
      expect(results[0].normalizedText).toContain('दोस्त');
      expect(results[1].normalizedText).toBe('बहुत अच्छा');
      expect(results[2].normalizedText).toContain('डॉक्टर');
    });

    it('should handle empty batch', async () => {
      const results = await normalizer.normalizeBatch([], 'hi');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('getNormalizationRules', () => {
    it('should return normalization rules for Hindi', () => {
      const rules = normalizer.getNormalizationRules('hi');
      
      expect(rules).toBeDefined();
      expect(rules?.slangMappings).toBeDefined();
      expect(rules?.slangMappings['यार']).toBe('दोस्त');
      expect(rules?.commonAbbreviations['डॉ.']).toBe('डॉक्टर');
      expect(rules?.idiomMappings['दिमाग खराब']).toBe('पागल');
    });

    it('should return normalization rules for English', () => {
      const rules = normalizer.getNormalizationRules('en');
      
      expect(rules).toBeDefined();
      expect(rules?.slangMappings).toBeDefined();
      expect(rules?.slangMappings['bro']).toBe('brother');
      expect(rules?.commonAbbreviations['Dr.']).toBe('Doctor');
    });

    it('should return undefined for unsupported language', () => {
      const rules = normalizer.getNormalizationRules('xyz');
      
      expect(rules).toBeUndefined();
    });
  });

  describe('updateNormalizationRules', () => {
    it('should update normalization rules for a language', () => {
      const newRules = {
        slangMappings: { 'test': 'normalized' },
        dialectMappings: {},
        idiomMappings: {},
        commonAbbreviations: {},
        regionalVariations: {}
      };

      normalizer.updateNormalizationRules('test', newRules);
      
      const rules = normalizer.getNormalizationRules('test');
      expect(rules).toBeDefined();
      expect(rules?.slangMappings['test']).toBe('normalized');
    });
  });

  describe('error handling', () => {
    it('should handle empty text', async () => {
      const result = await normalizer.normalize('', 'hi');
      
      expect(result.originalText).toBe('');
      expect(result.normalizedText).toBe('');
      expect(result.appliedRules).toContain('text_cleanup');
    });

    it('should handle text with only special characters', async () => {
      const result = await normalizer.normalize('!@#$%^&*()', 'hi');
      
      expect(result.originalText).toBe('!@#$%^&*()');
      expect(result.normalizedText).toBe('!@#$%^&*()');
      expect(result.appliedRules).toContain('text_cleanup');
    });

    it('should handle very long text', async () => {
      const longText = 'यार '.repeat(1000);
      const result = await normalizer.normalize(longText, 'hi');
      
      expect(result.originalText).toBe(longText);
      expect(result.normalizedText).toContain('दोस्त');
      expect(result.appliedRules).toContain('slang_mapping');
    });
  });

  describe('configuration', () => {
    it('should work in strict mode', () => {
      const strictNormalizer = new Normalizer(true);
      expect(strictNormalizer).toBeDefined();
    });

    it('should work in non-strict mode', () => {
      const nonStrictNormalizer = new Normalizer(false);
      expect(nonStrictNormalizer).toBeDefined();
    });
  });
});