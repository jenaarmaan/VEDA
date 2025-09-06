/**
 * ContextFetcher - Queries knowledge base for cultural context insights
 */

import { CulturalContext, ContextDatabaseEntry, SupportedLanguage } from '../types';
import { REGIONAL_MAPPINGS, COMMON_MISINFORMATION_PATTERNS } from '../constants/languages';

export class ContextFetcher {
  private mockMode: boolean;
  private contextDatabase: Map<string, ContextDatabaseEntry>;

  constructor(mockMode: boolean = true) {
    this.mockMode = mockMode;
    this.contextDatabase = new Map();
    this.initializeMockData();
  }

  /**
   * Fetches cultural context for a given language and region
   */
  async fetchContext(language: string, region?: string): Promise<CulturalContext> {
    if (this.mockMode) {
      return this.getMockContext(language, region);
    }

    // In a real implementation, this would query a database or API
    const key = `${language}_${region || 'default'}`;
    const entry = this.contextDatabase.get(key);
    
    if (entry) {
      return entry.context;
    }

    // Fallback to default context for the language
    return this.getMockContext(language);
  }

  /**
   * Fetches context based on detected language patterns
   */
  async fetchContextByPatterns(
    text: string, 
    language: string, 
    detectedPatterns: string[]
  ): Promise<CulturalContext> {
    const baseContext = await this.fetchContext(language);
    
    // Enhance context based on detected patterns
    const enhancedContext: CulturalContext = {
      ...baseContext,
      culturalNotes: [
        ...baseContext.culturalNotes,
        ...this.getPatternBasedNotes(detectedPatterns, language)
      ],
      commonMisinformationPatterns: [
        ...baseContext.commonMisinformationPatterns,
        ...this.getPatternBasedMisinformation(detectedPatterns, language)
      ]
    };

    return enhancedContext;
  }

  /**
   * Gets mock cultural context data
   */
  private getMockContext(language: string, region?: string): CulturalContext {
    const regions = REGIONAL_MAPPINGS[language as SupportedLanguage] || ['Unknown'];
    const selectedRegion = region || regions[0];

    const mockContexts: Record<string, CulturalContext> = {
      'hi': {
        region: selectedRegion,
        culturalNotes: [
          'Hindi is widely spoken across North India',
          'Cultural context includes Bollywood influence',
          'Religious festivals like Diwali and Holi are significant',
          'Political discourse often involves national identity'
        ],
        commonMisinformationPatterns: [
          'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
          'वायरल हो रहा है', 'तुरंत शेयर करें', 'सच्चाई सामने आई'
        ],
        regionalBiases: [
          'North vs South India comparisons',
          'Hindi imposition debates',
          'Regional development disparities'
        ],
        slangPatterns: [
          'यार', 'भाई', 'अरे', 'अच्छा', 'ठीक है'
        ],
        religiousContext: 'Hindu majority with significant Muslim, Sikh, Christian populations',
        politicalContext: 'Federal democracy with strong regional parties'
      },
      'bn': {
        region: selectedRegion,
        culturalNotes: [
          'Bengali culture emphasizes literature and arts',
          'Durga Puja is the most important festival',
          'Strong tradition of intellectual discourse',
          'Historical connection to Bangladesh'
        ],
        commonMisinformationPatterns: [
          'গুজব', 'ভুল তথ্য', 'মিথ্যা খবর', 'ভ্রান্তিমূলক তথ্য',
          'ভাইরাল হচ্ছে', 'তৎক্ষণাৎ শেয়ার করুন', 'সত্য প্রকাশিত'
        ],
        regionalBiases: [
          'Bengal vs rest of India',
          'Communist legacy discussions',
          'Industrial development debates'
        ],
        slangPatterns: [
          'বন্ধু', 'ভাই', 'আরে', 'ভালো', 'ঠিক আছে'
        ],
        religiousContext: 'Hindu majority with significant Muslim population',
        politicalContext: 'Strong left-wing tradition, current BJP-TMC rivalry'
      },
      'te': {
        region: selectedRegion,
        culturalNotes: [
          'Telugu culture values education and technology',
          'Strong IT industry presence',
          'Rich tradition of classical dance and music',
          'Agricultural heritage in rural areas'
        ],
        commonMisinformationPatterns: [
          'పుకారు', 'తప్పు సమాచారం', 'అబద్ధ వార్త', 'భ్రమకర సమాచారం',
          'వైరల్ అవుతోంది', 'వెంటనే షేర్ చేయండి', 'నిజం బయటపడింది'
        ],
        regionalBiases: [
          'Andhra vs Telangana divisions',
          'Development vs welfare debates',
          'IT vs agriculture priorities'
        ],
        slangPatterns: [
          'అన్న', 'అక్క', 'అరే', 'బాగుంది', 'సరే'
        ],
        religiousContext: 'Hindu majority with significant Muslim and Christian populations',
        politicalContext: 'Recent state bifurcation, strong regional identity'
      },
      'ta': {
        region: selectedRegion,
        culturalNotes: [
          'Tamil culture has ancient literary traditions',
          'Strong Dravidian identity',
          'Film industry (Kollywood) influence',
          'Pride in Tamil language and heritage'
        ],
        commonMisinformationPatterns: [
          'வதந்தி', 'தவறான தகவல்', 'பொய் செய்தி', 'தவறான தகவல்',
          'வைரல் ஆகிறது', 'உடனடியாக பகிரவும்', 'உண்மை வெளியானது'
        ],
        regionalBiases: [
          'Tamil vs Hindi language debates',
          'Dravidian vs Aryan theories',
          'State autonomy discussions'
        ],
        slangPatterns: [
          'தம்பி', 'அக்கா', 'அரே', 'நல்லா', 'சரி'
        ],
        religiousContext: 'Hindu majority with significant Christian and Muslim populations',
        politicalContext: 'Strong Dravidian movement, current DMK government'
      },
      'en': {
        region: selectedRegion,
        culturalNotes: [
          'English is the lingua franca of India',
          'Used in education, business, and government',
          'Code-switching with local languages is common',
          'Urban, educated demographic primarily'
        ],
        commonMisinformationPatterns: [
          'rumor', 'fake news', 'misinformation', 'false information',
          'going viral', 'share immediately', 'truth revealed'
        ],
        regionalBiases: [
          'Urban vs rural divide',
          'English vs vernacular debates',
          'Global vs local perspectives'
        ],
        slangPatterns: [
          'bro', 'dude', 'awesome', 'cool', 'okay'
        ],
        religiousContext: 'Diverse religious backgrounds',
        politicalContext: 'National and international political discourse'
      }
    };

    return mockContexts[language] || this.getDefaultContext(language, selectedRegion);
  }

