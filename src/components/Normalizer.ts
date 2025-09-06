/**
 * Normalizer - Handles slang/idiom mapping and text normalization
 */

import { NormalizationResult, LanguageNormalizationRules, SupportedLanguage } from '../types';

export class Normalizer {
  private normalizationRules: LanguageNormalizationRules;
  private strictMode: boolean;

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode;
    this.normalizationRules = this.initializeNormalizationRules();
  }

  /**
   * Normalizes text by applying language-specific rules
   */
  async normalize(text: string, language: string): Promise<NormalizationResult> {
    const rules = this.normalizationRules[language];
    if (!rules) {
      return {
        originalText: text,
        normalizedText: text,
        appliedRules: ['no_rules_found'],
        slangMappings: []
      };
    }

    let normalizedText = text;
    const appliedRules: string[] = [];
    const slangMappings: Array<{
      original: string;
      normalized: string;
      type: 'slang' | 'dialect' | 'idiom';
    }> = [];

    // Apply slang mappings
    const slangResult = this.applySlangMappings(normalizedText, rules.slangMappings);
    normalizedText = slangResult.text;
    slangMappings.push(...slangResult.mappings);
    if (slangResult.mappings.length > 0) {
      appliedRules.push('slang_mapping');
    }

    // Apply dialect mappings
    const dialectResult = this.applyDialectMappings(normalizedText, rules.dialectMappings);
    normalizedText = dialectResult.text;
    slangMappings.push(...dialectResult.mappings);
    if (dialectResult.mappings.length > 0) {
      appliedRules.push('dialect_mapping');
    }

    // Apply idiom mappings
    const idiomResult = this.applyIdiomMappings(normalizedText, rules.idiomMappings);
    normalizedText = idiomResult.text;
    slangMappings.push(...idiomResult.mappings);
    if (idiomResult.mappings.length > 0) {
      appliedRules.push('idiom_mapping');
    }

    // Apply abbreviation expansions
    const abbreviationResult = this.applyAbbreviationExpansions(normalizedText, rules.commonAbbreviations);
    normalizedText = abbreviationResult.text;
    if (abbreviationResult.mappings.length > 0) {
      appliedRules.push('abbreviation_expansion');
    }

    // Apply regional variations
    const regionalResult = this.applyRegionalVariations(normalizedText, rules.regionalVariations);
    normalizedText = regionalResult.text;
    if (regionalResult.mappings.length > 0) {
      appliedRules.push('regional_variation');
    }

    // Clean up extra spaces and punctuation
    normalizedText = this.cleanupText(normalizedText);
    if (normalizedText !== text) {
      appliedRules.push('text_cleanup');
    }

    return {
      originalText: text,
      normalizedText,
      appliedRules,
      slangMappings
    };
  }

  /**
   * Applies slang mappings to text
   */
  private applySlangMappings(
    text: string, 
    slangMappings: Record<string, string>
  ): { text: string; mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> } {
    let normalizedText = text;
    const mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> = [];

    for (const [slang, normalized] of Object.entries(slangMappings)) {
      const regex = new RegExp(`\\b${this.escapeRegex(slang)}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        normalizedText = normalizedText.replace(regex, normalized);
        mappings.push({
          original: slang,
          normalized,
          type: 'slang'
        });
      }
    }

    return { text: normalizedText, mappings };
  }

  /**
   * Applies dialect mappings to text
   */
  private applyDialectMappings(
    text: string, 
    dialectMappings: Record<string, string>
  ): { text: string; mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> } {
    let normalizedText = text;
    const mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> = [];

    for (const [dialect, normalized] of Object.entries(dialectMappings)) {
      const regex = new RegExp(`\\b${this.escapeRegex(dialect)}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        normalizedText = normalizedText.replace(regex, normalized);
        mappings.push({
          original: dialect,
          normalized,
          type: 'dialect'
        });
      }
    }

    return { text: normalizedText, mappings };
  }

  /**
   * Applies idiom mappings to text
   */
  private applyIdiomMappings(
    text: string, 
    idiomMappings: Record<string, string>
  ): { text: string; mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> } {
    let normalizedText = text;
    const mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> = [];

    for (const [idiom, normalized] of Object.entries(idiomMappings)) {
      const regex = new RegExp(this.escapeRegex(idiom), 'gi');
      if (regex.test(normalizedText)) {
        normalizedText = normalizedText.replace(regex, normalized);
        mappings.push({
          original: idiom,
          normalized,
          type: 'idiom'
        });
      }
    }

    return { text: normalizedText, mappings };
  }

  /**
   * Applies abbreviation expansions
   */
  private applyAbbreviationExpansions(
    text: string, 
    abbreviations: Record<string, string>
  ): { text: string; mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> } {
    let normalizedText = text;
    const mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> = [];

    for (const [abbrev, expansion] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${this.escapeRegex(abbrev)}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        normalizedText = normalizedText.replace(regex, expansion);
        mappings.push({
          original: abbrev,
          normalized: expansion,
          type: 'slang'
        });
      }
    }

    return { text: normalizedText, mappings };
  }

  /**
   * Applies regional variations
   */
  private applyRegionalVariations(
    text: string, 
    regionalVariations: Record<string, string>
  ): { text: string; mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> } {
    let normalizedText = text;
    const mappings: Array<{ original: string; normalized: string; type: 'slang' | 'dialect' | 'idiom' }> = [];

    for (const [variation, standard] of Object.entries(regionalVariations)) {
      const regex = new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        normalizedText = normalizedText.replace(regex, standard);
        mappings.push({
          original: variation,
          normalized: standard,
          type: 'dialect'
        });
      }
    }

    return { text: normalizedText, mappings };
  }

  /**
   * Cleans up text by removing extra spaces and normalizing punctuation
   */
  private cleanupText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+([.!?।।।])/g, '$1') // Remove spaces before punctuation
      .replace(/([.!?।।।])\s*/g, '$1 ') // Ensure space after punctuation
      .trim();
  }

  /**
   * Escapes special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Initializes normalization rules for all supported languages
   */
  private initializeNormalizationRules(): LanguageNormalizationRules {
    return {
      'hi': {
        slangMappings: {
          'यार': 'दोस्त',
          'भाई': 'भाई',
          'अरे': 'अरे',
          'अच्छा': 'अच्छा',
          'ठीक है': 'ठीक है',
          'बहुत': 'बहुत',
          'कूल': 'अच्छा',
          'अवेसम': 'अच्छा'
        },
        dialectMappings: {
          'हरियाणवी': 'हरियाणवी',
          'भोजपुरी': 'भोजपुरी',
          'राजस्थानी': 'राजस्थानी'
        },
        idiomMappings: {
          'दिमाग खराब': 'पागल',
          'दिल से': 'सच्चे मन से',
          'हाथ पैर फूलना': 'बहुत खुश होना'
        },
        commonAbbreviations: {
          'डॉ.': 'डॉक्टर',
          'श्री': 'श्रीमान',
          'श्रीमती': 'श्रीमती',
          'कु.': 'कुमारी'
        },
        regionalVariations: {
          'हम': 'हम',
          'मैं': 'मैं',
          'तुम': 'तुम',
          'आप': 'आप'
        }
      },
      'bn': {
        slangMappings: {
          'বন্ধু': 'বন্ধু',
          'ভাই': 'ভাই',
          'আরে': 'আরে',
          'ভালো': 'ভালো',
          'ঠিক আছে': 'ঠিক আছে',
          'খুব': 'খুব',
          'কুল': 'ভালো',
          'অসাম': 'ভালো'
        },
        dialectMappings: {
          'সিলেটি': 'সিলেটি',
          'চাটগাঁইয়া': 'চাটগাঁইয়া'
        },
        idiomMappings: {
          'মাথা খারাপ': 'পাগল',
          'হৃদয় থেকে': 'সত্য মনে',
          'হাত পা ফুলে যাওয়া': 'খুব খুশি হওয়া'
        },
        commonAbbreviations: {
          'ডা.': 'ডাক্তার',
          'শ্রী': 'শ্রীমান',
          'শ্রীমতী': 'শ্রীমতী',
          'কু.': 'কুমারী'
        },
        regionalVariations: {
          'আমি': 'আমি',
          'তুমি': 'তুমি',
          'আপনি': 'আপনি'
        }
      },
      'te': {
        slangMappings: {
          'అన్న': 'అన్న',
          'అక్క': 'అక్క',
          'అరే': 'అరే',
          'బాగుంది': 'బాగుంది',
          'సరే': 'సరే',
          'చాలా': 'చాలా',
          'కూల్': 'బాగుంది',
          'అవేసమ్': 'బాగుంది'
        },
        dialectMappings: {
          'రాయలసీమ': 'రాయలసీమ',
          'తీర': 'తీర'
        },
        idiomMappings: {
          'తల పాడైంది': 'పిచ్చి',
          'హృదయం నుండి': 'నిజమైన మనస్సుతో',
          'చేతులు కాళ్ళు ఉబ్బడం': 'చాలా సంతోషించడం'
        },
        commonAbbreviations: {
          'డా.': 'డాక్టర్',
          'శ్రీ': 'శ్రీమాన్',
          'శ్రీమతి': 'శ్రీమతి',
          'కు.': 'కుమారి'
        },
        regionalVariations: {
          'నేను': 'నేను',
          'నువ్వు': 'నువ్వు',
          'మీరు': 'మీరు'
        }
      },
      'ta': {
        slangMappings: {
          'தம்பி': 'தம்பி',
          'அக்கா': 'அக்கா',
          'அரே': 'அரே',
          'நல்லா': 'நல்லா',
          'சரி': 'சரி',
          'மிகவும்': 'மிகவும்',
          'கூல்': 'நல்லா',
          'அவேசம்': 'நல்லா'
        },
        dialectMappings: {
          'மதுரை': 'மதுரை',
          'கோவை': 'கோவை'
        },
        idiomMappings: {
          'தலை கெட்டது': 'பைத்தியம்',
          'இதயத்திலிருந்து': 'உண்மையான மனதுடன்',
          'கைகள் கால்கள் வீங்குதல்': 'மிகவும் மகிழ்ச்சியடைதல்'
        },
        commonAbbreviations: {
          'டா.': 'டாக்டர்',
          'திரு': 'திரு',
          'திருமதி': 'திருமதி',
          'கு.': 'குமாரி'
        },
        regionalVariations: {
          'நான்': 'நான்',
          'நீ': 'நீ',
          'நீங்கள்': 'நீங்கள்'
        }
      },
      'mr': {
        slangMappings: {
          'मित्र': 'मित्र',
          'भाऊ': 'भाऊ',
          'अरे': 'अरे',
          'चांगले': 'चांगले',
          'ठीक आहे': 'ठीक आहे',
          'खूप': 'खूप',
          'कूल': 'चांगले',
          'अवेसम': 'चांगले'
        },
        dialectMappings: {
          'कोकणी': 'कोकणी',
          'वराडी': 'वराडी'
        },
        idiomMappings: {
          'डोके खराब': 'वेडा',
          'हृदयापासून': 'खऱ्या मनाने',
          'हात पाय सुजणे': 'खूप आनंद होणे'
        },
        commonAbbreviations: {
          'डॉ.': 'डॉक्टर',
          'श्री': 'श्रीमान',
          'श्रीमती': 'श्रीमती',
          'कु.': 'कुमारी'
        },
        regionalVariations: {
          'मी': 'मी',
          'तू': 'तू',
          'तुम्ही': 'तुम्ही'
        }
      },
      'gu': {
        slangMappings: {
          'મિત્ર': 'મિત્ર',
          'ભાઈ': 'ભાઈ',
          'અરે': 'અરે',
          'સારું': 'સારું',
          'ઠીક છે': 'ઠીક છે',
          'ખૂબ': 'ખૂબ',
          'કૂલ': 'સારું',
          'અવેસમ': 'સારું'
        },
        dialectMappings: {
          'કચ્છી': 'કચ્છી',
          'સૌરાષ્ટ્રી': 'સૌરાષ્ટ્રી'
        },
        idiomMappings: {
          'મગજ ખરાબ': 'પાગલ',
          'હૃદયથી': 'સાચા મનથી',
          'હાથ પગ સુજવા': 'ખૂબ ખુશ થવું'
        },
        commonAbbreviations: {
          'ડૉ.': 'ડૉક્ટર',
          'શ્રી': 'શ્રીમાન',
          'શ્રીમતી': 'શ્રીમતી',
          'કુ.': 'કુમારી'
        },
        regionalVariations: {
          'હું': 'હું',
          'તું': 'તું',
          'તમે': 'તમે'
        }
      },
      'kn': {
        slangMappings: {
          'ಸ್ನೇಹಿತ': 'ಸ್ನೇಹಿತ',
          'ಅಣ್ಣ': 'ಅಣ್ಣ',
          'ಅರೇ': 'ಅರೇ',
          'ಚೆನ್ನಾಗಿದೆ': 'ಚೆನ್ನಾಗಿದೆ',
          'ಸರಿ': 'ಸರಿ',
          'ತುಂಬಾ': 'ತುಂಬಾ',
          'ಕೂಲ್': 'ಚೆನ್ನಾಗಿದೆ',
          'ಅವೇಸಮ್': 'ಚೆನ್ನಾಗಿದೆ'
        },
        dialectMappings: {
          'ಮೈಸೂರು': 'ಮೈಸೂರು',
          'ಬೆಂಗಳೂರು': 'ಬೆಂಗಳೂರು'
        },
        idiomMappings: {
          'ತಲೆ ಕೆಟ್ಟಿತು': 'ಹುಚ್ಚು',
          'ಹೃದಯದಿಂದ': 'ನಿಜವಾದ ಮನಸ್ಸಿನಿಂದ',
          'ಕೈ ಕಾಲು ಊದಿಕೊಳ್ಳುವುದು': 'ತುಂಬಾ ಸಂತೋಷಪಡುವುದು'
        },
        commonAbbreviations: {
          'ಡಾ.': 'ಡಾಕ್ಟರ್',
          'ಶ್ರೀ': 'ಶ್ರೀಮಾನ್',
          'ಶ್ರೀಮತಿ': 'ಶ್ರೀಮತಿ',
          'ಕು.': 'ಕುಮಾರಿ'
        },
        regionalVariations: {
          'ನಾನು': 'ನಾನು',
          'ನೀನು': 'ನೀನು',
          'ನೀವು': 'ನೀವು'
        }
      },
      'ml': {
        slangMappings: {
          'സുഹൃത്ത്': 'സുഹൃത്ത്',
          'അച്ഛൻ': 'അച്ഛൻ',
          'അരേ': 'അരേ',
          'നല്ലത്': 'നല്ലത്',
          'ശരി': 'ശരി',
          'വളരെ': 'വളരെ',
          'കൂൾ': 'നല്ലത്',
          'അവേസം': 'നല്ലത്'
        },
        dialectMappings: {
          'തിരുവനന്തപുരം': 'തിരുവനന്തപുരം',
          'കൊച്ചി': 'കൊച്ചി'
        },
        idiomMappings: {
          'തല കെട്ടു': 'പിച്ച',
          'ഹൃദയത്തിൽ നിന്ന്': 'ശരിയായ മനസ്സോടെ',
          'കൈകാലുകൾ വീർക്കൽ': 'വളരെ സന്തോഷിക്കൽ'
        },
        commonAbbreviations: {
          'ഡോ.': 'ഡോക്ടർ',
          'ശ്രീ': 'ശ്രീമാൻ',
          'ശ്രീമതി': 'ശ്രീമതി',
          'കു.': 'കുമാരി'
        },
        regionalVariations: {
          'ഞാൻ': 'ഞാൻ',
          'നീ': 'നീ',
          'നിങ്ങൾ': 'നിങ്ങൾ'
        }
      },
      'or': {
        slangMappings: {
          'ବନ୍ଧୁ': 'ବନ୍ଧୁ',
          'ଭାଇ': 'ଭାଇ',
          'ଅରେ': 'ଅରେ',
          'ଭଲ': 'ଭଲ',
          'ଠିକ୍ ଅଛି': 'ଠିକ୍ ଅଛି',
          'ବହୁତ': 'ବହୁତ',
          'କୁଲ୍': 'ଭଲ',
          'ଅଭେସମ୍': 'ଭଲ'
        },
        dialectMappings: {
          'କଟକ': 'କଟକ',
          'ପୁରୀ': 'ପୁରୀ'
        },
        idiomMappings: {
          'ମୁଣ୍ଡ ଖରାପ': 'ପାଗଳ',
          'ହୃଦୟରୁ': 'ସତ୍ୟ ମନରେ',
          'ହାତ ପାଦ ଫୁଲିବା': 'ବହୁତ ଖୁସି ହେବା'
        },
        commonAbbreviations: {
          'ଡା.': 'ଡାକ୍ତର',
          'ଶ୍ରୀ': 'ଶ୍ରୀମାନ୍',
          'ଶ୍ରୀମତୀ': 'ଶ୍ରୀମତୀ',
          'କୁ.': 'କୁମାରୀ'
        },
        regionalVariations: {
          'ମୁଁ': 'ମୁଁ',
          'ତୁ': 'ତୁ',
          'ତୁମେ': 'ତୁମେ'
        }
      },
      'pa': {
        slangMappings: {
          'ਦੋਸਤ': 'ਦੋਸਤ',
          'ਭਰਾ': 'ਭਰਾ',
          'ਅਰੇ': 'ਅਰੇ',
          'ਚੰਗਾ': 'ਚੰਗਾ',
          'ਠੀਕ ਹੈ': 'ਠੀਕ ਹੈ',
          'ਬਹੁਤ': 'ਬਹੁਤ',
          'ਕੂਲ': 'ਚੰਗਾ',
          'ਅਵੇਸਮ': 'ਚੰਗਾ'
        },
        dialectMappings: {
          'ਮਾਝੀ': 'ਮਾਝੀ',
          'ਦੋਆਬੀ': 'ਦੋਆਬੀ'
        },
        idiomMappings: {
          'ਦਿਮਾਗ ਖਰਾਬ': 'ਪਾਗਲ',
          'ਦਿਲ ਤੋਂ': 'ਸੱਚੇ ਦਿਲ ਨਾਲ',
          'ਹੱਥ ਪੈਰ ਫੁੱਲਣਾ': 'ਬਹੁਤ ਖੁਸ਼ ਹੋਣਾ'
        },
        commonAbbreviations: {
          'ਡਾ.': 'ਡਾਕਟਰ',
          'ਸ੍ਰੀ': 'ਸ੍ਰੀਮਾਨ',
          'ਸ੍ਰੀਮਤੀ': 'ਸ੍ਰੀਮਤੀ',
          'ਕੁ.': 'ਕੁਮਾਰੀ'
        },
        regionalVariations: {
          'ਮੈਂ': 'ਮੈਂ',
          'ਤੂੰ': 'ਤੂੰ',
          'ਤੁਸੀਂ': 'ਤੁਸੀਂ'
        }
      },
      'en': {
        slangMappings: {
          'bro': 'brother',
          'dude': 'person',
          'awesome': 'excellent',
          'cool': 'good',
          'okay': 'alright',
          'gonna': 'going to',
          'wanna': 'want to',
          'gotta': 'got to'
        },
        dialectMappings: {
          'ain\'t': 'is not',
          'y\'all': 'you all',
          'gonna': 'going to'
        },
        idiomMappings: {
          'break a leg': 'good luck',
          'piece of cake': 'very easy',
          'hit the nail on the head': 'be exactly right'
        },
        commonAbbreviations: {
          'Dr.': 'Doctor',
          'Mr.': 'Mister',
          'Mrs.': 'Missus',
          'Ms.': 'Miss'
        },
        regionalVariations: {
          'color': 'colour',
          'center': 'centre',
          'organize': 'organise'
        }
      }
    };
  }

  /**
   * Gets normalization rules for a specific language
   */
  getNormalizationRules(language: string): LanguageNormalizationRules[string] | undefined {
    return this.normalizationRules[language];
  }

  /**
   * Updates normalization rules for a language
   */
  updateNormalizationRules(language: string, rules: LanguageNormalizationRules[string]): void {
    this.normalizationRules[language] = rules;
  }

  /**
   * Batch normalization for multiple texts
   */
  async normalizeBatch(texts: string[], language: string): Promise<NormalizationResult[]> {
    const results: NormalizationResult[] = [];
    
    for (const text of texts) {
      const result = await this.normalize(text, language);
      results.push(result);
    }

    return results;
  }
}