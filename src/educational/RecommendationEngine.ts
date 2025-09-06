/**
 * RecommendationEngine - Suggests tailored prevention strategies and resources
 */

import {
  UserProfile,
  Recommendation,
  RecommendationType,
  Resource,
  ResourceType,
  MisinformationCategory,
  LiteracyLevel,
  VerificationResult,
  LearningSession,
  UserProgress
} from './types';

export class RecommendationEngine {
  private resourceDatabase: Map<string, Resource> = new Map();
  private recommendationTemplates: Map<string, RecommendationTemplate> = new Map();

  constructor() {
    this.initializeResourceDatabase();
    this.initializeRecommendationTemplates();
  }

  /**
   * Generate personalized recommendations based on user profile and activity
   */
  public generateRecommendations(
    userProfile: UserProfile,
    recentResults: VerificationResult[],
    context?: RecommendationContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Analyze user patterns and weaknesses
    const analysis = this.analyzeUserPatterns(userProfile, recentResults);

    // Generate recommendations based on analysis
    recommendations.push(...this.generatePreventionRecommendations(analysis, userProfile));
    recommendations.push(...this.generateSkillRecommendations(analysis, userProfile));
    recommendations.push(...this.generateResourceRecommendations(analysis, userProfile));

    // Sort by priority and relevance
    return this.prioritizeRecommendations(recommendations, userProfile);
  }

  /**
   * Generate recommendations for specific misinformation category
   */
  public generateCategoryRecommendations(
    category: MisinformationCategory,
    userProfile: UserProfile,
    recentResults: VerificationResult[]
  ): Recommendation[] {
    const categoryResults = recentResults.filter(r => r.category === category);
    const analysis = this.analyzeUserPatterns(userProfile, categoryResults);

    return this.generatePreventionRecommendations(analysis, userProfile, category);
  }

