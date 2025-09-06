/**
 * TemplateEngine - Handlebars-based templating system for educational content
 */

import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  UserProfile,
  VerificationResult,
  Quiz,
  Recommendation,
  EducationalContent,
  LiteracyLevel,
  MisinformationCategory
} from '../types';

export interface TemplateContext {
  user: UserProfile;
  content: any;
  metadata: TemplateMetadata;
  options: TemplateOptions;
}

export interface TemplateMetadata {
  timestamp: Date;
  version: string;
  language: string;
  theme: 'light' | 'dark';
}

export interface TemplateOptions {
  includeCSS: boolean;
  includeJS: boolean;
  responsive: boolean;
  accessibility: boolean;
}

export class TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private partials: Map<string, HandlebarsTemplateDelegate> = new Map();
  private helpers: Map<string, Handlebars.HelperDelegate> = new Map();
  private templateCache: Map<string, string> = new Map();

  constructor() {
    this.initializeHelpers();
    this.initializePartials();
    this.loadTemplates();
  }

  /**
   * Render explanation content with user-specific template
   */
  public renderExplanation(
    content: EducationalContent,
    userProfile: UserProfile,
    options: Partial<TemplateOptions> = {}
  ): string {
    const context = this.createContext(userProfile, content, options);
    const template = this.getTemplate('explanation', userProfile.literacyLevel);
    return template(context);
  }

  /**
   * Render quiz content with interactive elements
   */
  public renderQuiz(
    quiz: Quiz,
    userProfile: UserProfile,
    options: Partial<TemplateOptions> = {}
  ): string {
    const context = this.createContext(userProfile, quiz, options);
    const template = this.getTemplate('quiz', userProfile.literacyLevel);
    return template(context);
  }

  /**
   * Render recommendation content
   */
  public renderRecommendation(
    recommendation: Recommendation,
    userProfile: UserProfile,
    options: Partial<TemplateOptions> = {}
  ): string {
    const context = this.createContext(userProfile, recommendation, options);
    const template = this.getTemplate('recommendation', userProfile.literacyLevel);
    return template(context);
  }

  /**
   * Render dashboard with user progress and content
   */
  public renderDashboard(
    userProfile: UserProfile,
    recentContent: EducationalContent[],
    options: Partial<TemplateOptions> = {}
  ): string {
    const context = this.createContext(userProfile, { content: recentContent }, options);
    const template = this.getTemplate('dashboard', userProfile.literacyLevel);
    return template(context);
  }

  /**
   * Render learning path visualization
   */
  public renderLearningPath(
    userProfile: UserProfile,
    pathData: any,
    options: Partial<TemplateOptions> = {}
  ): string {
    const context = this.createContext(userProfile, pathData, options);
    const template = this.getTemplate('learning-path', userProfile.literacyLevel);
    return template(context);
  }

  /**
   * Render gamification elements (badges, progress, leaderboard)
   */
  public renderGamification(
    userProfile: UserProfile,
    gamificationData: any,
    options: Partial<TemplateOptions> = {}
  ): string {
    const context = this.createContext(userProfile, gamificationData, options);
    const template = this.getTemplate('gamification', userProfile.literacyLevel);
    return template(context);
  }

  /**
   * Register a custom template
   */
  public registerTemplate(
    name: string,
    templateString: string,
    level?: LiteracyLevel
  ): void {
    const key = level ? `${name}_${level}` : name;
    const template = Handlebars.compile(templateString);
    this.templates.set(key, template);
  }

  /**
   * Register a custom partial
   */
  public registerPartial(name: string, partialString: string): void {
    const partial = Handlebars.compile(partialString);
    this.partials.set(name, partial);
    Handlebars.registerPartial(name, partial);
  }

  /**
   * Register a custom helper
   */
  public registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    this.helpers.set(name, helper);
    Handlebars.registerHelper(name, helper);
  }

  /**
   * Precompile templates for better performance
   */
  public precompileTemplates(): Map<string, string> {
    const compiled = new Map<string, string>();
    
    for (const [name, template] of this.templates) {
      const compiledTemplate = Handlebars.precompile(template);
      compiled.set(name, compiledTemplate);
    }
    
    return compiled;
  }

  private initializeHelpers(): void {
    // Comparison helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    Handlebars.registerHelper('gte', (a: any, b: any) => a >= b);
    Handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    Handlebars.registerHelper('lte', (a: any, b: any) => a <= b);

    // Logical helpers
    Handlebars.registerHelper('and', (...args: any[]) => {
      return args.slice(0, -1).every(arg => !!arg);
    });
    Handlebars.registerHelper('or', (...args: any[]) => {
      return args.slice(0, -1).some(arg => !!arg);
    });
    Handlebars.registerHelper('not', (value: any) => !value);

    // String helpers
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    });
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });
    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      return str && str.length > length ? str.substring(0, length) + '...' : str;
    });

    // Array helpers
    Handlebars.registerHelper('length', (arr: any[]) => {
      return arr ? arr.length : 0;
    });
    Handlebars.registerHelper('first', (arr: any[]) => {
      return arr && arr.length > 0 ? arr[0] : null;
    });
    Handlebars.registerHelper('last', (arr: any[]) => {
      return arr && arr.length > 0 ? arr[arr.length - 1] : null;
    });
    Handlebars.registerHelper('slice', (arr: any[], start: number, end?: number) => {
      return arr ? arr.slice(start, end) : [];
    });

    // Date helpers
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';
      const d = new Date(date);
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'long':
          return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'time':
          return d.toLocaleTimeString();
        default:
          return d.toISOString();
      }
    });
    Handlebars.registerHelper('timeAgo', (date: Date) => {
      if (!date) return '';
      const now = new Date();
      const diff = now.getTime() - new Date(date).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    });

    // Math helpers
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    Handlebars.registerHelper('divide', (a: number, b: number) => b !== 0 ? a / b : 0);
    Handlebars.registerHelper('round', (num: number, decimals: number = 0) => {
      return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    });
    Handlebars.registerHelper('percentage', (value: number, total: number) => {
      return total > 0 ? Math.round((value / total) * 100) : 0;
    });

    // Educational-specific helpers
    Handlebars.registerHelper('difficultyIcon', (level: LiteracyLevel) => {
      const icons = {
        [LiteracyLevel.BEGINNER]: '🟢',
        [LiteracyLevel.INTERMEDIATE]: '🟡',
        [LiteracyLevel.ADVANCED]: '🔴'
      };
      return icons[level] || '⚪';
    });

    Handlebars.registerHelper('categoryIcon', (category: MisinformationCategory) => {
      const icons = {
        [MisinformationCategory.HEALTH]: '🏥',
        [MisinformationCategory.POLITICS]: '🏛️',
        [MisinformationCategory.SCIENCE]: '🔬',
        [MisinformationCategory.TECHNOLOGY]: '💻',
        [MisinformationCategory.ECONOMY]: '💰',
        [MisinformationCategory.SOCIAL]: '👥',
        [MisinformationCategory.ENVIRONMENT]: '🌍',
        [MisinformationCategory.GENERAL]: '📰'
      };
      return icons[category] || '📄';
    });

    Handlebars.registerHelper('verdictIcon', (verdict: string) => {
      const icons = {
        'true': '✅',
        'false': '❌',
        'uncertain': '❓'
      };
      return icons[verdict] || '❓';
    });

    Handlebars.registerHelper('progressBar', (current: number, total: number, width: number = 100) => {
      const percentage = total > 0 ? (current / total) * 100 : 0;
      return `<div class="progress-bar" style="width: ${width}px;">
        <div class="progress-fill" style="width: ${percentage}%;"></div>
      </div>`;
    });

    Handlebars.registerHelper('badgeIcon', (badge: any) => {
      return badge.icon || '🏆';
    });

    // Accessibility helpers
    Handlebars.registerHelper('ariaLabel', (text: string, context: string) => {
      return `${text} - ${context}`;
    });

    Handlebars.registerHelper('altText', (description: string, type: string) => {
      return `${type}: ${description}`;
    });
  }

  private initializePartials(): void {
    // Header partial
    this.registerPartial('header', `
      <header class="educational-header">
        <div class="header-content">
          <h1>{{title}}</h1>
          {{#if subtitle}}<p class="subtitle">{{subtitle}}</p>{{/if}}
          {{#if user}}
          <div class="user-info">
            <span class="user-level">{{difficultyIcon user.literacyLevel}} {{capitalize user.literacyLevel}}</span>
            <span class="user-points">⭐ {{user.progress.totalPoints}} points</span>
          </div>
          {{/if}}
        </div>
      </header>
    `);

    // Progress partial
    this.registerPartial('progress', `
      <div class="progress-section">
        <div class="progress-header">
          <h3>Your Progress</h3>
          <span class="level">Level {{user.progress.level}}</span>
        </div>
        <div class="progress-details">
          {{progressBar user.progress.totalPoints 1000}}
          <div class="progress-stats">
            <span>{{user.progress.totalPoints}} / 1000 points</span>
            <span>{{user.progress.badges.length}} badges</span>
            <span>{{user.progress.streak}} day streak</span>
          </div>
        </div>
      </div>
    `);

    // Badge partial
    this.registerPartial('badge', `
      <div class="badge {{category}}" title="{{description}}">
        <div class="badge-icon">{{badgeIcon this}}</div>
        <div class="badge-info">
          <h4>{{name}}</h4>
          <p>{{description}}</p>
          <small>{{formatDate earnedAt "short"}}</small>
        </div>
      </div>
    `);

    // Quiz question partial
    this.registerPartial('quiz-question', `
      <div class="quiz-question" data-question-id="{{id}}">
        <div class="question-header">
          <h3>Question {{@index}}</h3>
          <span class="points">{{points}} points</span>
        </div>
        <div class="question-content">
          <p class="question-text">{{question}}</p>
          {{#if options}}
          <div class="options">
            {{#each options}}
            <label class="option">
              <input type="radio" name="question_{{../id}}" value="{{this}}">
              <span class="option-text">{{this}}</span>
            </label>
            {{/each}}
          </div>
          {{/if}}
        </div>
      </div>
    `);

    // Resource partial
    this.registerPartial('resource', `
      <div class="resource-card {{type}}">
        <div class="resource-header">
          <h4>{{title}}</h4>
          <span class="resource-type">{{type}}</span>
        </div>
        <p class="resource-description">{{description}}</p>
        <div class="resource-meta">
          <span class="difficulty">{{difficultyIcon difficulty}} {{capitalize difficulty}}</span>
          <span class="time">{{estimatedTime}} min</span>
        </div>
        <a href="{{url}}" class="resource-link" target="_blank" rel="noopener">
          Access Resource
        </a>
      </div>
    `);
  }

  private loadTemplates(): void {
    // Load templates from files or define inline
    this.loadExplanationTemplates();
    this.loadQuizTemplates();
    this.loadRecommendationTemplates();
    this.loadDashboardTemplates();
    this.loadGamificationTemplates();
  }

  private loadExplanationTemplates(): void {
    // Beginner explanation template
    this.registerTemplate('explanation', `
      <div class="explanation-container beginner">
        {{> header title=title subtitle="Simple Explanation"}}
        
        <div class="explanation-content">
          <div class="verdict-section">
            <h2>{{verdictIcon content.verdict}} {{#if (eq content.verdict "true")}}This is TRUE{{/if}}{{#if (eq content.verdict "false")}}This is FALSE{{/if}}{{#if (eq content.verdict "uncertain")}}This is UNCERTAIN{{/if}}</h2>
            <div class="confidence-meter">
              <span>Confidence: {{content.confidence}}%</span>
              <div class="confidence-bar">
                <div class="confidence-fill" style="width: {{content.confidence}}%;"></div>
              </div>
            </div>
          </div>

          <div class="simple-explanation">
            <h3>What this means:</h3>
            <p>{{content.content}}</p>
          </div>

          {{#if content.evidence}}
          <div class="evidence-section">
            <h3>Why we think this:</h3>
            <ul class="evidence-list">
              {{#each content.evidence}}
              <li class="evidence-item">
                <span class="evidence-type">{{categoryIcon ../content.category}}</span>
                <span class="evidence-text">{{this.description}}</span>
              </li>
              {{/each}}
            </ul>
          </div>
          {{/if}}

          <div class="learning-tip">
            <h3>💡 Learning Tip:</h3>
            <p>{{#if (eq content.verdict "true")}}Good job checking this information! Always verify facts from reliable sources.{{/if}}{{#if (eq content.verdict "false")}}This is a good example of misinformation. Always check multiple sources before sharing.{{/if}}{{#if (eq content.verdict "uncertain")}}When information is uncertain, it's best to wait for more evidence before making decisions.{{/if}}</p>
          </div>
        </div>

        {{> progress}}
      </div>
    `, LiteracyLevel.BEGINNER);

    // Intermediate explanation template
    this.registerTemplate('explanation', `
      <div class="explanation-container intermediate">
        {{> header title=title subtitle="Detailed Analysis"}}
        
        <div class="explanation-content">
          <div class="verdict-section">
            <h2>{{verdictIcon content.verdict}} {{#if (eq content.verdict "true")}}Verified as TRUE{{/if}}{{#if (eq content.verdict "false")}}Verified as FALSE{{/if}}{{#if (eq content.verdict "uncertain")}}Verification INCONCLUSIVE{{/if}}</h2>
            
            <div class="verification-details">
              <div class="confidence-metric">
                <span class="label">Confidence Score:</span>
                <span class="value {{#if (gte content.confidence 80)}}high{{else if (gte content.confidence 60)}}medium{{else}}low{{/if}}">{{content.confidence}}%</span>
              </div>
              <div class="category-tag">
                <span class="tag">{{categoryIcon content.category}} {{capitalize content.category}}</span>
              </div>
            </div>
          </div>

          <div class="analysis-summary">
            <h3>Analysis Summary:</h3>
            <p>{{content.content}}</p>
          </div>

          {{#if content.evidence}}
          <div class="evidence-analysis">
            <h3>Supporting Evidence:</h3>
            <div class="evidence-grid">
              {{#each content.evidence}}
              <div class="evidence-card">
                <div class="evidence-header">
                  <span class="evidence-type">{{this.type}}</span>
                  <span class="reliability">{{this.reliability}}%</span>
                </div>
                <div class="evidence-content">
                  <p>{{this.description}}</p>
                  {{#if this.source}}
                  <div class="evidence-source">Source: {{this.source}}</div>
                  {{/if}}
                </div>
              </div>
              {{/each}}
            </div>
          </div>
          {{/if}}

          <div class="critical-thinking">
            <h3>🧠 Critical Thinking Points:</h3>
            <ul>
              {{#if (eq content.verdict "true")}}
              <li>This information aligns with established facts from reliable sources</li>
              <li>Multiple verification methods confirm the accuracy</li>
              <li>Consider the context and potential biases in the original source</li>
              {{/if}}
              {{#if (eq content.verdict "false")}}
              <li>This information contradicts verified facts from authoritative sources</li>
              <li>Be cautious of similar claims in the future</li>
              <li>Check the credibility of sources before sharing information</li>
              {{/if}}
              {{#if (eq content.verdict "uncertain")}}
              <li>Insufficient evidence makes this claim difficult to verify</li>
              <li>Wait for more information from reliable sources</li>
              <li>Be skeptical of definitive claims about uncertain topics</li>
              {{/if}}
            </ul>
          </div>
        </div>

        {{> progress}}
      </div>
    `, LiteracyLevel.INTERMEDIATE);

    // Advanced explanation template
    this.registerTemplate('explanation', `
      <div class="explanation-container advanced">
        {{> header title=title subtitle="Comprehensive Analysis"}}
        
        <div class="explanation-content">
          <div class="verdict-section">
            <h2>{{verdictIcon content.verdict}} {{#if (eq content.verdict "true")}}VERIFIED: TRUE{{/if}}{{#if (eq content.verdict "false")}}VERIFIED: FALSE{{/if}}{{#if (eq content.verdict "uncertain")}}VERIFICATION: INCONCLUSIVE{{/if}}</h2>
            
            <div class="verification-metrics">
              <div class="metric-grid">
                <div class="metric">
                  <span class="metric-label">Confidence Score</span>
                  <span class="metric-value {{#if (gte content.confidence 80)}}high{{else if (gte content.confidence 60)}}medium{{else}}low{{/if}}">{{content.confidence}}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Category</span>
                  <span class="metric-value">{{categoryIcon content.category}} {{capitalize content.category}}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Evidence Sources</span>
                  <span class="metric-value">{{length content.evidence}}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detailed-analysis">
            <h3>Comprehensive Analysis:</h3>
            <p>{{content.content}}</p>
          </div>

          {{#if content.evidence}}
          <div class="evidence-breakdown">
            <h3>Evidence Analysis:</h3>
            <div class="evidence-matrix">
              {{#each content.evidence}}
              <div class="evidence-card advanced">
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
            <h3>🔬 Methodological Considerations:</h3>
            <ul>
              {{#if (eq content.verdict "true")}}
              <li>Cross-referenced with multiple authoritative sources</li>
              <li>Verified through independent fact-checking methodologies</li>
              <li>Assessed for potential confirmation bias in source selection</li>
              <li>Considered temporal relevance and context specificity</li>
              {{/if}}
              {{#if (eq content.verdict "false")}}
              <li>Identified specific factual inaccuracies and logical fallacies</li>
              <li>Analyzed source credibility and potential bias</li>
              <li>Examined potential motivations for misinformation</li>
              <li>Assessed impact on public understanding</li>
              {{/if}}
              {{#if (eq content.verdict "uncertain")}}
              <li>Insufficient data for statistical significance</li>
              <li>Conflicting information from multiple sources</li>
              <li>Requires additional verification methodologies</li>
              <li>Considered alternative explanations and interpretations</li>
              {{/if}}
            </ul>
          </div>

          <div class="recommendations">
            <h3>📋 Recommendations:</h3>
            <ul>
              {{#if (eq content.verdict "true")}}
              <li>Continue to verify information from multiple sources</li>
              <li>Be aware of potential context limitations</li>
              <li>Consider how this information fits into broader patterns</li>
              {{/if}}
              {{#if (eq content.verdict "false")}}
              <li>Report this misinformation to appropriate platforms</li>
              <li>Share accurate information from reliable sources</li>
              <li>Educate others about this type of misinformation</li>
              {{/if}}
              {{#if (eq content.verdict "uncertain")}}
              <li>Monitor for additional information from reliable sources</li>
              <li>Avoid making definitive claims based on this information</li>
              <li>Consider the implications of uncertainty in decision-making</li>
              {{/if}}
            </ul>
          </div>
        </div>

        {{> progress}}
      </div>
    `, LiteracyLevel.ADVANCED);
  }

  private loadQuizTemplates(): void {
    // Quiz template for all levels
    this.registerTemplate('quiz', `
      <div class="quiz-container" data-quiz-id="{{content.id}}">
        {{> header title=content.title subtitle=content.description}}
        
        <div class="quiz-meta">
          <div class="quiz-info">
            <span class="difficulty">{{difficultyIcon content.difficulty}} {{capitalize content.difficulty}}</span>
            <span class="category">{{categoryIcon content.category}} {{capitalize content.category}}</span>
            {{#if content.timeLimit}}
            <span class="time-limit">⏱️ {{content.timeLimit}}s</span>
            {{/if}}
            <span class="passing-score">🎯 {{content.passingScore}}% to pass</span>
          </div>
        </div>

        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress" style="width: 0%"></div>
          </div>
          <span class="progress-text">Question 1 of {{length content.questions}}</span>
        </div>

        <form class="quiz-form">
          {{#each content.questions}}
          {{> quiz-question}}
          {{/each}}
          
          <div class="quiz-actions">
            <button type="button" class="btn-prev" disabled>Previous</button>
            <button type="button" class="btn-next">Next Question</button>
            <button type="submit" class="btn-submit" style="display: none;">Submit Quiz</button>
          </div>
        </form>

        <div class="quiz-results" style="display: none;">
          <h3>Quiz Results</h3>
          <div class="score-display">
            <span class="score">0</span>/<span class="total">{{length content.questions}}</span>
          </div>
          <div class="feedback"></div>
        </div>
      </div>
    `);
  }

  private loadRecommendationTemplates(): void {
    // Recommendation template
    this.registerTemplate('recommendation', `
      <div class="recommendation-container">
        {{> header title=content.title subtitle="Personalized Recommendation"}}
        
        <div class="recommendation-content">
          <div class="recommendation-header">
            <div class="priority-badge priority-{{content.priority}}">
              Priority {{content.priority}}
            </div>
            <div class="category-tag">
              {{categoryIcon content.category}} {{capitalize content.category}}
            </div>
          </div>

          <div class="recommendation-description">
            <p>{{content.description}}</p>
          </div>

          {{#if content.actionItems}}
          <div class="action-items">
            <h3>Action Items:</h3>
            <ul>
              {{#each content.actionItems}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}

          {{#if content.resources}}
          <div class="recommended-resources">
            <h3>Recommended Resources:</h3>
            <div class="resources-grid">
              {{#each content.resources}}
              {{> resource}}
              {{/each}}
            </div>
          </div>
          {{/if}}
        </div>
      </div>
    `);
  }

  private loadDashboardTemplates(): void {
    // Dashboard template
    this.registerTemplate('dashboard', `
      <div class="dashboard-container">
        {{> header title="Your Learning Dashboard" subtitle="Track your progress and discover new content"}}
        
        <div class="dashboard-content">
          <div class="dashboard-grid">
            <div class="dashboard-section progress-section">
              {{> progress}}
            </div>

            <div class="dashboard-section badges-section">
              <h3>Recent Badges</h3>
              <div class="badges-grid">
                {{#each user.progress.badges}}
                {{#if @last}}{{else}}{{#if @index}}{{else}}{{> badge}}{{/if}}{{/if}}
                {{/each}}
              </div>
            </div>

            <div class="dashboard-section content-section">
              <h3>Recent Content</h3>
              <div class="content-list">
                {{#each content.content}}
                <div class="content-item">
                  <h4>{{this.title}}</h4>
                  <p>{{truncate this.content 100}}</p>
                  <span class="content-meta">
                    {{difficultyIcon this.difficulty}} {{capitalize this.difficulty}} • 
                    {{categoryIcon this.category}} {{capitalize this.category}}
                  </span>
                </div>
                {{/each}}
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  private loadGamificationTemplates(): void {
    // Gamification template
    this.registerTemplate('gamification', `
      <div class="gamification-container">
        <div class="gamification-header">
          <h2>Your Achievements</h2>
        </div>

        <div class="gamification-content">
          <div class="level-section">
            <div class="level-display">
              <div class="level-number">{{user.progress.level}}</div>
              <div class="level-label">Level</div>
            </div>
            <div class="level-progress">
              {{progressBar user.progress.totalPoints 1000}}
              <div class="level-stats">
                <span>{{user.progress.totalPoints}} / 1000 points</span>
                <span>{{user.progress.streak}} day streak</span>
              </div>
            </div>
          </div>

          <div class="badges-section">
            <h3>Badges ({{user.progress.badges.length}})</h3>
            <div class="badges-grid">
              {{#each user.progress.badges}}
              {{> badge}}
              {{/each}}
            </div>
          </div>

          <div class="stats-section">
            <h3>Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{user.progress.completedModules.length}}</div>
                <div class="stat-label">Modules Completed</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{user.progress.totalPoints}}</div>
                <div class="stat-label">Total Points</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{user.progress.streak}}</div>
                <div class="stat-label">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  private getTemplate(name: string, level: LiteracyLevel): HandlebarsTemplateDelegate {
    const key = `${name}_${level}`;
    let template = this.templates.get(key);

    if (!template) {
      // Fallback to intermediate level
      const fallbackKey = `${name}_${LiteracyLevel.INTERMEDIATE}`;
      template = this.templates.get(fallbackKey);
    }

    if (!template) {
      throw new Error(`Template not found: ${key}`);
    }

    return template;
  }

  private createContext(
    userProfile: UserProfile,
    content: any,
    options: Partial<TemplateOptions>
  ): TemplateContext {
    return {
      user: userProfile,
      content,
      metadata: {
        timestamp: new Date(),
        version: '1.0.0',
        language: userProfile.language,
        theme: 'light'
      },
      options: {
        includeCSS: true,
        includeJS: true,
        responsive: true,
        accessibility: true,
        ...options
      }
    };
  }
}