/**
 * MultilingualAgent - Main orchestrator for multilingual processing
 */

import { LanguageDetector } from './components/LanguageDetector';
import { ContextFetcher } from './components/ContextFetcher';
import { Translator } from './components/Translator';
import { Normalizer } from './components/Normalizer';
import {
  MultilingualProcessingResult,
  ProcessingOptions,
  AgentConfig,
  BharatTranslateConfig,
  LanguageDetectionResult,
  CulturalContext,
  TranslationResult,
  NormalizationResult
} from './types';

export class MultilingualAgent {
  private languageDetector: LanguageDetector;
  private contextFetcher: ContextFetcher;
  private translator: Translator;
  private normalizer: Normalizer;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.initializeComponents();
  }

  /**
   * Initializes all components with configuration
   */
  private initializeComponents(): void {
    this.languageDetector = new LanguageDetector(
      this.config.languageDetection.minConfidence,
      this.config.languageDetection.fallbackLanguage
    );

    this.contextFetcher = new ContextFetcher(
      this.config.contextDatabase.mockMode
    );

    this.translator = new Translator(
      this.config.bharatTranslate,
      this.config.contextDatabase.mockMode
    );

    this.normalizer = new Normalizer(
      this.config.normalization.strictMode
    );
  }

  /**
   * Main processing method that orchestrates all components
   */
  async processText(
    text: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<MultilingualProcessingResult> {
    const startTime = Date.now();
    const componentsUsed: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Language Detection
      const languageDetection = await this.detectLanguage(text);
      componentsUsed.push('LanguageDetector');

      if (languageDetection.confidence < this.config.languageDetection.minConfidence) {
        warnings.push(`Low confidence language detection: ${languageDetection.confidence}`);
      }

      // Step 2: Context Enrichment
      let culturalContext: CulturalContext;
      if (options.enableContextEnrichment) {
        culturalContext = await this.enrichContext(text, languageDetection);
        componentsUsed.push('ContextFetcher');
      } else {
        culturalContext = this.getEmptyContext();
      }

      // Step 3: Translation
      let translationResult: TranslationResult;
      if (options.enableTranslation && languageDetection.language !== options.targetLanguage) {
        translationResult = await this.translateText(text, languageDetection, options.targetLanguage);
        componentsUsed.push('Translator');
      } else {
        translationResult = {
          originalText: text,
          translatedText: text,
          sourceLanguage: languageDetection.language,
          targetLanguage: options.targetLanguage,
          confidence: 1.0
        };
      }

      // Step 4: Normalization
      let normalizationResult: NormalizationResult;
      if (options.enableNormalization) {
        normalizationResult = await this.normalizeText(text, languageDetection.language);
        componentsUsed.push('Normalizer');
      } else {
        normalizationResult = {
          originalText: text,
          normalizedText: text,
          appliedRules: [],
          slangMappings: []
        };
      }

      const processingTime = Date.now() - startTime;

      return {
        detectedLanguage: languageDetection,
        translatedText: translationResult.translatedText,
        contextNotes: culturalContext,
        normalizedText: normalizationResult.normalizedText,
        processingMetadata: {
          processingTime,
          componentsUsed,
          warnings,
          errors
        }
      };

    } catch (error) {
      errors.push(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        detectedLanguage: {
          language: this.config.languageDetection.fallbackLanguage,
          confidence: 0,
          script: 'Unknown'
        },
        translatedText: text,
        contextNotes: this.getEmptyContext(),
        normalizedText: text,
        processingMetadata: {
          processingTime: Date.now() - startTime,
          componentsUsed,
          warnings,
          errors
        }
      };
    }
  }

  /**
   * Detects language of the input text
   */
  private async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    return await this.languageDetector.detectLanguage(text);
  }

  /**
   * Enriches context based on detected language and patterns
   */
  private async enrichContext(
    text: string,
    languageDetection: LanguageDetectionResult
  ): Promise<CulturalContext> {
    // Extract potential patterns from text
    const patterns = this.extractPatterns(text);
    
    return await this.contextFetcher.fetchContextByPatterns(
      text,
      languageDetection.language,
      patterns
    );
  }

  /**
   * Translates text to target language
   */
  private async translateText(
    text: string,
    languageDetection: LanguageDetectionResult,
    targetLanguage: string
  ): Promise<TranslationResult> {
    return await this.translator.translate(
      text,
      languageDetection.language,
      targetLanguage
    );
  }

  /**
   * Normalizes text using language-specific rules
   */
  private async normalizeText(text: string, language: string): Promise<NormalizationResult> {
    return await this.normalizer.normalize(text, language);
  }

  /**
   * Extracts patterns from text for context enrichment
   */
  private extractPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lowerText = text.toLowerCase();

    // Check for common patterns
    const patternKeywords = [
      'festival', 'त्योहार', 'উৎসব', 'పండుగ', 'திருவிழா', 'सण', 'उत्सव',
      'political', 'राजनीति', 'রাজনীতি', 'రాజకీయ', 'அரசியல்', 'राजकीय',
      'religious', 'धर्म', 'ধর্ম', 'మతం', 'மதம்', 'धर्म',
      'rumor', 'अफवाह', 'গুজব', 'పుకారు', 'வதந்தி', 'अफवा',
      'fake', 'झूठ', 'মিথ্যা', 'అబద్ధ', 'பொய்', 'खोटे',
      'viral', 'वायरल', 'ভাইরাল', 'వైరల్', 'வைரல்', 'व्हायरल'
    ];

    patternKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        patterns.push(keyword);
      }
    });

    return patterns;
  }

  /**
   * Gets empty context as fallback
   */
  private getEmptyContext(): CulturalContext {
    return {
      region: 'Unknown',
      culturalNotes: [],
      commonMisinformationPatterns: [],
      regionalBiases: [],
      slangPatterns: []
    };
  }

  /**
   * Gets default processing options
   */
  private getDefaultOptions(): ProcessingOptions {
    return {
      enableTranslation: true,
      enableContextEnrichment: true,
      enableNormalization: true,
      targetLanguage: 'en',
      includeConfidence: true,
      includeMetadata: true
    };
  }

  /**
   * Processes multiple texts in batch
   */
  async processBatch(
    texts: string[],
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<MultilingualProcessingResult[]> {
    const results: MultilingualProcessingResult[] = [];
    
    for (const text of texts) {
      const result = await this.processText(text, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Detects code-switching in text
   */
  async detectCodeSwitching(text: string): Promise<{
    isCodeSwitching: boolean;
    languages: string[];
    segments: Array<{ text: string; language: string; confidence: number }>;
  }> {
    return await this.languageDetector.detectCodeSwitching(text);
  }

  /**
   * Gets processing statistics
   */
  getProcessingStats(): {
    supportedLanguages: string[];
    supportedLanguagePairs: Array<{ source: string; target: string }>;
    normalizationRulesCount: number;
  } {
    return {
      supportedLanguages: Object.keys(this.normalizer.getNormalizationRules('hi') || {}),
      supportedLanguagePairs: this.translator.getSupportedLanguagePairs(),
      normalizationRulesCount: Object.keys(this.normalizer.getNormalizationRules('hi') || {}).length
    };
  }

  /**
   * Updates agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeComponents();
  }

  /**
   * Gets current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Validates text before processing
   */
  private validateText(text: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('Text is empty or contains only whitespace');
    }

    if (text.length > 10000) {
      errors.push('Text is too long (maximum 10000 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Processes text with validation
   */
  async processTextWithValidation(
    text: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<MultilingualProcessingResult> {
    const validation = this.validateText(text);
    
    if (!validation.isValid) {
      return {
        detectedLanguage: {
          language: this.config.languageDetection.fallbackLanguage,
          confidence: 0,
          script: 'Unknown'
        },
        translatedText: text,
        contextNotes: this.getEmptyContext(),
        normalizedText: text,
        processingMetadata: {
          processingTime: 0,
          componentsUsed: [],
          warnings: [],
          errors: validation.errors
        }
      };
    }

    return await this.processText(text, options);
  }

  /**
   * Creates a default configuration
   */
  static createDefaultConfig(): AgentConfig {
    return {
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
  }
}