  /**
   * Generate recommendations based on quiz performance
   */
  public generatePerformanceRecommendations(
    userProfile: UserProfile,
    recentSessions: LearningSession[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const performanceAnalysis = this.analyzeQuizPerformance(recentSessions);

    // Low performance recommendations
    if (performanceAnalysis.averageScore < 70) {
      recommendations.push({
        id: 'improve_basics',
        type: RecommendationType.CRITICAL_THINKING,
        title: 'Strengthen Your Foundation',
        description: 'Focus on basic fact-checking skills to improve your accuracy',
        actionItems: [
          'Complete beginner-level verification tutorials',
          'Practice identifying reliable sources',
          'Learn about common misinformation patterns',
          'Take foundational quizzes regularly'
        ],
        resources: this.getResourcesByType(ResourceType.GUIDE, LiteracyLevel.BEGINNER),
        priority: 1,
        category: MisinformationCategory.GENERAL
      });
    }

    // Speed vs accuracy recommendations
    if (performanceAnalysis.averageTime < 60 && performanceAnalysis.averageScore < 80) {
      recommendations.push({
        id: 'slow_down',
        type: RecommendationType.CRITICAL_THINKING,
        title: 'Take Your Time',
        description: 'You\'re completing quizzes quickly but missing accuracy. Slow down and think critically.',
        actionItems: [
          'Read questions carefully before answering',
          'Consider all options before selecting',
          'Review explanations after each quiz',
          'Practice with time-limited scenarios'
        ],
        resources: this.getResourcesByType(ResourceType.INTERACTIVE, userProfile.literacyLevel),
        priority: 2,
        category: MisinformationCategory.GENERAL
      });
    }

    return recommendations;
  }

  /**
   * Generate contextual recommendations based on current events or trends
   */
  public generateContextualRecommendations(
    userProfile: UserProfile,
    trendingTopics: string[],
    currentEvents: string[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    trendingTopics.forEach(topic => {
      const category = this.mapTopicToCategory(topic);
      recommendations.push({
        id: `trending_${topic}`,
        type: RecommendationType.PREVENTION,
        title: `Stay Informed About ${topic}`,
        description: `Learn to identify misinformation related to trending topic: ${topic}`,
        actionItems: [
          `Research reliable sources about ${topic}`,
          'Learn to identify bias in news coverage',
          'Practice fact-checking claims about this topic',
          'Understand the difference between opinion and fact'
        ],
        resources: this.getResourcesByCategory(category, userProfile.literacyLevel),
        priority: 3,
        category
      });
    });

    return recommendations;
  }

  /**
   * Get personalized learning path recommendations
   */
  public generateLearningPath(
    userProfile: UserProfile,
    goals: string[]
  ): LearningPathRecommendation {
    const currentLevel = userProfile.literacyLevel;
    const nextLevel = this.getNextLiteracyLevel(currentLevel);
    
    const path: LearningPathRecommendation = {
      id: `path_${userProfile.id}`,
      title: `Path to ${nextLevel} Level`,
      description: `Personalized learning journey to advance your digital literacy skills`,
      currentLevel,
      targetLevel: nextLevel,
      estimatedDuration: this.calculatePathDuration(currentLevel, nextLevel),
      modules: this.generatePathModules(userProfile, goals),
      milestones: this.generatePathMilestones(currentLevel, nextLevel)
    };

    return path;
  }

  /**
   * Generate resource recommendations based on user interests
   */
  public generateResourceRecommendations(
    userProfile: UserProfile,
    interests: string[]
  ): Resource[] {
    const recommendations: Resource[] = [];
    
    interests.forEach(interest => {
      const category = this.mapTopicToCategory(interest);
      const resources = this.getResourcesByCategory(category, userProfile.literacyLevel);
      recommendations.push(...resources.slice(0, 3)); // Top 3 per interest
    });

    return this.deduplicateResources(recommendations);
  }

  private analyzeUserPatterns(
    userProfile: UserProfile,
    results: VerificationResult[]
  ): UserPatternAnalysis {
    const totalResults = results.length;
    const falseResults = results.filter(r => r.verdict === 'false').length;
    const uncertainResults = results.filter(r => r.verdict === 'uncertain').length;
    
    const categoryCounts = results.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weakCategories = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category as MisinformationCategory);

    return {
      totalInteractions: totalResults,
      falsePositiveRate: totalResults > 0 ? (falseResults / totalResults) * 100 : 0,
      uncertaintyRate: totalResults > 0 ? (uncertainResults / totalResults) * 100 : 0,
      weakCategories,
      averageConfidence: totalResults > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / totalResults : 0,
      literacyLevel: userProfile.literacyLevel
    };
  }

  private analyzeQuizPerformance(sessions: LearningSession[]): QuizPerformanceAnalysis {
    const completedSessions = sessions.filter(s => s.completed && s.score !== undefined);
    
    if (completedSessions.length === 0) {
      return {
        averageScore: 0,
        averageTime: 0,
        completionRate: 0,
        improvementTrend: 'stable'
      };
    }

    const averageScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length;
    const averageTime = completedSessions.reduce((sum, s) => {
      if (s.endTime) {
        return sum + (s.endTime.getTime() - s.startTime.getTime()) / 1000; // seconds
      }
      return sum;
    }, 0) / completedSessions.length;

    const completionRate = (completedSessions.length / sessions.length) * 100;

    // Calculate improvement trend (simplified)
    const recentScores = completedSessions.slice(-5).map(s => s.score || 0);
    const olderScores = completedSessions.slice(0, -5).map(s => s.score || 0);
    
    let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentScores.length > 0 && olderScores.length > 0) {
      const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;
      
      if (recentAvg > olderAvg + 5) improvementTrend = 'improving';
      else if (recentAvg < olderAvg - 5) improvementTrend = 'declining';
    }

    return {
      averageScore,
      averageTime,
      completionRate,
      improvementTrend
    };
  }

