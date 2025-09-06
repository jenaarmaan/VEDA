/**
 * Unit tests for ContextFetcher
 */

import { ContextFetcher } from '../components/ContextFetcher';

describe('ContextFetcher', () => {
  let contextFetcher: ContextFetcher;

  beforeEach(() => {
    contextFetcher = new ContextFetcher(true); // Mock mode
  });

  describe('fetchContext', () => {
    it('should fetch Hindi cultural context', async () => {
      const context = await contextFetcher.fetchContext('hi');
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toBeInstanceOf(Array);
      expect(context.culturalNotes.length).toBeGreaterThan(0);
      expect(context.commonMisinformationPatterns).toBeInstanceOf(Array);
      expect(context.regionalBiases).toBeInstanceOf(Array);
      expect(context.slangPatterns).toBeInstanceOf(Array);
    });

    it('should fetch Bengali cultural context', async () => {
      const context = await contextFetcher.fetchContext('bn');
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toContain('Bengali culture emphasizes literature and arts');
      expect(context.commonMisinformationPatterns).toContain('গুজব');
      expect(context.religiousContext).toBeDefined();
      expect(context.politicalContext).toBeDefined();
    });

    it('should fetch Telugu cultural context', async () => {
      const context = await contextFetcher.fetchContext('te');
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toContain('Telugu culture values education and technology');
      expect(context.commonMisinformationPatterns).toContain('పుకారు');
      expect(context.regionalBiases).toContain('Andhra vs Telangana divisions');
    });

    it('should fetch Tamil cultural context', async () => {
      const context = await contextFetcher.fetchContext('ta');
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toContain('Tamil culture has ancient literary traditions');
      expect(context.commonMisinformationPatterns).toContain('வதந்தி');
      expect(context.regionalBiases).toContain('Tamil vs Hindi language debates');
    });

    it('should fetch English cultural context', async () => {
      const context = await contextFetcher.fetchContext('en');
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toContain('English is the lingua franca of India');
      expect(context.commonMisinformationPatterns).toContain('rumor');
      expect(context.regionalBiases).toContain('Urban vs rural divide');
    });

    it('should handle unsupported language', async () => {
      const context = await contextFetcher.fetchContext('xyz');
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toContain('Cultural context for xyz language');
      expect(context.commonMisinformationPatterns).toContain('rumor');
    });

    it('should fetch context with specific region', async () => {
      const context = await contextFetcher.fetchContext('hi', 'Delhi');
      
      expect(context.region).toBe('Delhi');
      expect(context.culturalNotes).toBeInstanceOf(Array);
    });
  });

  describe('fetchContextByPatterns', () => {
    it('should enhance context based on festival patterns', async () => {
      const patterns = ['festival', 'त्योहार'];
      const context = await contextFetcher.fetchContextByPatterns(
        'दिवाली त्योहार मनाया जा रहा है',
        'hi',
        patterns
      );
      
      expect(context.culturalNotes).toContain('Festival-related content detected - verify dates and traditions');
    });

    it('should enhance context based on political patterns', async () => {
      const patterns = ['political', 'राजनीति'];
      const context = await contextFetcher.fetchContextByPatterns(
        'राजनीतिक बहस चल रही है',
        'hi',
        patterns
      );
      
      expect(context.culturalNotes).toContain('Political content detected - check for bias and verify facts');
    });

    it('should enhance context based on religious patterns', async () => {
      const patterns = ['religious', 'धर्म'];
      const context = await contextFetcher.fetchContextByPatterns(
        'धार्मिक समारोह आयोजित किया गया',
        'hi',
        patterns
      );
      
      expect(context.culturalNotes).toContain('Religious content detected - consider diverse perspectives');
    });

    it('should enhance context based on misinformation patterns', async () => {
      const patterns = ['rumor', 'अफवाह'];
      const context = await contextFetcher.fetchContextByPatterns(
        'अफवाह फैल रही है',
        'hi',
        patterns
      );
      
      expect(context.commonMisinformationPatterns).toContain('अफवाह');
    });
  });

  describe('searchContext', () => {
    it('should search context by keywords', async () => {
      const results = await contextFetcher.searchContext(['festival', 'त्योहार'], 'hi');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const results = await contextFetcher.searchContext(['nonexistent'], 'hi');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe('updateContext', () => {
    it('should update context for a language and region', async () => {
      const newContext = {
        region: 'Test Region',
        culturalNotes: ['Test note'],
        commonMisinformationPatterns: ['test pattern'],
        regionalBiases: ['test bias'],
        slangPatterns: ['test slang']
      };

      await contextFetcher.updateContext('test', 'Test Region', newContext);
      
      const fetchedContext = await contextFetcher.fetchContext('test', 'Test Region');
      expect(fetchedContext.region).toBe('Test Region');
      expect(fetchedContext.culturalNotes).toContain('Test note');
    });
  });

  describe('error handling', () => {
    it('should handle empty text gracefully', async () => {
      const context = await contextFetcher.fetchContextByPatterns('', 'hi', []);
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toBeInstanceOf(Array);
    });

    it('should handle null patterns gracefully', async () => {
      const context = await contextFetcher.fetchContextByPatterns('test', 'hi', []);
      
      expect(context.region).toBeDefined();
      expect(context.culturalNotes).toBeInstanceOf(Array);
    });
  });
});