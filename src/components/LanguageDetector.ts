/**
 * LanguageDetector - Identifies language and dialect using franc library
 */

import franc from 'franc';
import { LanguageDetectionResult, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES, LANGUAGE_SCRIPTS } from '../constants/languages';

export class LanguageDetector {
  private minConfidence: number;
  private fallbackLanguage: string;

  constructor(minConfidence: number = 0.3, fallbackLanguage: string = 'en') {
    this.minConfidence = minConfidence;
    this.fallbackLanguage = fallbackLanguage;
  }

  /**
   * Detects the language of the input text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      return {
        language: this.fallbackLanguage,
        confidence: 0,
        script: 'Unknown'
      };
    }

    try {
      // Use franc for initial detection
      const detected = franc(text);
      const confidence = franc.all(text)[0]?.score || 0;

      // Map franc language codes to our supported languages
      const mappedLanguage = this.mapFrancToSupported(detected);
      
      // If confidence is too low, try additional heuristics
      if (confidence < this.minConfidence) {
        const heuristicResult = this.detectByHeuristics(text);
        if (heuristicResult.confidence > confidence) {
          return heuristicResult;
        }
      }

      return {
        language: mappedLanguage,
        confidence,
        script: LANGUAGE_SCRIPTS[mappedLanguage as SupportedLanguage] || 'Unknown',
        dialect: this.detectDialect(text, mappedLanguage)
      };
    } catch (error) {
      console.warn('Language detection failed:', error);
      return {
        language: this.fallbackLanguage,
        confidence: 0,
        script: 'Unknown'
      };
    }
  }

  /**
   * Maps franc language codes to our supported language codes
   */
  private mapFrancToSupported(francCode: string): string {
    const mapping: Record<string, string> = {
      'hin': 'hi',  // Hindi
      'ben': 'bn',  // Bengali
      'tel': 'te',  // Telugu
      'mar': 'mr',  // Marathi
      'tam': 'ta',  // Tamil
      'guj': 'gu',  // Gujarati
      'kan': 'kn',  // Kannada
      'mal': 'ml',  // Malayalam
      'ori': 'or',  // Odia
      'pan': 'pa',  // Punjabi
      'asm': 'as',  // Assamese
      'nep': 'ne',  // Nepali
      'urd': 'ur',  // Urdu
      'sin': 'sd',  // Sindhi
      'kas': 'ks',  // Kashmiri
      'eng': 'en',  // English
      'san': 'sa',  // Sanskrit
      'kok': 'kok', // Konkani
      'mni': 'mni', // Manipuri
      'lus': 'lus', // Mizo
      'gom': 'gom'  // Konkani (Goan)
    };

    return mapping[francCode] || this.fallbackLanguage;
  }

  /**
   * Detects language using heuristics when franc confidence is low
   */
  private detectByHeuristics(text: string): LanguageDetectionResult {
    const scriptPatterns = {
      'Devanagari': /[\u0900-\u097F]/,
      'Bengali': /[\u0980-\u09FF]/,
      'Telugu': /[\u0C00-\u0C7F]/,
      'Tamil': /[\u0B80-\u0BFF]/,
      'Gujarati': /[\u0A80-\u0AFF]/,
      'Kannada': /[\u0C80-\u0CFF]/,
      'Malayalam': /[\u0D00-\u0D7F]/,
      'Odia': /[\u0B00-\u0B7F]/,
      'Gurmukhi': /[\u0A00-\u0A7F]/,
      'Assamese': /[\u0980-\u09FF]/,
      'Arabic': /[\u0600-\u06FF]/,
      'Latin': /[a-zA-Z]/
    };

    for (const [script, pattern] of Object.entries(scriptPatterns)) {
      if (pattern.test(text)) {
        const language = this.getLanguageByScript(script);
        return {
          language,
          confidence: 0.7, // Heuristic confidence
          script,
          dialect: this.detectDialect(text, language)
        };
      }
    }

    return {
      language: this.fallbackLanguage,
      confidence: 0.1,
      script: 'Unknown'
    };
  }

  /**
   * Gets language code by script
   */
  private getLanguageByScript(script: string): string {
    const scriptToLanguage: Record<string, string> = {
      'Devanagari': 'hi',
      'Bengali': 'bn',
      'Telugu': 'te',
      'Tamil': 'ta',
      'Gujarati': 'gu',
      'Kannada': 'kn',
      'Malayalam': 'ml',
      'Odia': 'or',
      'Gurmukhi': 'pa',
      'Assamese': 'as',
      'Arabic': 'ur',
      'Latin': 'en'
    };

    return scriptToLanguage[script] || this.fallbackLanguage;
  }

  /**
   * Detects dialect based on specific patterns
   */
  private detectDialect(text: string, language: string): string | undefined {
    const dialectPatterns: Record<string, Record<string, RegExp[]>> = {
      'hi': {
        'Haryanvi': [/हरियाणा/, /हरियाणवी/],
        'Bhojpuri': [/बिहार/, /भोजपुरी/],
        'Rajasthani': [/राजस्थान/, /राजस्थानी/]
      },
      'bn': {
        'Sylheti': [/সিলেট/, /সিলেটি/],
        'Chittagonian': [/চট্টগ্রাম/, /চাটগাঁইয়া/]
      },
      'te': {
        'Rayalaseema': [/రాయలసీమ/, /రాయలసీమా/],
        'Coastal': [/తీర/, /తీరప్రాంత/]
      }
    };

    const patterns = dialectPatterns[language];
    if (!patterns) return undefined;

    for (const [dialect, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(text))) {
        return dialect;
      }
    }

    return undefined;
  }

  /**
   * Detects if text contains multiple languages (code-switching)
   */
  async detectCodeSwitching(text: string): Promise<{
    isCodeSwitching: boolean;
    languages: string[];
    segments: Array<{ text: string; language: string; confidence: number }>;
  }> {
    // Split text into sentences or phrases
    const segments = text.split(/[.!?।।।]/).filter(s => s.trim().length > 0);
    const results = [];

    for (const segment of segments) {
      const detection = await this.detectLanguage(segment);
      results.push({
        text: segment.trim(),
        language: detection.language,
        confidence: detection.confidence
      });
    }

    const uniqueLanguages = [...new Set(results.map(r => r.language))];
    const isCodeSwitching = uniqueLanguages.length > 1;

    return {
      isCodeSwitching,
      languages: uniqueLanguages,
      segments: results
    };
  }
}