  private generatePreventionRecommendations(
    analysis: UserPatternAnalysis,
    userProfile: UserProfile,
    specificCategory?: MisinformationCategory
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High false positive rate
    if (analysis.falsePositiveRate > 30) {
      recommendations.push({
        id: 'reduce_false_positives',
        type: RecommendationType.VERIFICATION,
        title: 'Improve Your Verification Skills',
        description: 'You\'re frequently encountering false information. Let\'s strengthen your verification abilities.',
        actionItems: [
          'Learn to identify reliable sources',
          'Practice cross-referencing information',
          'Understand common misinformation tactics',
          'Use fact-checking tools regularly'
        ],
        resources: this.getResourcesByType(ResourceType.TOOL, userProfile.literacyLevel),
        priority: 1,
        category: specificCategory || MisinformationCategory.GENERAL
      });
    }

    // High uncertainty rate
    if (analysis.uncertaintyRate > 40) {
      recommendations.push({
        id: 'handle_uncertainty',
        type: RecommendationType.CRITICAL_THINKING,
        title: 'Dealing with Uncertainty',
        description: 'You encounter a lot of uncertain information. Learn strategies for handling ambiguity.',
        actionItems: [
          'Learn to identify when information is insufficient',
          'Practice seeking additional sources',
          'Understand the difference between uncertainty and falsehood',
          'Develop comfort with saying "I don\'t know"'
        ],
        resources: this.getResourcesByType(ResourceType.GUIDE, userProfile.literacyLevel),
        priority: 2,
        category: specificCategory || MisinformationCategory.GENERAL
      });
    }

    // Weak categories
    analysis.weakCategories.forEach(category => {
      recommendations.push({
        id: `strengthen_${category}`,
        type: RecommendationType.PREVENTION,
        title: `Strengthen Your ${category} Knowledge`,
        description: `Improve your ability to identify misinformation in ${category} topics.`,
        actionItems: [
          `Study reliable sources for ${category} information`,
          `Learn common misinformation patterns in ${category}`,
          `Practice fact-checking ${category} claims`,
          `Stay updated on ${category} developments`
        ],
        resources: this.getResourcesByCategory(category, userProfile.literacyLevel),
        priority: 3,
        category
      });
    });

    return recommendations;
  }

  private generateSkillRecommendations(
    analysis: UserPatternAnalysis,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Low confidence in results
    if (analysis.averageConfidence < 70) {
      recommendations.push({
        id: 'build_confidence',
        type: RecommendationType.CRITICAL_THINKING,
        title: 'Build Your Confidence',
        description: 'Develop stronger critical thinking skills to feel more confident in your assessments.',
        actionItems: [
          'Practice with easier verification tasks',
          'Learn about logical fallacies',
          'Study reliable source characteristics',
          'Take confidence-building exercises'
        ],
        resources: this.getResourcesByType(ResourceType.INTERACTIVE, userProfile.literacyLevel),
        priority: 2,
        category: MisinformationCategory.GENERAL
      });
    }

    return recommendations;
  }

  private generateResourceRecommendations(
    analysis: UserPatternAnalysis,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommend resources based on literacy level
    const appropriateResources = this.getResourcesByType(
      ResourceType.ARTICLE,
      userProfile.literacyLevel
    );

    if (appropriateResources.length > 0) {
      recommendations.push({
        id: 'curated_resources',
        type: RecommendationType.PREVENTION,
        title: 'Curated Learning Resources',
        description: 'Hand-picked resources to enhance your digital literacy skills.',
        actionItems: [
          'Read recommended articles regularly',
          'Watch educational videos',
          'Practice with interactive tools',
          'Join learning communities'
        ],
        resources: appropriateResources.slice(0, 5),
        priority: 4,
        category: MisinformationCategory.GENERAL
      });
    }

    return recommendations;
  }

  private prioritizeRecommendations(
    recommendations: Recommendation[],
    userProfile: UserProfile
  ): Recommendation[] {
    return recommendations
      .sort((a, b) => {
        // Sort by priority first, then by relevance to user
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        
        // Consider user preferences and history
        const aRelevance = this.calculateRelevance(a, userProfile);
        const bRelevance = this.calculateRelevance(b, userProfile);
        
        return bRelevance - aRelevance;
      })
      .slice(0, 10); // Return top 10 recommendations
  }

