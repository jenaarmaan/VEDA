/**
 * EducationalAgent - Main orchestrator for the VEDA Educational Content system
 */

import { ExplanationGenerator } from './ExplanationGenerator';
import { QuizBuilder } from './QuizBuilder';
import { GamificationEngine } from './GamificationEngine';
import { RecommendationEngine } from './RecommendationEngine';
import {
  UserProfile,
  VerificationResult,
  EducationalContent,
  Quiz,
  Recommendation,
  LearningSession,
  UserInteraction,
  AnalyticsData,
  ProgressAnalytics,
  LiteracyLevel,
  MisinformationCategory,
  ContentType
} from './types';

export interface EducationalAgentConfig {
  enableGamification: boolean;
  enablePersonalization: boolean;
  enableAnalytics: boolean;
  defaultLanguage: string;
  maxRecommendations: number;
  sessionTimeout: number; // minutes
}

export interface ContentGenerationRequest {
  userId: string;
  verificationResults: VerificationResult[];
  contentType: ContentType[];
  options?: ContentGenerationOptions;
}

export interface ContentGenerationOptions {
  includeQuizzes?: boolean;
  includeExplanations?: boolean;
  includeRecommendations?: boolean;
  quizCount?: number;
  difficulty?: LiteracyLevel;
  categories?: MisinformationCategory[];
}

export interface EducationalSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  content: EducationalContent[];
  quizzes: Quiz[];
  recommendations: Recommendation[];
  interactions: UserInteraction[];
  analytics: AnalyticsData[];
}

export class EducationalAgent {
  private explanationGenerator: ExplanationGenerator;
  private quizBuilder: QuizBuilder;
  private gamificationEngine: GamificationEngine;
  private recommendationEngine: RecommendationEngine;
  private config: EducationalAgentConfig;
  private activeSessions: Map<string, EducationalSession> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  constructor(config?: Partial<EducationalAgentConfig>) {
    this.config = {
      enableGamification: true,
      enablePersonalization: true,
      enableAnalytics: true,
      defaultLanguage: 'en',
      maxRecommendations: 10,
      sessionTimeout: 30,
      ...config
    };

    this.initializeComponents();
  }

  /**
   * Process verification results and generate educational content
   */
  public async processVerificationResults(
    request: ContentGenerationRequest
  ): Promise<EducationalSession> {
    const userProfile = await this.getUserProfile(request.userId);
    const session = this.createSession(request.userId);

    try {
      // Generate explanations
      if (request.options?.includeExplanations !== false) {
        const explanations = this.explanationGenerator.generateBatchExplanations(
          request.verificationResults,
          userProfile
        );
        session.content.push(...explanations);
      }

      // Generate quizzes
      if (request.options?.includeQuizzes !== false) {
        const quiz = this.quizBuilder.generateQuiz(
          request.verificationResults,
          userProfile,
          {
            questionCount: request.options?.quizCount || 5,
            includeScenarios: userProfile.literacyLevel === LiteracyLevel.ADVANCED
          }
        );
        session.quizzes.push(quiz);
      }

      // Generate recommendations
      if (request.options?.includeRecommendations !== false) {
        const recommendations = this.recommendationEngine.generateRecommendations(
          userProfile,
          request.verificationResults
        );
        session.recommendations.push(...recommendations.slice(0, this.config.maxRecommendations));
      }

      // Track session analytics
      if (this.config.enableAnalytics) {
        this.trackSessionStart(session, userProfile);
      }

      this.activeSessions.set(session.id, session);
      return session;

    } catch (error) {
      console.error('Error processing verification results:', error);
      throw new Error(`Failed to process verification results: ${error.message}`);
    }
  }

  /**
   * Start a new learning session for a user
   */
  public async startLearningSession(
    userId: string,
    sessionType: 'quiz' | 'tutorial' | 'exploration' = 'exploration'
  ): Promise<EducationalSession> {
    const userProfile = await this.getUserProfile(userId);
    const session = this.createSession(userId);

    // Generate content based on session type
    switch (sessionType) {
      case 'quiz':
        await this.generateQuizSession(session, userProfile);
        break;
      case 'tutorial':
        await this.generateTutorialSession(session, userProfile);
        break;
      case 'exploration':
        await this.generateExplorationSession(session, userProfile);
        break;
    }

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Complete a learning session and update user progress
   */
  public async completeLearningSession(
    sessionId: string,
    results: SessionResults
  ): Promise<UserProfile> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const userProfile = await this.getUserProfile(session.userId);
    session.endTime = new Date();

    // Process quiz results
    if (results.quizResults) {
      const learningSession: LearningSession = {
        id: sessionId,
        moduleId: results.quizResults.quizId,
        startTime: session.startTime,
        endTime: session.endTime,
        score: results.quizResults.score,
        completed: true,
        interactions: session.interactions
      };

      // Update gamification
      if (this.config.enableGamification) {
        const points = this.gamificationEngine.calculateQuizPoints(learningSession, userProfile);
        userProfile.progress = this.gamificationEngine.updateProgress(
          userProfile,
          points,
          learningSession
        );
      }

      // Update learning history
      userProfile.learningHistory.push(learningSession);
    }

    // Track session completion
    if (this.config.enableAnalytics) {
      this.trackSessionCompletion(session, userProfile, results);
    }

    // Clean up session
    this.activeSessions.delete(sessionId);

    // Save updated profile
    await this.saveUserProfile(userProfile);
    return userProfile;
  }

