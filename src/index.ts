/**
 * VEDA Multilingual Processing Agent - Main entry point
 */

export { MultilingualAgent } from './MultilingualAgent';
export { LanguageDetector } from './components/LanguageDetector';
export { ContextFetcher } from './components/ContextFetcher';
export { Translator } from './components/Translator';
export { Normalizer } from './components/Normalizer';

export * from './types';
export * from './constants/languages';

// Re-export for convenience
export { MultilingualAgent as VEDAMultilingualAgent } from './MultilingualAgent';