  /**
   * Gets default context for unsupported languages
   */
  private getDefaultContext(language: string, region: string): CulturalContext {
    return {
      region,
      culturalNotes: [
        `Cultural context for ${language} language`,
        'Regional variations may apply',
        'Context may need manual verification'
      ],
      commonMisinformationPatterns: [
        'rumor', 'fake news', 'misinformation'
      ],
      regionalBiases: [
        'Regional identity discussions',
        'Local vs national perspectives'
      ],
      slangPatterns: [
        'common slang', 'local expressions'
      ]
    };
  }

  /**
   * Gets pattern-based cultural notes
   */
  private getPatternBasedNotes(patterns: string[], language: string): string[] {
    const notes: string[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.includes('festival') || pattern.includes('त्योहार') || pattern.includes('উৎসব')) {
        notes.push('Festival-related content detected - verify dates and traditions');
      }
      if (pattern.includes('political') || pattern.includes('राजनीति') || pattern.includes('রাজনীতি')) {
        notes.push('Political content detected - check for bias and verify facts');
      }
      if (pattern.includes('religious') || pattern.includes('धर्म') || pattern.includes('ধর্ম')) {
        notes.push('Religious content detected - consider diverse perspectives');
      }
    });

    return notes;
  }

  /**
   * Gets pattern-based misinformation indicators
   */
  private getPatternBasedMisinformation(patterns: string[], language: string): string[] {
    const patterns_lower = patterns.map(p => p.toLowerCase());
    const misinformationPatterns = COMMON_MISINFORMATION_PATTERNS[language as SupportedLanguage] || [];
    
    return misinformationPatterns.filter(pattern => 
      patterns_lower.some(p => p.includes(pattern.toLowerCase()))
    );
  }

  /**
   * Initializes mock database with sample entries
   */
  private initializeMockData(): void {
    const languages: SupportedLanguage[] = ['hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'or', 'pa'];
    
    languages.forEach(lang => {
      const regions = REGIONAL_MAPPINGS[lang];
      regions.forEach(region => {
        const key = `${lang}_${region}`;
        this.contextDatabase.set(key, {
          language: lang,
          region,
          context: this.getMockContext(lang, region),
          lastUpdated: new Date()
        });
      });
    });
  }

  /**
   * Updates context database (for real implementation)
   */
  async updateContext(language: string, region: string, context: CulturalContext): Promise<void> {
    const key = `${language}_${region}`;
    this.contextDatabase.set(key, {
      language,
      region,
      context,
      lastUpdated: new Date()
    });
  }

  /**
   * Searches for context by keywords
   */
  async searchContext(keywords: string[], language: string): Promise<CulturalContext[]> {
    const results: CulturalContext[] = [];
    
    for (const [key, entry] of this.contextDatabase.entries()) {
      if (key.startsWith(language)) {
        const context = entry.context;
        const searchText = [
          ...context.culturalNotes,
          ...context.commonMisinformationPatterns,
          ...context.regionalBiases,
          ...context.slangPatterns
        ].join(' ').toLowerCase();

        if (keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
          results.push(context);
        }
      }
    }

    return results;
  }
}