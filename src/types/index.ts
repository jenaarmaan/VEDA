/**
 * Core types and interfaces for the VEDA Multilingual Processing Agent
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  dialect?: string;
  script?: string;
}

export interface CulturalContext {
  region: string;
  culturalNotes: string[];
  commonMisinformationPatterns: string[];
  regionalBiases: string[];
  slangPatterns: string[];
  religiousContext?: string;
  politicalContext?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  detectedDialect?: string;
}

export interface NormalizationResult {
  originalText: string;
  normalizedText: string;
  appliedRules: string[];
  slangMappings: Array<{
    original: string;
    normalized: string;
    type: 'slang' | 'dialect' | 'idiom';
  }>;
}

export interface MultilingualProcessingResult {
  detectedLanguage: LanguageDetectionResult;
  translatedText: string;
  contextNotes: CulturalContext;
  normalizedText: string;
  processingMetadata: {
    processingTime: number;
    componentsUsed: string[];
    warnings: string[];
    errors: string[];
  };
}

export interface BharatTranslateConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface LanguageNormalizationRules {
  [language: string]: {
    slangMappings: Record<string, string>;
    dialectMappings: Record<string, string>;
    idiomMappings: Record<string, string>;
    commonAbbreviations: Record<string, string>;
    regionalVariations: Record<string, string>;
  };
}

export interface ContextDatabaseEntry {
  language: string;
  region: string;
  context: CulturalContext;
  lastUpdated: Date;
}

export type SupportedLanguage = 
  | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'kn' | 'ml' | 'or' | 'pa'
  | 'as' | 'ne' | 'ur' | 'sd' | 'ks' | 'bo' | 'dv' | 'en' | 'sa' | 'gom'
  | 'mni' | 'lus' | 'kok';

export interface ProcessingOptions {
  enableTranslation: boolean;
  enableContextEnrichment: boolean;
  enableNormalization: boolean;
  targetLanguage: string;
  includeConfidence: boolean;
  includeMetadata: boolean;
}

export interface AgentConfig {
  bharatTranslate: BharatTranslateConfig;
  contextDatabase: {
    enabled: boolean;
    mockMode: boolean;
  };
  normalization: {
    enabled: boolean;
    strictMode: boolean;
  };
  languageDetection: {
    minConfidence: number;
    fallbackLanguage: string;
  };
}