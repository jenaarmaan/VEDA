/**
 * Core types and interfaces for the VEDA Educational Content Agent
 */

export interface VerificationResult {
  id: string;
  content: string;
  verdict: 'true' | 'false' | 'uncertain';
  confidence: number;
  evidence: Evidence[];
  source: string;
  timestamp: Date;
  category: MisinformationCategory;
}

export interface Evidence {
  type: 'fact_check' | 'source_analysis' | 'image_analysis' | 'text_analysis';
  description: string;
  reliability: number;
  source?: string;
}

export interface UserProfile {
  id: string;
  literacyLevel: LiteracyLevel;
  language: string;
  preferences: UserPreferences;
  progress: UserProgress;
  learningHistory: LearningSession[];
}

export interface UserPreferences {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'textual' | 'interactive';
  topics: string[];
  notifications: boolean;
}

export interface UserProgress {
  totalPoints: number;
  level: number;
  badges: Badge[];
  completedModules: string[];
  streak: number;
  lastActivity: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: BadgeCategory;
}

export interface LearningSession {
  id: string;
  moduleId: string;
  startTime: Date;
  endTime?: Date;
  score?: number;
  completed: boolean;
  interactions: UserInteraction[];
}

export interface UserInteraction {
  type: 'quiz_answer' | 'explanation_view' | 'resource_access' | 'recommendation_follow';
  timestamp: Date;
  data: Record<string, any>;
}

export interface EducationalContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  difficulty: LiteracyLevel;
  language: string;
  category: MisinformationCategory;
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  estimatedTime: number; // in minutes
  prerequisites: string[];
  tags: string[];
  version: string;
  lastUpdated: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  difficulty: LiteracyLevel;
  category: MisinformationCategory;
  timeLimit?: number; // in seconds
  passingScore: number;
  metadata: ContentMetadata;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: LiteracyLevel;
  points: number;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionItems: string[];
  resources: Resource[];
  priority: number;
  category: MisinformationCategory;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  description: string;
  language: string;
  difficulty: LiteracyLevel;
}

export interface GamificationConfig {
  pointsPerQuiz: number;
  pointsPerCorrectAnswer: number;
  pointsPerStreak: number;
  badgeThresholds: Record<string, number>;
  levelThresholds: number[];
  streakRewards: number[];
}

export interface AdaptiveConfig {
  difficultyAdjustment: number;
  languageSupport: string[];
  personalizationFactors: string[];
  progressTracking: boolean;
}

// Enums
export enum LiteracyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum MisinformationCategory {
  HEALTH = 'health',
  POLITICS = 'politics',
  SCIENCE = 'science',
  TECHNOLOGY = 'technology',
  ECONOMY = 'economy',
  SOCIAL = 'social',
  ENVIRONMENT = 'environment',
  GENERAL = 'general'
}

export enum ContentType {
  EXPLANATION = 'explanation',
  QUIZ = 'quiz',
  TUTORIAL = 'tutorial',
  RESOURCE = 'resource',
  RECOMMENDATION = 'recommendation'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SCENARIO = 'scenario',
  DRAG_DROP = 'drag_drop',
  FILL_BLANK = 'fill_blank'
}

export enum RecommendationType {
  PREVENTION = 'prevention',
  VERIFICATION = 'verification',
  SOURCE_CHECK = 'source_check',
  CRITICAL_THINKING = 'critical_thinking',
  FACT_CHECKING = 'fact_checking'
}

export enum ResourceType {
  ARTICLE = 'article',
  VIDEO = 'video',
  INTERACTIVE = 'interactive',
  TOOL = 'tool',
  GUIDE = 'guide'
}

export enum BadgeCategory {
  ACHIEVEMENT = 'achievement',
  SKILL = 'skill',
  MILESTONE = 'milestone',
  SPECIAL = 'special'
}

// Template data interfaces
export interface ExplanationTemplateData {
  verdict: string;
  confidence: number;
  evidence: Evidence[];
  category: string;
  userLevel: string;
  language: string;
}

export interface QuizTemplateData {
  quiz: Quiz;
  userLevel: string;
  language: string;
  timeLimit?: number;
}

export interface RecommendationTemplateData {
  recommendation: Recommendation;
  userProfile: UserProfile;
  context: string;
}

// Analytics interfaces
export interface AnalyticsData {
  userId: string;
  sessionId: string;
  event: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface ProgressAnalytics {
  userId: string;
  period: string;
  totalSessions: number;
  averageScore: number;
  completedModules: number;
  timeSpent: number;
  improvementAreas: string[];
}