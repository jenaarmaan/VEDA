/**
 * Translator - Integrates with BharatTranslate API for high-accuracy translation
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TranslationResult, BharatTranslateConfig, SupportedLanguage } from '../types';

export class Translator {
  private apiClient: AxiosInstance;
  private config: BharatTranslateConfig;
  private mockMode: boolean;

  constructor(config: BharatTranslateConfig, mockMode: boolean = true) {
    this.config = config;
    this.mockMode = mockMode;
    
    this.apiClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'VEDA-MultilingualAgent/1.0'
      }
    });
  }

  /**
   * Translates text from source language to target language
   */
  async translate(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string = 'en'
  ): Promise<TranslationResult> {
    if (this.mockMode) {
      return this.mockTranslate(text, sourceLanguage, targetLanguage);
    }

    try {
      const response = await this.translateWithRetry(text, sourceLanguage, targetLanguage);
      return this.parseTranslationResponse(response, text, sourceLanguage, targetLanguage);
    } catch (error) {
      console.error('Translation failed:', error);
      return this.getFallbackTranslation(text, sourceLanguage, targetLanguage);
    }
  }

  /**
   * Translates with retry logic
   */
  private async translateWithRetry(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): Promise<AxiosResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.apiClient.post('/translate', {
          text,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          preserve_formatting: true,
          detect_dialect: true
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Translation attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Translation failed after all retry attempts');
  }

  /**
   * Parses translation API response
   */
  private parseTranslationResponse(
    response: AxiosResponse, 
    originalText: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): TranslationResult {
    const data = response.data;
    
    return {
      originalText,
      translatedText: data.translated_text || data.translation || originalText,
      sourceLanguage,
      targetLanguage,
      confidence: data.confidence || 0.8,
      detectedDialect: data.detected_dialect || data.dialect
    };
  }

  /**
   * Mock translation for testing and development
   */
  private mockTranslate(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): TranslationResult {
    const mockTranslations: Record<string, Record<string, string>> = {
      'hi': {
        'en': this.translateHindiToEnglish(text),
        'bn': this.translateHindiToBengali(text),
        'te': this.translateHindiToTelugu(text)
      },
      'bn': {
        'en': this.translateBengaliToEnglish(text),
        'hi': this.translateBengaliToHindi(text)
      },
      'te': {
        'en': this.translateTeluguToEnglish(text),
        'hi': this.translateTeluguToHindi(text)
      },
      'ta': {
        'en': this.translateTamilToEnglish(text),
        'hi': this.translateTamilToHindi(text)
      },
      'mr': {
        'en': this.translateMarathiToEnglish(text),
        'hi': this.translateMarathiToHindi(text)
      },
      'gu': {
        'en': this.translateGujaratiToEnglish(text),
        'hi': this.translateGujaratiToHindi(text)
      },
      'kn': {
        'en': this.translateKannadaToEnglish(text),
        'hi': this.translateKannadaToHindi(text)
      },
      'ml': {
        'en': this.translateMalayalamToEnglish(text),
        'hi': this.translateMalayalamToHindi(text)
      },
      'or': {
        'en': this.translateOdiaToEnglish(text),
        'hi': this.translateOdiaToHindi(text)
      },
      'pa': {
        'en': this.translatePunjabiToEnglish(text),
        'hi': this.translatePunjabiToHindi(text)
      }
    };

    const translation = mockTranslations[sourceLanguage]?.[targetLanguage] || 
                       `[Mock Translation: ${text}]`;

    return {
      originalText: text,
      translatedText: translation,
      sourceLanguage,
      targetLanguage,
      confidence: 0.85,
      detectedDialect: this.detectDialectFromText(text, sourceLanguage)
    };
  }

  /**
   * Fallback translation when API fails
   */
  private getFallbackTranslation(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): TranslationResult {
    return {
      originalText: text,
      translatedText: `[Translation failed: ${text}]`,
      sourceLanguage,
      targetLanguage,
      confidence: 0.1
    };
  }

  /**
   * Detects dialect from text patterns
   */
  private detectDialectFromText(text: string, language: string): string | undefined {
    const dialectPatterns: Record<string, Record<string, RegExp[]>> = {
      'hi': {
        'Haryanvi': [/हरियाणा/, /हरियाणवी/],
        'Bhojpuri': [/बिहार/, /भोजपुरी/],
        'Rajasthani': [/राजस्थान/, /राजस्थानी/]
      },
      'bn': {
        'Sylheti': [/সিলেট/, /সিলেটি/],
        'Chittagonian': [/চট্টগ্রাম/, /চাটগাঁইয়া/]
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
   * Mock translation methods for different language pairs
   */
  private translateHindiToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'नमस्ते': 'Hello',
      'धन्यवाद': 'Thank you',
      'कैसे हैं आप': 'How are you',
      'मैं ठीक हूं': 'I am fine',
      'अफवाह': 'Rumor',
      'गलत जानकारी': 'Wrong information',
      'झूठी खबर': 'Fake news'
    };

    return translations[text] || `[Hindi to English: ${text}]`;
  }

  private translateBengaliToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'নমস্কার': 'Hello',
      'ধন্যবাদ': 'Thank you',
      'কেমন আছেন': 'How are you',
      'আমি ভালো আছি': 'I am fine',
      'গুজব': 'Rumor',
      'ভুল তথ্য': 'Wrong information',
      'মিথ্যা খবর': 'Fake news'
    };

    return translations[text] || `[Bengali to English: ${text}]`;
  }

  private translateTeluguToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'నమస్కారం': 'Hello',
      'ధన్యవాదాలు': 'Thank you',
      'ఎలా ఉన్నారు': 'How are you',
      'నేను బాగున్నాను': 'I am fine',
      'పుకారు': 'Rumor',
      'తప్పు సమాచారం': 'Wrong information',
      'అబద్ధ వార్త': 'Fake news'
    };

    return translations[text] || `[Telugu to English: ${text}]`;
  }

  private translateTamilToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'வணக்கம்': 'Hello',
      'நன்றி': 'Thank you',
      'எப்படி இருக்கிறீர்கள்': 'How are you',
      'நான் நன்றாக இருக்கிறேன்': 'I am fine',
      'வதந்தி': 'Rumor',
      'தவறான தகவல்': 'Wrong information',
      'பொய் செய்தி': 'Fake news'
    };

    return translations[text] || `[Tamil to English: ${text}]`;
  }

  private translateMarathiToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'नमस्कार': 'Hello',
      'धन्यवाद': 'Thank you',
      'कसे आहात': 'How are you',
      'मी ठीक आहे': 'I am fine',
      'अफवा': 'Rumor',
      'चुकीची माहिती': 'Wrong information',
      'खोटी बातमी': 'Fake news'
    };

    return translations[text] || `[Marathi to English: ${text}]`;
  }

  private translateGujaratiToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'નમસ્તે': 'Hello',
      'આભાર': 'Thank you',
      'કેમ છો': 'How are you',
      'હું ઠીક છું': 'I am fine',
      'અફવા': 'Rumor',
      'ખોટી માહિતી': 'Wrong information',
      'ખોટા સમાચાર': 'Fake news'
    };

    return translations[text] || `[Gujarati to English: ${text}]`;
  }

  private translateKannadaToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'ನಮಸ್ಕಾರ': 'Hello',
      'ಧನ್ಯವಾದಗಳು': 'Thank you',
      'ಹೇಗಿದ್ದೀರಿ': 'How are you',
      'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ': 'I am fine',
      'ಪುಕಾರು': 'Rumor',
      'ತಪ್ಪು ಮಾಹಿತಿ': 'Wrong information',
      'ಸುಳ್ಳು ಸುದ್ದಿ': 'Fake news'
    };

    return translations[text] || `[Kannada to English: ${text}]`;
  }

  private translateMalayalamToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'നമസ്കാരം': 'Hello',
      'നന്ദി': 'Thank you',
      'എങ്ങനെയുണ്ട്': 'How are you',
      'ഞാൻ നന്നായിരിക്കുന്നു': 'I am fine',
      'വാദം': 'Rumor',
      'തെറ്റായ വിവരം': 'Wrong information',
      'കള്ള വാർത്ത': 'Fake news'
    };

    return translations[text] || `[Malayalam to English: ${text}]`;
  }

  private translateOdiaToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'ନମସ୍କାର': 'Hello',
      'ଧନ୍ୟବାଦ': 'Thank you',
      'କେମିତି ଅଛନ୍ତି': 'How are you',
      'ମୁଁ ଠିକ୍ ଅଛି': 'I am fine',
      'ଅଫବା': 'Rumor',
      'ଭୁଲ ତଥ୍ୟ': 'Wrong information',
      'ମିଛ ଖବର': 'Fake news'
    };

    return translations[text] || `[Odia to English: ${text}]`;
  }

  private translatePunjabiToEnglish(text: string): string {
    const translations: Record<string, string> = {
      'ਸਤ ਸ੍ਰੀ ਅਕਾਲ': 'Hello',
      'ਧੰਨਵਾਦ': 'Thank you',
      'ਕਿਵੇਂ ਹੋ': 'How are you',
      'ਮੈਂ ਠੀਕ ਹਾਂ': 'I am fine',
      'ਅਫਵਾਹ': 'Rumor',
      'ਗਲਤ ਜਾਣਕਾਰੀ': 'Wrong information',
      'ਝੂਠੀ ਖਬਰ': 'Fake news'
    };

    return translations[text] || `[Punjabi to English: ${text}]`;
  }

  // Cross-language translations (simplified)
  private translateHindiToBengali(text: string): string {
    return `[Hindi to Bengali: ${text}]`;
  }

  private translateHindiToTelugu(text: string): string {
    return `[Hindi to Telugu: ${text}]`;
  }

  private translateBengaliToHindi(text: string): string {
    return `[Bengali to Hindi: ${text}]`;
  }

  private translateTeluguToHindi(text: string): string {
    return `[Telugu to Hindi: ${text}]`;
  }

  private translateTamilToHindi(text: string): string {
    return `[Tamil to Hindi: ${text}]`;
  }

  private translateMarathiToHindi(text: string): string {
    return `[Marathi to Hindi: ${text}]`;
  }

  private translateGujaratiToHindi(text: string): string {
    return `[Gujarati to Hindi: ${text}]`;
  }

  private translateKannadaToHindi(text: string): string {
    return `[Kannada to Hindi: ${text}]`;
  }

  private translateMalayalamToHindi(text: string): string {
    return `[Malayalam to Hindi: ${text}]`;
  }

  private translateOdiaToHindi(text: string): string {
    return `[Odia to Hindi: ${text}]`;
  }

  private translatePunjabiToHindi(text: string): string {
    return `[Punjabi to Hindi: ${text}]`;
  }

  /**
   * Utility method for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch translation for multiple texts
   */
  async translateBatch(
    texts: string[], 
    sourceLanguage: string, 
    targetLanguage: string
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    for (const text of texts) {
      const result = await this.translate(text, sourceLanguage, targetLanguage);
      results.push(result);
    }

    return results;
  }

  /**
   * Gets supported language pairs
   */
  getSupportedLanguagePairs(): Array<{ source: string; target: string }> {
    return [
      { source: 'hi', target: 'en' },
      { source: 'bn', target: 'en' },
      { source: 'te', target: 'en' },
      { source: 'ta', target: 'en' },
      { source: 'mr', target: 'en' },
      { source: 'gu', target: 'en' },
      { source: 'kn', target: 'en' },
      { source: 'ml', target: 'en' },
      { source: 'or', target: 'en' },
      { source: 'pa', target: 'en' },
      { source: 'hi', target: 'bn' },
      { source: 'hi', target: 'te' },
      { source: 'bn', target: 'hi' },
      { source: 'te', target: 'hi' }
    ];
  }
}