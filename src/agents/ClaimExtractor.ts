import * as nlp from 'wink-nlp';
import { model } from 'wink-eng-lite-model';
import { Claim, EntityType } from '../types';

/**
 * ClaimExtractor class for identifying and extracting factual claims from text
 * Uses NLP techniques including Named Entity Recognition and dependency parsing
 */
export class ClaimExtractor {
  private nlp: any;
  private claimPatterns: RegExp[];

  constructor() {
    // Initialize wink-nlp with English model
    this.nlp = nlp(model);
    
    // Define patterns for common claim structures
    this.claimPatterns = [
      // Factual statements with numbers
      /(\d+)\s+(people|persons?|individuals?)\s+(died|killed|injured|affected)/gi,
      // Location-based claims
      /(in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(.*?)(?:\.|$)/gi,
      // Event-based claims
      /(fire|explosion|accident|incident)\s+(in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      // Temporal claims
      /(yesterday|today|last\s+(?:week|month|year)|on\s+\w+day)\s+(.*?)(?:\.|$)/gi,
      // Statistical claims
      /(\d+(?:\.\d+)?%?)\s+(of|out\s+of)\s+(.*?)(?:\.|$)/gi,
      // Causal relationships
      /(caused|led\s+to|resulted\s+in)\s+(.*?)(?:\.|$)/gi
    ];
  }

  /**
   * Extract claims from input text
   * @param text - The input text to analyze
   * @returns Array of extracted claims
   */
  public async extractClaims(text: string): Promise<Claim[]> {
    const doc = this.nlp.readDoc(text);
    const claims: Claim[] = [];

    // Extract named entities
    const entities = this.extractNamedEntities(doc, text);
    
    // Extract claims using pattern matching
    const patternClaims = this.extractPatternBasedClaims(text);
    
    // Extract claims using dependency parsing
    const dependencyClaims = this.extractDependencyBasedClaims(doc, text);

    // Combine and deduplicate claims
    const allClaims = [...entities, ...patternClaims, ...dependencyClaims];
    const uniqueClaims = this.deduplicateClaims(allClaims);

    return uniqueClaims;
  }

  /**
   * Extract named entities and convert them to claims
   */
  private extractNamedEntities(doc: any, originalText: string): Claim[] {
    const claims: Claim[] = [];
    
    // Extract entities by type
    const entities = doc.entities();
    
    entities.forEach((entity: any, index: number) => {
      const entityText = entity.out();
      const entityType = this.mapEntityType(entity.type());
      const startOffset = entity.index();
      const endOffset = startOffset + entityText.length;
      
      // Only create claims for significant entities
      if (this.isSignificantEntity(entityType, entityText)) {
        claims.push({
          id: `entity_${index}_${Date.now()}`,
          text: entityText,
          entityType,
          startOffset,
          endOffset,
          confidence: this.calculateEntityConfidence(entityType, entityText),
          context: this.extractContext(originalText, startOffset, endOffset)
        });
      }
    });

    return claims;
  }

  /**
   * Extract claims using regex patterns
   */
  private extractPatternBasedClaims(text: string): Claim[] {
    const claims: Claim[] = [];
    let claimIndex = 0;

    this.claimPatterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const startOffset = match.index;
        const endOffset = startOffset + fullMatch.length;

        claims.push({
          id: `pattern_${patternIndex}_${claimIndex}_${Date.now()}`,
          text: fullMatch.trim(),
          entityType: EntityType.CLAIM,
          startOffset,
          endOffset,
          confidence: this.calculatePatternConfidence(patternIndex, fullMatch),
          context: this.extractContext(text, startOffset, endOffset)
        });

        claimIndex++;
      }
    });