  /**
   * Get personalized content recommendations for a user
   */
  public async getPersonalizedRecommendations(
    userId: string,
    context?: RecommendationContext
  ): Promise<Recommendation[]> {
    const userProfile = await this.getUserProfile(userId);
    
    // Get recent verification results for context
    const recentResults = this.getRecentVerificationResults(userId, 10);
    
    return this.recommendationEngine.generateRecommendations(
      userProfile,
      recentResults,
      context
    );
  }

  /**
   * Generate adaptive quiz based on user's weak areas
   */
  public async generateAdaptiveQuiz(userId: string): Promise<Quiz> {
    const userProfile = await this.getUserProfile(userId);
    const weakAreas = this.identifyWeakAreas(userProfile);
    
    return this.quizBuilder.generateAdaptiveQuiz(userProfile, weakAreas);
  }

  /**
   * Track user interaction within a session
   */
  public trackInteraction(
    sessionId: string,
    interaction: UserInteraction
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found for interaction tracking`);
      return;
    }

    session.interactions.push(interaction);

    // Track analytics if enabled
    if (this.config.enableAnalytics) {
      const userProfile = this.userProfiles.get(session.userId);
      if (userProfile) {
        const analyticsData = this.gamificationEngine.trackInteraction(userProfile, interaction);
        session.analytics.push(analyticsData);
      }
    }
  }

  /**
   * Get user progress analytics
   */
  public async getUserProgressAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ProgressAnalytics> {
    const userProfile = await this.getUserProfile(userId);
    const cutoffDate = this.getCutoffDate(timeframe);
    
    const recentSessions = userProfile.learningHistory.filter(
      session => session.startTime >= cutoffDate
    );

    const completedSessions = recentSessions.filter(session => session.completed);
    const totalSessions = recentSessions.length;
    
    const averageScore = completedSessions.length > 0
      ? completedSessions.reduce((sum, session) => sum + (session.score || 0), 0) / completedSessions.length
      : 0;

    const timeSpent = recentSessions.reduce((total, session) => {
      if (session.endTime) {
        return total + (session.endTime.getTime() - session.startTime.getTime());
      }
      return total;
    }, 0);

    const improvementAreas = this.identifyImprovementAreas(userProfile);

    return {
      userId,
      period: timeframe,
      totalSessions,
      averageScore,
      completedModules: userProfile.progress.completedModules.length,
      timeSpent: Math.round(timeSpent / (1000 * 60)), // minutes
      improvementAreas
    };
  }

  /**
   * Export educational content for frontend rendering
   */
  public exportContent(
    sessionId: string,
    format: 'html' | 'json' = 'html'
  ): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Generate HTML export
    return this.generateHTMLExport(session);
  }

  /**
   * Get active sessions for a user
   */
  public getActiveSessions(userId: string): EducationalSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): void {
    const now = new Date();
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions) {
      if (now.getTime() - session.startTime.getTime() > timeoutMs) {
        this.activeSessions.delete(sessionId);
        console.log(`Cleaned up expired session: ${sessionId}`);
      }
    }
  }

  private initializeComponents(): void {
    this.explanationGenerator = new ExplanationGenerator();
    this.quizBuilder = new QuizBuilder();
    this.gamificationEngine = new GamificationEngine();
    this.recommendationEngine = new RecommendationEngine();
  }

  private createSession(userId: string): EducationalSession {
    return {
      id: `session_${Date.now()}_${userId}`,
      userId,
      startTime: new Date(),
      content: [],
      quizzes: [],
      recommendations: [],
      interactions: [],
      analytics: []
    };
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      // Create default profile for new user
      profile = this.createDefaultUserProfile(userId);
      this.userProfiles.set(userId, profile);
    }
    
    return profile;
  }

  private createDefaultUserProfile(userId: string): UserProfile {
    return {
      id: userId,
      literacyLevel: LiteracyLevel.BEGINNER,
      language: this.config.defaultLanguage,
      preferences: {
        difficulty: 'beginner',
        learningStyle: 'interactive',
        topics: [],
        notifications: true
      },
      progress: {
        totalPoints: 0,
        level: 1,
        badges: [],
        completedModules: [],
        streak: 0,
        lastActivity: new Date()
      },
      learningHistory: []
    };
  }

  private async saveUserProfile(profile: UserProfile): Promise<void> {
    this.userProfiles.set(profile.id, profile);
    // In a real implementation, this would save to a database
  }

  private async generateQuizSession(
    session: EducationalSession,
    userProfile: UserProfile
  ): Promise<void> {
    const quiz = await this.generateAdaptiveQuiz(userProfile.id);
    session.quizzes.push(quiz);
  }

  private async generateTutorialSession(
    session: EducationalSession,
    userProfile: UserProfile
  ): Promise<void> {
    // Generate tutorial content based on user level
    const recommendations = this.recommendationEngine.generateRecommendations(
      userProfile,
      []
    );
    session.recommendations.push(...recommendations.slice(0, 3));
  }

  private async generateExplorationSession(
    session: EducationalSession,
    userProfile: UserProfile
  ): Promise<void> {
    // Generate mixed content for exploration
    const recommendations = this.recommendationEngine.generateRecommendations(
      userProfile,
      []
    );
    session.recommendations.push(...recommendations.slice(0, 5));
  }

  private getRecentVerificationResults(userId: string, count: number): VerificationResult[] {
    // In a real implementation, this would query a database
    // For now, return empty array
    return [];
  }

  private identifyWeakAreas(userProfile: UserProfile): string[] {
    const weakAreas: string[] = [];
    
    // Analyze learning history to identify weak areas
    const recentSessions = userProfile.learningHistory
      .filter(session => session.completed && session.score !== undefined)
      .slice(-10);

    if (recentSessions.length === 0) {
      return ['general_verification'];
    }

    const averageScore = recentSessions.reduce((sum, session) => sum + (session.score || 0), 0) / recentSessions.length;
    
    if (averageScore < 70) {
      weakAreas.push('basic_fact_checking');
    }
    
    if (averageScore < 80) {
      weakAreas.push('source_verification');
    }

    return weakAreas;
  }

  private identifyImprovementAreas(userProfile: UserProfile): string[] {
    const areas: string[] = [];
    
    // Analyze user progress to identify improvement areas
    if (userProfile.progress.streak < 7) {
      areas.push('consistency');
    }
    
    if (userProfile.progress.completedModules.length < 5) {
      areas.push('engagement');
    }
    
    if (userProfile.progress.level < 3) {
      areas.push('skill_development');
    }

    return areas;
  }

  private trackSessionStart(session: EducationalSession, userProfile: UserProfile): void {
    const analyticsData: AnalyticsData = {
      userId: session.userId,
      sessionId: session.id,
      event: 'session_start',
      timestamp: session.startTime,
      data: {
        sessionType: 'educational',
        userLevel: userProfile.literacyLevel,
        contentCount: session.content.length,
        quizCount: session.quizzes.length
      }
    };
    
    session.analytics.push(analyticsData);
  }

  private trackSessionCompletion(
    session: EducationalSession,
    userProfile: UserProfile,
    results: SessionResults
  ): void {
    const analyticsData: AnalyticsData = {
      userId: session.userId,
      sessionId: session.id,
      event: 'session_complete',
      timestamp: session.endTime || new Date(),
      data: {
        duration: session.endTime ? session.endTime.getTime() - session.startTime.getTime() : 0,
        interactions: session.interactions.length,
        quizScore: results.quizResults?.score,
        completed: true
      }
    };
    
    session.analytics.push(analyticsData);
  }

  private generateHTMLExport(session: EducationalSession): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Educational Session - ${session.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .session-header { background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content-section { margin: 20px 0; }
          .quiz-section { background: #e8f4fd; padding: 15px; border-radius: 8px; }
          .recommendation-section { background: #f0f8e8; padding: 15px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="session-header">
          <h1>Educational Session</h1>
          <p>Session ID: ${session.id}</p>
          <p>User ID: ${session.userId}</p>
          <p>Start Time: ${session.startTime.toISOString()}</p>
          ${session.endTime ? `<p>End Time: ${session.endTime.toISOString()}</p>` : ''}
        </div>
    `;

    // Add content sections
    if (session.content.length > 0) {
      html += '<div class="content-section"><h2>Educational Content</h2>';
      session.content.forEach(content => {
        html += `<div><h3>${content.title}</h3><p>${content.content}</p></div>`;
      });
      html += '</div>';
    }

    // Add quiz sections
    if (session.quizzes.length > 0) {
      html += '<div class="quiz-section"><h2>Quizzes</h2>';
      session.quizzes.forEach(quiz => {
        html += `<div><h3>${quiz.title}</h3><p>${quiz.description}</p></div>`;
      });
      html += '</div>';
    }

    // Add recommendation sections
    if (session.recommendations.length > 0) {
      html += '<div class="recommendation-section"><h2>Recommendations</h2>';
      session.recommendations.forEach(rec => {
        html += `<div><h3>${rec.title}</h3><p>${rec.description}</p></div>`;
      });
      html += '</div>';
    }

    html += '</body></html>';
    return html;
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    const cutoff = new Date(now);
    
    switch (timeframe) {
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case 'quarter':
        cutoff.setMonth(cutoff.getMonth() - 3);
        break;
      case 'year':
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        break;
    }
    
    return cutoff;
  }
}

// Additional interfaces
interface SessionResults {
  quizResults?: {
    quizId: string;
    score: number;
    answers: Record<string, string>;
    timeSpent: number;
  };
  contentInteractions?: {
    contentId: string;
    timeSpent: number;
    completed: boolean;
  }[];
  recommendationsFollowed?: string[];
}

interface RecommendationContext {
  currentEvent?: string;
  trendingTopics?: string[];
  userGoals?: string[];
  timeAvailable?: number;
}