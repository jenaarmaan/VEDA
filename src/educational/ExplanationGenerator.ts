/**
 * ExplanationGenerator - Produces clear, contextualized explanations for verification results
 */

import Handlebars from 'handlebars';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  ExplanationTemplateData,
  EducationalContent
} from './types';

export class ExplanationGenerator {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private languageTemplates: Map<string, Map<string, HandlebarsTemplateDelegate>> = new Map();

  constructor() {
    this.initializeTemplates();
    this.registerHelpers();
  }

  /**
   * Generate explanation for a verification result
   */
  public generateExplanation(
    result: VerificationResult,
    userProfile: UserProfile
  ): EducationalContent {
    const templateData: ExplanationTemplateData = {
      verdict: result.verdict,
      confidence: result.confidence,
      evidence: result.evidence,
      category: result.category,
      userLevel: userProfile.literacyLevel,
      language: userProfile.language
    };

    const template = this.getTemplate('explanation', userProfile.literacyLevel, userProfile.language);
    const content = template(templateData);

    return {
      id: `explanation_${result.id}`,
      type: 'explanation' as any,
      title: this.generateTitle(result, userProfile),
      content,
      difficulty: userProfile.literacyLevel,
      language: userProfile.language,
      category: result.category,
      metadata: {
        estimatedTime: this.calculateReadingTime(content),
        prerequisites: [],
        tags: this.extractTags(result),
        version: '1.0.0',
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Generate multiple explanations for batch processing
   */
  public generateBatchExplanations(
    results: VerificationResult[],
    userProfile: UserProfile
  ): EducationalContent[] {
    return results.map(result => this.generateExplanation(result, userProfile));
  }

  /**
   * Generate explanation summary for dashboard
   */
  public generateSummary(
    results: VerificationResult[],
    userProfile: UserProfile
  ): string {
    const template = this.getTemplate('summary', userProfile.literacyLevel, userProfile.language);
    return template({
      totalResults: results.length,
      trueCount: results.filter(r => r.verdict === 'true').length,
      falseCount: results.filter(r => r.verdict === 'false').length,
      uncertainCount: results.filter(r => r.verdict === 'uncertain').length,
      userLevel: userProfile.literacyLevel,
      language: userProfile.language
    });
  }

  private initializeTemplates(): void {
    // Beginner level templates
    this.addTemplate('explanation', LiteracyLevel.BEGINNER, 'en', `
      <div class="explanation-beginner">
        <h3>{{#if (eq verdict "true")}}✅ This information is TRUE{{/if}}{{#if (eq verdict "false")}}❌ This information is FALSE{{/if}}{{#if (eq verdict "uncertain")}}❓ This information is UNCERTAIN{{/if}}</h3>
        
        <div class="confidence-bar">
          <p>Confidence Level: {{confidence}}%</p>
          <div class="progress-bar">
            <div class="progress" style="width: {{confidence}}%"></div>
          </div>
        </div>

        <div class="simple-explanation">
          <h4>What this means:</h4>
          <p>{{#if (eq verdict "true")}}This information has been checked and is accurate.{{/if}}{{#if (eq verdict "false")}}This information has been checked and is not accurate.{{/if}}{{#if (eq verdict "uncertain")}}We cannot determine if this information is accurate or not.{{/if}}</p>
        </div>

        {{#if evidence}}
        <div class="evidence-section">
          <h4>Why we think this:</h4>
          <ul>
            {{#each evidence}}
            <li>{{this.description}}</li>
            {{/each}}
          </ul>
        </div>
        {{/if}}

        <div class="learning-tip">
          <h4>💡 Learning Tip:</h4>
          <p>{{#if (eq verdict "true")}}Good job checking this information! Always verify facts from reliable sources.{{/if}}{{#if (eq verdict "false")}}This is a good example of misinformation. Always check multiple sources before sharing.{{/if}}{{#if (eq verdict "uncertain")}}When information is uncertain, it's best to wait for more evidence before making decisions.{{/if}}</p>
        </div>
      </div>
    `);

    // Intermediate level templates
    this.addTemplate('explanation', LiteracyLevel.INTERMEDIATE, 'en', `
      <div class="explanation-intermediate">
        <h3>{{#if (eq verdict "true")}}✅ Verified as TRUE{{/if}}{{#if (eq verdict "false")}}❌ Verified as FALSE{{/if}}{{#if (eq verdict "uncertain")}}❓ Verification INCONCLUSIVE{{/if}}</h3>
        
        <div class="verification-details">
          <div class="confidence-metric">
            <span class="label">Confidence Score:</span>
            <span class="value {{#if (gte confidence 80)}}high{{else if (gte confidence 60)}}medium{{else}}low{{/if}}">{{confidence}}%</span>
          </div>
          <div class="category-tag">
            <span class="tag">{{category}}</span>
          </div>
        </div>

        <div class="analysis-summary">
          <h4>Analysis Summary:</h4>
          <p>{{#if (eq verdict "true")}}Our verification process confirms the accuracy of this information based on reliable sources and evidence.{{/if}}{{#if (eq verdict "false")}}Our analysis reveals this information contains inaccuracies or misleading claims that contradict verified facts.{{/if}}{{#if (eq verdict "uncertain")}}The available evidence is insufficient to make a definitive determination about the accuracy of this information.{{/if}}</p>
        </div>

        {{#if evidence}}
        <div class="evidence-analysis">
          <h4>Supporting Evidence:</h4>
          <div class="evidence-list">
            {{#each evidence}}
            <div class="evidence-item">
              <div class="evidence-type">{{this.type}}</div>
              <div class="evidence-description">{{this.description}}</div>
              {{#if this.source}}
              <div class="evidence-source">Source: {{this.source}}</div>
              {{/if}}
              <div class="evidence-reliability">Reliability: {{this.reliability}}%</div>
            </div>
            {{/each}}
          </div>
        </div>
        {{/if}}

        <div class="critical-thinking">
          <h4>🧠 Critical Thinking Points:</h4>
          <ul>
            {{#if (eq verdict "true")}}
            <li>This information aligns with established facts from reliable sources</li>
            <li>Multiple verification methods confirm the accuracy</li>
            <li>Consider the context and potential biases in the original source</li>
            {{/if}}
            {{#if (eq verdict "false")}}
            <li>This information contradicts verified facts from authoritative sources</li>
            <li>Be cautious of similar claims in the future</li>
            <li>Check the credibility of sources before sharing information</li>
            {{/if}}
            {{#if (eq verdict "uncertain")}}
            <li>Insufficient evidence makes this claim difficult to verify</li>
            <li>Wait for more information from reliable sources</li>
            <li>Be skeptical of definitive claims about uncertain topics</li>
            {{/if}}
          </ul>
        </div>
      </div>
    `);

    // Advanced level templates
    this.addTemplate('explanation', LiteracyLevel.ADVANCED, 'en', `
      <div class="explanation-advanced">
        <h3>{{#if (eq verdict "true")}}✅ VERIFIED: TRUE{{/if}}{{#if (eq verdict "false")}}❌ VERIFIED: FALSE{{/if}}{{#if (eq verdict "uncertain")}}❓ VERIFICATION: INCONCLUSIVE{{/if}}</h3>
        
        <div class="verification-metrics">
          <div class="metric-grid">
            <div class="metric">
              <span class="metric-label">Confidence Score</span>
              <span class="metric-value {{#if (gte confidence 80)}}high{{else if (gte confidence 60)}}medium{{else}}low{{/if}}">{{confidence}}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Category</span>
              <span class="metric-value">{{category}}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Evidence Sources</span>
              <span class="metric-value">{{evidence.length}}</span>
            </div>
          </div>
        </div>

        <div class="detailed-analysis">
          <h4>Comprehensive Analysis:</h4>
          <p>{{#if (eq verdict "true")}}Through systematic verification employing multiple analytical frameworks, this information demonstrates alignment with established factual standards and reliable source verification protocols.{{/if}}{{#if (eq verdict "false")}}Comprehensive analysis reveals systematic inaccuracies, logical inconsistencies, and contradictions with verified information from authoritative sources, indicating deliberate or unintentional misinformation.{{/if}}{{#if (eq verdict "uncertain")}}Current evidence presents insufficient data points for definitive verification, requiring additional information from reliable sources to establish factual accuracy.{{/if}}</p>
        </div>

        {{#if evidence}}
        <div class="evidence-breakdown">
          <h4>Evidence Analysis:</h4>
          <div class="evidence-matrix">
            {{#each evidence}}
            <div class="evidence-card">
              <div class="evidence-header">
                <span class="evidence-type-badge">{{this.type}}</span>
                <span class="reliability-score">{{this.reliability}}%</span>
              </div>
              <div class="evidence-content">
                <p>{{this.description}}</p>
                {{#if this.source}}
                <div class="source-attribution">
                  <strong>Source:</strong> {{this.source}}
                </div>
                {{/if}}
              </div>
            </div>
            {{/each}}
          </div>
        </div>
        {{/if}}

        <div class="methodological-notes">
          <h4>🔬 Methodological Considerations:</h4>
          <ul>
            {{#if (eq verdict "true")}}
            <li>Cross-referenced with multiple authoritative sources</li>
            <li>Verified through independent fact-checking methodologies</li>
            <li>Assessed for potential confirmation bias in source selection</li>
            <li>Considered temporal relevance and context specificity</li>
            {{/if}}
            {{#if (eq verdict "false")}}
            <li>Identified specific factual inaccuracies and logical fallacies</li>
            <li>Analyzed source credibility and potential bias</li>
            <li>Examined potential motivations for misinformation</li>
            <li>Assessed impact on public understanding</li>
            {{/if}}
            {{#if (eq verdict "uncertain")}}
            <li>Insufficient data for statistical significance</li>
            <li>Conflicting information from multiple sources</li>
            <li>Requires additional verification methodologies</li>
            <li>Considered alternative explanations and interpretations</li>
            {{/if}}
          </ul>
        </div>

        <div class="recommendations">
          <h4>📋 Recommendations:</h4>
          <ul>
            {{#if (eq verdict "true")}}
            <li>Continue to verify information from multiple sources</li>
            <li>Be aware of potential context limitations</li>
            <li>Consider how this information fits into broader patterns</li>
            {{/if}}
            {{#if (eq verdict "false")}}
            <li>Report this misinformation to appropriate platforms</li>
            <li>Share accurate information from reliable sources</li>
            <li>Educate others about this type of misinformation</li>
            {{/if}}
            {{#if (eq verdict "uncertain")}}
            <li>Monitor for additional information from reliable sources</li>
            <li>Avoid making definitive claims based on this information</li>
            <li>Consider the implications of uncertainty in decision-making</li>
            {{/if}}
          </ul>
        </div>
      </div>
    `);

    // Summary template
    this.addTemplate('summary', LiteracyLevel.INTERMEDIATE, 'en', `
      <div class="verification-summary">
        <h3>Verification Summary</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">{{totalResults}}</span>
            <span class="stat-label">Total Items</span>
          </div>
          <div class="stat-item true">
            <span class="stat-number">{{trueCount}}</span>
            <span class="stat-label">Verified True</span>
          </div>
          <div class="stat-item false">
            <span class="stat-number">{{falseCount}}</span>
            <span class="stat-label">Verified False</span>
          </div>
          <div class="stat-item uncertain">
            <span class="stat-number">{{uncertainCount}}</span>
            <span class="stat-label">Uncertain</span>
          </div>
        </div>
      </div>
    `);
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    Handlebars.registerHelper('gte', function(a, b) {
      return a >= b;
    });

    Handlebars.registerHelper('lte', function(a, b) {
      return a <= b;
    });
  }

  private addTemplate(
    type: string,
    level: LiteracyLevel,
    language: string,
    templateString: string
  ): void {
    const template = Handlebars.compile(templateString);
    const key = `${type}_${level}_${language}`;
    this.templates.set(key, template);

    if (!this.languageTemplates.has(language)) {
      this.languageTemplates.set(language, new Map());
    }
    this.languageTemplates.get(language)!.set(`${type}_${level}`, template);
  }

  private getTemplate(
    type: string,
    level: LiteracyLevel,
    language: string
  ): HandlebarsTemplateDelegate {
    const key = `${type}_${level}_${language}`;
    let template = this.templates.get(key);

    if (!template) {
      // Fallback to English if language not available
      const fallbackKey = `${type}_${level}_en`;
      template = this.templates.get(fallbackKey);
    }

    if (!template) {
      throw new Error(`Template not found: ${key}`);
    }

    return template;
  }

  private generateTitle(result: VerificationResult, userProfile: UserProfile): string {
    const level = userProfile.literacyLevel;
    const category = result.category;

    if (level === LiteracyLevel.BEGINNER) {
      return `Is this ${category} information true or false?`;
    } else if (level === LiteracyLevel.INTERMEDIATE) {
      return `Verification Analysis: ${category} Information`;
    } else {
      return `Comprehensive Verification Report: ${category} Content Analysis`;
    }
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private extractTags(result: VerificationResult): string[] {
    const tags = [result.category, result.verdict];
    
    result.evidence.forEach(evidence => {
      tags.push(evidence.type);
    });

    return [...new Set(tags)];
  }
}