  private calculateRelevance(recommendation: Recommendation, userProfile: UserProfile): number {
    let relevance = 0;
    
    // Check if category matches user interests
    if (userProfile.preferences.topics.includes(recommendation.category)) {
      relevance += 10;
    }
    
    // Check if difficulty matches user level
    if (recommendation.resources.some(r => r.difficulty === userProfile.literacyLevel)) {
      relevance += 5;
    }
    
    // Check if user has completed similar content
    const hasCompletedSimilar = userProfile.progress.completedModules.some(moduleId =>
      moduleId.includes(recommendation.category)
    );
    
    if (!hasCompletedSimilar) {
      relevance += 3; // Boost for new content
    }
    
    return relevance;
  }

  private initializeResourceDatabase(): void {
    // Health resources
    this.addResource({
      id: 'health_fact_checking',
      title: 'Health Information Fact-Checking Guide',
      url: 'https://example.com/health-fact-checking',
      type: ResourceType.GUIDE,
      description: 'Learn how to verify health information and identify medical misinformation',
      language: 'en',
      difficulty: LiteracyLevel.INTERMEDIATE
    });

    // Politics resources
    this.addResource({
      id: 'political_bias_detection',
      title: 'Detecting Political Bias in News',
      url: 'https://example.com/political-bias',
      type: ResourceType.ARTICLE,
      description: 'Understanding how to identify and account for political bias in news sources',
      language: 'en',
      difficulty: LiteracyLevel.ADVANCED
    });

    // Science resources
    this.addResource({
      id: 'scientific_method',
      title: 'Understanding the Scientific Method',
      url: 'https://example.com/scientific-method',
      type: ResourceType.VIDEO,
      description: 'Learn how scientific research works and how to evaluate scientific claims',
      language: 'en',
      difficulty: LiteracyLevel.BEGINNER
    });

    // Technology resources
    this.addResource({
      id: 'tech_verification_tools',
      title: 'Technology Verification Tools',
      url: 'https://example.com/tech-tools',
      type: ResourceType.TOOL,
      description: 'Digital tools and techniques for verifying technology-related information',
      language: 'en',
      difficulty: LiteracyLevel.INTERMEDIATE
    });

    // Interactive resources
    this.addResource({
      id: 'interactive_fact_checker',
      title: 'Interactive Fact-Checking Simulator',
      url: 'https://example.com/interactive-simulator',
      type: ResourceType.INTERACTIVE,
      description: 'Practice your fact-checking skills with realistic scenarios',
      language: 'en',
      difficulty: LiteracyLevel.INTERMEDIATE
    });
  }

  private addResource(resource: Resource): void {
    this.resourceDatabase.set(resource.id, resource);
  }

  private initializeRecommendationTemplates(): void {
    // This would typically load from a database or configuration file
    // For now, we'll use the inline generation methods
  }

  private getResourcesByType(type: ResourceType, difficulty: LiteracyLevel): Resource[] {
    return Array.from(this.resourceDatabase.values())
      .filter(r => r.type === type && r.difficulty === difficulty);
  }

  private getResourcesByCategory(category: MisinformationCategory, difficulty: LiteracyLevel): Resource[] {
    // This would typically filter by category metadata
    // For now, return general resources
    return Array.from(this.resourceDatabase.values())
      .filter(r => r.difficulty === difficulty)
      .slice(0, 3);
  }

