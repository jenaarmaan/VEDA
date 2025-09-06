import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Evidence, SourceType, Verdict, APIConfig } from '../types';

/**
 * FactChecker module for verifying claims against external trusted APIs
 * Integrates with Gemini API and IndiaFactCheck API
 */
export class FactChecker {
  private geminiClient: AxiosInstance;
  private indiaFactCheckClient: AxiosInstance;
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
    
    // Initialize Gemini API client
    this.geminiClient = axios.create({
      baseURL: config.gemini.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.gemini.apiKey}`
      }
    });

    // Initialize IndiaFactCheck API client
    this.indiaFactCheckClient = axios.create({
      baseURL: config.indiaFactCheck.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.indiaFactCheck.apiKey}`
      }
    });
  }

  /**
   * Check a claim against multiple external APIs
   * @param claim - The claim text to verify
   * @returns Promise<Evidence[]> - Array of evidence from different sources
   */
  public async checkClaim(claim: string): Promise<Evidence[]> {
    const evidencePromises = [
      this.checkWithGemini(claim),
      this.checkWithIndiaFactCheck(claim)
    ];

    try {
      const results = await Promise.allSettled(evidencePromises);
      const evidence: Evidence[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          evidence.push(...result.value);
        } else {
          console.warn(`API check ${index} failed:`, result.reason);
          // Add fallback evidence for failed API calls
          evidence.push(this.createFallbackEvidence(claim, index));
        }
      });

      return evidence;
    } catch (error) {
      console.error('Error checking claim:', error);
      return [this.createFallbackEvidence(claim, -1)];
    }
  }

  /**
   * Check claim using Gemini API
   */
  private async checkWithGemini(claim: string): Promise<Evidence[]> {
    try {
      const prompt = this.buildGeminiPrompt(claim);
      
      const response: AxiosResponse = await this.geminiClient.post('/v1/models/gemini-pro:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1024
        }
      });

      return this.parseGeminiResponse(response.data, claim);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Check claim using IndiaFactCheck API
   */
  private async checkWithIndiaFactCheck(claim: string): Promise<Evidence[]> {
    try {
      const response: AxiosResponse = await this.indiaFactCheckClient.post('/api/v1/fact-check', {
        query: claim,
        language: 'en',
        limit: 5
      });

      return this.parseIndiaFactCheckResponse(response.data, claim);
    } catch (error) {
      console.error('IndiaFactCheck API error:', error);
      throw error;
    }
  }

  /**
   * Build prompt for Gemini API
   */
  private buildGeminiPrompt(claim: string): string {
    return `
Please fact-check the following claim and provide a detailed analysis:

Claim: "${claim}"

Please provide:
1. Verdict: TRUE, FALSE, UNCERTAIN, PARTIALLY_TRUE, or MISLEADING
2. Confidence score (0.0 to 1.0)
3. Brief explanation of your reasoning
4. Any relevant context or additional information

Format your response as JSON with the following structure:
{
  "verdict": "VERDICT_TYPE",
  "confidence": 0.0-1.0,
  "explanation": "Your explanation here",
  "context": "Additional context if available"
}
`;
  }

  /**
   * Parse Gemini API response
   */
  private parseGeminiResponse(response: any, originalClaim: string): Evidence[] {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('No content in Gemini response');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return [{
        source: 'Gemini AI',
        sourceType: SourceType.MAJOR_NEWS, // Treating AI as major news source
        timestamp: new Date(),
        verdict: this.mapVerdict(parsed.verdict),
        confidenceScore: parsed.confidence || 0.5,
        title: `Gemini Analysis: ${originalClaim}`,
        summary: parsed.explanation || 'No explanation provided',
        rawResponse: response
      }];
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return [this.createFallbackEvidence(originalClaim, 0, 'Gemini AI')];
    }
  }

  /**
   * Parse IndiaFactCheck API response
   */
  private parseIndiaFactCheckResponse(response: any, originalClaim: string): Evidence[] {
    try {
      const results = response.results || response.data || [];
      const evidence: Evidence[] = [];

      results.forEach((result: any) => {
        evidence.push({
          source: result.source || 'IndiaFactCheck',
          sourceType: this.determineSourceType(result.source),
          timestamp: new Date(result.published_date || Date.now()),
          verdict: this.mapVerdict(result.verdict || result.rating),
          confidenceScore: this.calculateConfidenceFromRating(result.rating || result.verdict),
          url: result.url,
          title: result.title || result.headline,
          summary: result.summary || result.explanation,
          rawResponse: result
        });
      });

      return evidence.length > 0 ? evidence : [this.createFallbackEvidence(originalClaim, 1, 'IndiaFactCheck')];
    } catch (error) {
      console.error('Error parsing IndiaFactCheck response:', error);
      return [this.createFallbackEvidence(originalClaim, 1, 'IndiaFactCheck')];
    }
  }

  /**
   * Map API verdict strings to our Verdict enum
   */
  private mapVerdict(verdict: string): Verdict {
    if (!verdict) return Verdict.UNCERTAIN;

    const verdictLower = verdict.toLowerCase();
    
    if (verdictLower.includes('true') || verdictLower.includes('correct')) {
      return Verdict.TRUE;
    } else if (verdictLower.includes('false') || verdictLower.includes('incorrect')) {
      return Verdict.FALSE;
    } else if (verdictLower.includes('misleading') || verdictLower.includes('deceptive')) {
      return Verdict.MISLEADING;
    } else if (verdictLower.includes('partially') || verdictLower.includes('mixed')) {
      return Verdict.PARTIALLY_TRUE;
    } else {
      return Verdict.UNCERTAIN;
    }
  }

  /**
   * Determine source type based on source name
   */
  private determineSourceType(source: string): SourceType {
    if (!source) return SourceType.UNKNOWN;

    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('government') || sourceLower.includes('official') || 
        sourceLower.includes('ministry') || sourceLower.includes('department')) {
      return SourceType.OFFICIAL;
    } else if (sourceLower.includes('bbc') || sourceLower.includes('cnn') || 
               sourceLower.includes('reuters') || sourceLower.includes('ap news') ||
               sourceLower.includes('times') || sourceLower.includes('guardian')) {
      return SourceType.MAJOR_NEWS;
    } else if (sourceLower.includes('twitter') || sourceLower.includes('facebook') ||
               sourceLower.includes('instagram') || sourceLower.includes('social')) {
      return SourceType.SOCIAL_MEDIA;
    } else if (sourceLower.includes('blog') || sourceLower.includes('medium') ||
               sourceLower.includes('substack')) {
      return SourceType.BLOG;
    } else {
      return SourceType.MAJOR_NEWS; // Default to major news for unknown sources
    }
  }

  /**
   * Calculate confidence score from rating
   */
  private calculateConfidenceFromRating(rating: string | number): number {
    if (typeof rating === 'number') {
      return Math.min(Math.max(rating / 10, 0), 1); // Assume 0-10 scale
    }

    if (typeof rating === 'string') {
      const ratingLower = rating.toLowerCase();
      if (ratingLower.includes('high') || ratingLower.includes('strong')) {
        return 0.8;
      } else if (ratingLower.includes('medium') || ratingLower.includes('moderate')) {
        return 0.6;
      } else if (ratingLower.includes('low') || ratingLower.includes('weak')) {
        return 0.3;
      }
    }

    return 0.5; // Default confidence
  }

  /**
   * Create fallback evidence when API calls fail
   */
  private createFallbackEvidence(claim: string, apiIndex: number, sourceName: string = 'Unknown'): Evidence {
    return {
      source: sourceName,
      sourceType: SourceType.UNKNOWN,
      timestamp: new Date(),
      verdict: Verdict.UNCERTAIN,
      confidenceScore: 0.1,
      title: `Fallback Analysis: ${claim}`,
      summary: 'Unable to verify claim due to API unavailability',
      rawResponse: { error: 'API unavailable', apiIndex }
    };
  }

  /**
   * Check multiple claims in parallel
   */
  public async checkClaims(claims: string[]): Promise<Evidence[][]> {
    const promises = claims.map(claim => this.checkClaim(claim));
    return Promise.all(promises);
  }

  /**
   * Get source credibility weight
   */
  public getSourceCredibilityWeight(sourceType: SourceType): number {
    const weights = {
      [SourceType.OFFICIAL]: 1.0,
      [SourceType.MAJOR_NEWS]: 0.8,
      [SourceType.SOCIAL_MEDIA]: 0.5,
      [SourceType.BLOG]: 0.6,
      [SourceType.UNKNOWN]: 0.3
    };

    return weights[sourceType];
  }
}