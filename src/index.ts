/**
 * VEDA Content Analysis Agent - Main Entry Point
 * AI-driven misinformation verification platform
 */

export { ContentAnalysisAgent } from './agents/ContentAnalysisAgent';
export { ClaimExtractor } from './agents/ClaimExtractor';
export { FactChecker } from './agents/FactChecker';
export { ConfidenceAggregator } from './agents/ConfidenceAggregator';
export { ReportGenerator } from './agents/ReportGenerator';

export * from './types';

// Default configuration
export const defaultConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-pro'
  },
  indiaFactCheck: {
    apiKey: process.env.INDIA_FACT_CHECK_API_KEY || '',
    baseUrl: 'https://api.indiafactcheck.com'
  },
  timeout: 30000, // 30 seconds
  maxRetries: 3
};

// Example usage
export async function analyzeText(text: string, config = defaultConfig) {
  const agent = new ContentAnalysisAgent(config);
  return await agent.analyzeContent(text);
}