  private mapTopicToCategory(topic: string): MisinformationCategory {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('health') || topicLower.includes('medical')) {
      return MisinformationCategory.HEALTH;
    } else if (topicLower.includes('politics') || topicLower.includes('election')) {
      return MisinformationCategory.POLITICS;
    } else if (topicLower.includes('science') || topicLower.includes('research')) {
      return MisinformationCategory.SCIENCE;
    } else if (topicLower.includes('technology') || topicLower.includes('tech')) {
      return MisinformationCategory.TECHNOLOGY;
    } else if (topicLower.includes('economy') || topicLower.includes('finance')) {
      return MisinformationCategory.ECONOMY;
    } else if (topicLower.includes('environment') || topicLower.includes('climate')) {
      return MisinformationCategory.ENVIRONMENT;
    } else {
      return MisinformationCategory.GENERAL;
    }
  }

  private getNextLiteracyLevel(current: LiteracyLevel): LiteracyLevel {
    switch (current) {
      case LiteracyLevel.BEGINNER:
        return LiteracyLevel.INTERMEDIATE;
      case LiteracyLevel.INTERMEDIATE:
        return LiteracyLevel.ADVANCED;
      case LiteracyLevel.ADVANCED:
        return LiteracyLevel.ADVANCED; // Already at highest level
      default:
        return LiteracyLevel.INTERMEDIATE;
    }
  }

  private calculatePathDuration(current: LiteracyLevel, target: LiteracyLevel): number {
    const durations = {
      [LiteracyLevel.BEGINNER]: 4, // weeks
      [LiteracyLevel.INTERMEDIATE]: 6,
      [LiteracyLevel.ADVANCED]: 8
    };
    
    return durations[target] - durations[current];
  }

  private generatePathModules(userProfile: UserProfile, goals: string[]): PathModule[] {
    // This would generate a structured learning path
    return [
      {
        id: 'module_1',
        title: 'Foundation Skills',
        description: 'Build basic fact-checking and verification skills',
        estimatedTime: 2,
        prerequisites: [],
        resources: this.getResourcesByType(ResourceType.GUIDE, LiteracyLevel.BEGINNER)
      },
      {
        id: 'module_2',
        title: 'Advanced Techniques',
        description: 'Learn advanced verification and critical thinking techniques',
        estimatedTime: 3,
        prerequisites: ['module_1'],
        resources: this.getResourcesByType(ResourceType.INTERACTIVE, LiteracyLevel.INTERMEDIATE)
      }
    ];
  }

  private generatePathMilestones(current: LiteracyLevel, target: LiteracyLevel): PathMilestone[] {
    return [
      {
        id: 'milestone_1',
        title: 'Complete Foundation Module',
        description: 'Master basic verification skills',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
      },
      {
        id: 'milestone_2',
        title: 'Achieve Intermediate Level',
        description: 'Demonstrate intermediate-level skills',
        targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 4 weeks
      }
    ];
  }

  private deduplicateResources(resources: Resource[]): Resource[] {
    const seen = new Set<string>();
    return resources.filter(resource => {
      if (seen.has(resource.id)) {
        return false;
      }
      seen.add(resource.id);
      return true;
    });
  }
}

// Additional interfaces for recommendations
interface RecommendationContext {
  currentEvent?: string;
  trendingTopics?: string[];
  userGoals?: string[];
  timeAvailable?: number; // minutes
}

interface UserPatternAnalysis {
  totalInteractions: number;
  falsePositiveRate: number;
  uncertaintyRate: number;
  weakCategories: MisinformationCategory[];
  averageConfidence: number;
  literacyLevel: LiteracyLevel;
}

interface QuizPerformanceAnalysis {
  averageScore: number;
  averageTime: number; // seconds
  completionRate: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
}

interface LearningPathRecommendation {
  id: string;
  title: string;
  description: string;
  currentLevel: LiteracyLevel;
  targetLevel: LiteracyLevel;
  estimatedDuration: number; // weeks
  modules: PathModule[];
  milestones: PathMilestone[];
}

interface PathModule {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // weeks
  prerequisites: string[];
  resources: Resource[];
}

interface PathMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
}

interface RecommendationTemplate {
  id: string;
  type: RecommendationType;
  titleTemplate: string;
  descriptionTemplate: string;
  actionItemsTemplate: string[];
  conditions: (analysis: UserPatternAnalysis) => boolean;
}