    return claims;
  }

  /**
   * Extract claims using dependency parsing
   */
  private extractDependencyBasedClaims(doc: any, originalText: string): Claim[] {
    const claims: Claim[] = [];
    const sentences = doc.sentences();

    sentences.forEach((sentence: any, sentenceIndex: number) => {
      const sentenceText = sentence.out();
      
      // Look for factual statements with specific grammatical patterns
      if (this.isFactualStatement(sentenceText)) {
        const startOffset = sentence.index();
        const endOffset = startOffset + sentenceText.length;

        claims.push({
          id: `dependency_${sentenceIndex}_${Date.now()}`,
          text: sentenceText.trim(),
          entityType: EntityType.CLAIM,
          startOffset,
          endOffset,
          confidence: this.calculateDependencyConfidence(sentenceText),
          context: this.extractContext(originalText, startOffset, endOffset)
        });
      }
    });

    return claims;
  }

  /**
   * Map NLP entity types to our EntityType enum
   */
  private mapEntityType(nlpType: string): EntityType {
    const typeMapping: { [key: string]: EntityType } = {
      'PERSON': EntityType.PERSON,
      'ORG': EntityType.ORGANIZATION,
      'GPE': EntityType.LOCATION,
      'LOC': EntityType.LOCATION,
      'DATE': EntityType.DATE,
      'TIME': EntityType.DATE,
      'CARDINAL': EntityType.NUMBER,
      'QUANTITY': EntityType.NUMBER
    };

    return typeMapping[nlpType] || EntityType.CLAIM;
  }

  /**
   * Check if an entity is significant enough to be a claim
   */
  private isSignificantEntity(entityType: EntityType, text: string): boolean {
    // Filter out common words and insignificant entities
    const insignificantWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    
    if (insignificantWords.includes(text.toLowerCase())) {
      return false;
    }

    // Only include entities that are likely to be factual claims
    return [EntityType.PERSON, EntityType.ORGANIZATION, EntityType.LOCATION, 
            EntityType.EVENT, EntityType.DATE, EntityType.NUMBER].includes(entityType);
  }

  /**
   * Check if a sentence is a factual statement
   */
  private isFactualStatement(sentence: string): boolean {
    const factualIndicators = [
      /\d+\s+(people|persons?|individuals?)/i,
      /(killed|died|injured|affected|damaged)/i,
      /(fire|explosion|accident|incident)/i,
      /(caused|led\s+to|resulted\s+in)/i,
      /(reported|confirmed|announced)/i
    ];

    return factualIndicators.some(pattern => pattern.test(sentence));
  }

  /**
   * Calculate confidence score for entity-based claims
   */
  private calculateEntityConfidence(entityType: EntityType, text: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for specific entity types
    switch (entityType) {
      case EntityType.PERSON:
        confidence += 0.2;
        break;
      case EntityType.LOCATION:
        confidence += 0.15;
        break;
      case EntityType.ORGANIZATION:
        confidence += 0.1;
        break;
      case EntityType.DATE:
        confidence += 0.1;
        break;
      case EntityType.NUMBER:
        confidence += 0.2;
        break;
    }

    // Boost confidence for longer, more specific entities
    if (text.length > 10) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence score for pattern-based claims
   */
  private calculatePatternConfidence(patternIndex: number, text: string): number {
    const baseConfidences = [0.8, 0.7, 0.8, 0.6, 0.7, 0.6]; // Per pattern
    let confidence = baseConfidences[patternIndex] || 0.5;

    // Boost confidence for claims with numbers
    if (/\d+/.test(text)) {
      confidence += 0.1;
    }

    // Boost confidence for location mentions
    if (/in\s+[A-Z]|at\s+[A-Z]/.test(text)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence score for dependency-based claims
   */
  private calculateDependencyConfidence(text: string): number {
    let confidence = 0.6; // Base confidence for dependency-based claims

    // Boost confidence for specific indicators
    if (/\d+\s+(people|persons?|individuals?)/i.test(text)) {
      confidence += 0.2;
    }

    if (/(killed|died|injured)/i.test(text)) {
      confidence += 0.15;
    }

    if (/(fire|explosion|accident)/i.test(text)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract context around a claim
   */
  private extractContext(text: string, startOffset: number, endOffset: number, contextLength: number = 50): string {
    const start = Math.max(0, startOffset - contextLength);
    const end = Math.min(text.length, endOffset + contextLength);
    return text.substring(start, end);
  }

  /**
   * Deduplicate claims based on text similarity and overlap
   */
  private deduplicateClaims(claims: Claim[]): Claim[] {
    const uniqueClaims: Claim[] = [];
    
    for (const claim of claims) {
      const isDuplicate = uniqueClaims.some(existingClaim => {
        // Check for text overlap
        const overlap = this.calculateTextOverlap(claim.text, existingClaim.text);
        return overlap > 0.7; // 70% overlap threshold
      });

      if (!isDuplicate) {
        uniqueClaims.push(claim);
      }
    }

    return uniqueClaims;
  }

  /**
   * Calculate text overlap between two strings
   */
  private calculateTextOverlap(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
}