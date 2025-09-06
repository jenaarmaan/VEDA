import { ClaimExtractor } from '../agents/ClaimExtractor';
import { EntityType } from '../types';

describe('ClaimExtractor', () => {
  let extractor: ClaimExtractor;

  beforeEach(() => {
    extractor = new ClaimExtractor();
  });

  describe('Claim Extraction', () => {
    test('should extract claims from fire incident text', async () => {
      const text = 'A house fire in Mumbai killed five people yesterday.';
      
      const claims = await extractor.extractClaims(text);
      
      expect(claims.length).toBeGreaterThan(0);
      expect(claims[0].text).toBeDefined();
      expect(claims[0].entityType).toBeDefined();
      expect(claims[0].confidence).toBeGreaterThan(0);
    });

    test('should extract location-based claims', async () => {
      const text = 'The incident occurred in Mumbai, Maharashtra.';
      
      const claims = await extractor.extractClaims(text);
      
      const locationClaims = claims.filter(claim => 
        claim.entityType === EntityType.LOCATION || 
        claim.text.toLowerCase().includes('mumbai')
      );
      
      expect(locationClaims.length).toBeGreaterThan(0);
    });

    test('should extract numerical claims', async () => {
      const text = 'Five people were killed in the accident.';
      
      const claims = await extractor.extractClaims(text);
      
      const numberClaims = claims.filter(claim => 
        claim.entityType === EntityType.NUMBER || 
        /\d+/.test(claim.text)
      );
      
      expect(numberClaims.length).toBeGreaterThan(0);
    });

    test('should extract person-related claims', async () => {
      const text = 'John Smith was injured in the incident.';
      
      const claims = await extractor.extractClaims(text);
      
      const personClaims = claims.filter(claim => 
        claim.entityType === EntityType.PERSON
      );
      
      expect(personClaims.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Matching', () => {
    test('should match casualty patterns', async () => {
      const text = 'Three people died in the fire.';
      
      const claims = await extractor.extractClaims(text);
      
      const casualtyClaims = claims.filter(claim => 
        claim.text.toLowerCase().includes('died') || 
        claim.text.toLowerCase().includes('killed')
      );
      
      expect(casualtyClaims.length).toBeGreaterThan(0);
    });

    test('should match location patterns', async () => {
      const text = 'The fire occurred in Mumbai.';
      
      const claims = await extractor.extractClaims(text);
      
      const locationClaims = claims.filter(claim => 
        claim.text.toLowerCase().includes('in mumbai') ||
        claim.text.toLowerCase().includes('occurred')
      );
      
      expect(locationClaims.length).toBeGreaterThan(0);
    });

    test('should match temporal patterns', async () => {
      const text = 'Yesterday, a fire broke out.';
      
      const claims = await extractor.extractClaims(text);
      
      const temporalClaims = claims.filter(claim => 
        claim.text.toLowerCase().includes('yesterday')
      );
      
      expect(temporalClaims.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Scoring', () => {
    test('should assign higher confidence to claims with numbers', async () => {
      const text = 'Five people were killed.';
      
      const claims = await extractor.extractClaims(text);
      
      const numberClaims = claims.filter(claim => /\d+/.test(claim.text));
      
      if (numberClaims.length > 0) {
        expect(numberClaims[0].confidence).toBeGreaterThan(0.5);
      }
    });

    test('should assign appropriate confidence to different entity types', async () => {
      const text = 'John Smith from Mumbai reported the incident.';
      
      const claims = await extractor.extractClaims(text);
      
      claims.forEach(claim => {
        expect(claim.confidence).toBeGreaterThan(0);
        expect(claim.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Deduplication', () => {
    test('should deduplicate similar claims', async () => {
      const text = 'A fire in Mumbai killed five people. The fire in Mumbai killed five people.';
      
      const claims = await extractor.extractClaims(text);
      
      // Should have fewer claims than if no deduplication occurred
      expect(claims.length).toBeLessThan(4);
    });

    test('should preserve distinct claims', async () => {
      const text = 'A fire in Mumbai killed five people. A separate incident in Delhi injured three.';
      
      const claims = await extractor.extractClaims(text);
      
      expect(claims.length).toBeGreaterThan(1);
    });
  });

  describe('Context Extraction', () => {
    test('should extract context around claims', async () => {
      const text = 'Breaking news: A house fire in Mumbai killed five people yesterday evening.';
      
      const claims = await extractor.extractClaims(text);
      
      claims.forEach(claim => {
        expect(claim.context).toBeDefined();
        expect(claim.context!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty text', async () => {
      const claims = await extractor.extractClaims('');
      
      expect(claims.length).toBe(0);
    });

    test('should handle text with no claims', async () => {
      const text = 'Hello world, how are you today?';
      
      const claims = await extractor.extractClaims(text);
      
      // Should have very few or no claims
      expect(claims.length).toBeLessThan(3);
    });

    test('should handle very long text', async () => {
      const longText = 'A fire occurred. '.repeat(1000);
      
      const claims = await extractor.extractClaims(longText);
      
      expect(claims.length).toBeGreaterThan(0);
      expect(claims.length).toBeLessThan(1000); // Should not extract too many claims
    });
  });
});