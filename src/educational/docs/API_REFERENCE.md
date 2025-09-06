# VEDA Educational Content Agent - API Reference

## Overview

The VEDA Educational Content Agent provides a comprehensive API for generating educational content, managing user progress, and delivering personalized learning experiences. This document covers all available methods, interfaces, and usage patterns.

## Table of Contents

- [Core Classes](#core-classes)
- [EducationalAgent](#educationalagent)
- [ExplanationGenerator](#explanationgenerator)
- [QuizBuilder](#quizbuilder)
- [GamificationEngine](#gamificationengine)
- [RecommendationEngine](#recommendationengine)
- [TemplateEngine](#templateengine)
- [Data Types](#data-types)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Core Classes

### EducationalAgent

The main orchestrator class that coordinates all educational content generation and user management.

#### Constructor

```typescript
new EducationalAgent(config?: Partial<EducationalAgentConfig>)
```

**Configuration Options:**
- `enableGamification: boolean` - Enable gamification features (default: true)
- `enablePersonalization: boolean` - Enable personalization features (default: true)
- `enableAnalytics: boolean` - Enable analytics tracking (default: true)
- `defaultLanguage: string` - Default language for content (default: 'en')
- `maxRecommendations: number` - Maximum recommendations per user (default: 10)
- `sessionTimeout: number` - Session timeout in minutes (default: 30)

#### Methods

##### processVerificationResults

Processes verification results and generates educational content.

```typescript
async processVerificationResults(request: ContentGenerationRequest): Promise<EducationalSession>
```

**Parameters:**
- `request.userId: string` - User identifier
- `request.verificationResults: VerificationResult[]` - Array of verification results
- `request.contentType: ContentType[]` - Types of content to generate
- `request.options?: ContentGenerationOptions` - Optional configuration

**Returns:** `EducationalSession` with generated content

**Example:**
```typescript
const session = await educationalAgent.processVerificationResults({
  userId: 'user_123',
  verificationResults: [verificationResult],
  contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
});
```

##### startLearningSession

Starts a new learning session for a user.

```typescript
async startLearningSession(
  userId: string, 
  sessionType?: 'quiz' | 'tutorial' | 'exploration'
): Promise<EducationalSession>
```

**Parameters:**
- `userId: string` - User identifier
- `sessionType: string` - Type of learning session (default: 'exploration')

**Returns:** `EducationalSession` with session details

##### completeLearningSession

Completes a learning session and updates user progress.

```typescript
async completeLearningSession(
  sessionId: string, 
  results: SessionResults
): Promise<UserProfile>
```

**Parameters:**
- `sessionId: string` - Session identifier
- `results: SessionResults` - Session completion results

**Returns:** Updated `UserProfile`

##### getPersonalizedRecommendations

Gets personalized recommendations for a user.

```typescript
async getPersonalizedRecommendations(
  userId: string, 
  context?: RecommendationContext
): Promise<Recommendation[]>
```

**Parameters:**
- `userId: string` - User identifier
- `context?: RecommendationContext` - Optional context for recommendations

**Returns:** Array of `Recommendation` objects

##### generateAdaptiveQuiz

Generates an adaptive quiz based on user's weak areas.

```typescript
async generateAdaptiveQuiz(userId: string): Promise<Quiz>
```

**Parameters:**
- `userId: string` - User identifier

**Returns:** `Quiz` object

##### trackInteraction

Tracks user interaction within a session.

```typescript
trackInteraction(sessionId: string, interaction: UserInteraction): void
```

**Parameters:**
- `sessionId: string` - Session identifier
- `interaction: UserInteraction` - Interaction data

##### getUserProgressAnalytics

Gets user progress analytics for a specified timeframe.

```typescript
async getUserProgressAnalytics(
  userId: string, 
  timeframe?: 'week' | 'month' | 'quarter' | 'year'
): Promise<ProgressAnalytics>
```

**Parameters:**
- `userId: string` - User identifier
- `timeframe: string` - Analytics timeframe (default: 'month')

**Returns:** `ProgressAnalytics` object

##### exportContent

Exports educational content in specified format.

```typescript
exportContent(sessionId: string, format?: 'html' | 'json'): string
```

**Parameters:**
- `sessionId: string` - Session identifier
- `format: string` - Export format (default: 'html')

**Returns:** Exported content as string

##### getActiveSessions

Gets active sessions for a user.

```typescript
getActiveSessions(userId: string): EducationalSession[]
```

**Parameters:**
- `userId: string` - User identifier

**Returns:** Array of active `EducationalSession` objects

##### cleanupExpiredSessions

Cleans up expired sessions.

```typescript
cleanupExpiredSessions(): void
```

## ExplanationGenerator

Generates clear, contextualized explanations for verification results.

#### Constructor

```typescript
new ExplanationGenerator()
```

#### Methods

##### generateExplanation

Generates explanation for a verification result.

```typescript
generateExplanation(
  result: VerificationResult, 
  userProfile: UserProfile
): EducationalContent
```

**Parameters:**
- `result: VerificationResult` - Verification result to explain
- `userProfile: UserProfile` - User profile for personalization

**Returns:** `EducationalContent` with explanation

##### generateBatchExplanations

Generates explanations for multiple verification results.

```typescript
generateBatchExplanations(
  results: VerificationResult[], 
  userProfile: UserProfile
): EducationalContent[]
```

**Parameters:**
- `results: VerificationResult[]` - Array of verification results
- `userProfile: UserProfile` - User profile for personalization

**Returns:** Array of `EducationalContent` objects

##### generateSummary

Generates explanation summary for dashboard.

```typescript
generateSummary(
  results: VerificationResult[], 
  userProfile: UserProfile
): string
```

**Parameters:**
- `results: VerificationResult[]` - Array of verification results
- `userProfile: UserProfile` - User profile for personalization

**Returns:** Summary string

## QuizBuilder

Converts verification results and key facts into interactive quizzes.

#### Constructor

```typescript
new QuizBuilder()
```

#### Methods

##### generateQuiz

Generates quiz from verification results.

```typescript
generateQuiz(
  results: VerificationResult[], 
  userProfile: UserProfile, 
  options?: QuizGenerationOptions
): Quiz
```

**Parameters:**
- `results: VerificationResult[]` - Array of verification results
- `userProfile: UserProfile` - User profile for personalization
- `options?: QuizGenerationOptions` - Optional quiz configuration

**Returns:** `Quiz` object

##### generateScenarioQuiz

Generates scenario-based quiz questions.

```typescript
generateScenarioQuiz(
  scenarios: MisinformationScenario[], 
  userProfile: UserProfile
): Quiz
```

**Parameters:**
- `scenarios: MisinformationScenario[]` - Array of misinformation scenarios
- `userProfile: UserProfile` - User profile for personalization

**Returns:** `Quiz` object

##### generateAdaptiveQuiz

Generates adaptive quiz based on user progress.

```typescript
generateAdaptiveQuiz(
  userProfile: UserProfile, 
  weakAreas: string[], 
  options?: AdaptiveQuizOptions
): Quiz
```

**Parameters:**
- `userProfile: UserProfile` - User profile for personalization
- `weakAreas: string[]` - Array of weak areas to focus on
- `options?: AdaptiveQuizOptions` - Optional adaptive configuration

**Returns:** `Quiz` object

##### exportQuizAsHTML

Exports quiz as HTML for frontend rendering.

```typescript
exportQuizAsHTML(quiz: Quiz, userProfile: UserProfile): string
```

**Parameters:**
- `quiz: Quiz` - Quiz to export
- `userProfile: UserProfile` - User profile for personalization

**Returns:** HTML string

##### exportQuizAsJSON

Exports quiz as JSON for API consumption.

```typescript
exportQuizAsJSON(quiz: Quiz): string
```

**Parameters:**
- `quiz: Quiz` - Quiz to export

**Returns:** JSON string

## GamificationEngine

Manages points, badges, progression, and user engagement.

#### Constructor

```typescript
new GamificationEngine(config?: Partial<GamificationConfig>)
```

**Configuration Options:**
- `pointsPerQuiz: number` - Points awarded per quiz completion (default: 50)
- `pointsPerCorrectAnswer: number` - Points per correct answer (default: 10)
- `pointsPerStreak: number` - Points per streak day (default: 5)
- `badgeThresholds: Record<string, number>` - Badge earning thresholds
- `levelThresholds: number[]` - Level progression thresholds
- `streakRewards: number[]` - Streak bonus rewards

#### Methods

##### calculateQuizPoints

Calculates points for a completed quiz.

```typescript
calculateQuizPoints(
  session: LearningSession, 
  userProfile: UserProfile
): number
```

**Parameters:**
- `session: LearningSession` - Completed learning session
- `userProfile: UserProfile` - User profile

**Returns:** Points earned

##### updateProgress

Updates user progress with new points and checks for level up.

```typescript
updateProgress(
  userProfile: UserProfile, 
  points: number, 
  session: LearningSession
): UserProgress
```

**Parameters:**
- `userProfile: UserProfile` - Current user profile
- `points: number` - Points to add
- `session: LearningSession` - Learning session

**Returns:** Updated `UserProgress`

##### checkForNewBadges

Checks for new badges based on user activity.

```typescript
checkForNewBadges(
  userProfile: UserProfile, 
  session: LearningSession, 
  newProgress: UserProgress
): Badge[]
```

**Parameters:**
- `userProfile: UserProfile` - Current user profile
- `session: LearningSession` - Learning session
- `newProgress: UserProgress` - Updated progress

**Returns:** Array of new `Badge` objects

##### generateLeaderboard

Generates leaderboard data.

```typescript
generateLeaderboard(
  users: UserProfile[], 
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all'
): LeaderboardEntry[]
```

**Parameters:**
- `users: UserProfile[]` - Array of user profiles
- `timeframe: string` - Leaderboard timeframe

**Returns:** Array of `LeaderboardEntry` objects

##### generateAchievementSummary

Generates achievement summary for user.

```typescript
generateAchievementSummary(userProfile: UserProfile): AchievementSummary
```

**Parameters:**
- `userProfile: UserProfile` - User profile

**Returns:** `AchievementSummary` object

##### generateChallenges

Generates personalized challenges for user.

```typescript
generateChallenges(userProfile: UserProfile): Challenge[]
```

**Parameters:**
- `userProfile: UserProfile` - User profile

**Returns:** Array of `Challenge` objects

##### trackInteraction

Tracks user interaction for analytics.

```typescript
trackInteraction(
  userProfile: UserProfile, 
  interaction: UserInteraction
): AnalyticsData
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `interaction: UserInteraction` - Interaction data

**Returns:** `AnalyticsData` object

## RecommendationEngine

Suggests tailored prevention strategies and resources.

#### Constructor

```typescript
new RecommendationEngine()
```

#### Methods

##### generateRecommendations

Generates personalized recommendations based on user profile and activity.

```typescript
generateRecommendations(
  userProfile: UserProfile, 
  recentResults: VerificationResult[], 
  context?: RecommendationContext
): Recommendation[]
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `recentResults: VerificationResult[]` - Recent verification results
- `context?: RecommendationContext` - Optional context

**Returns:** Array of `Recommendation` objects

##### generateCategoryRecommendations

Generates recommendations for specific misinformation category.

```typescript
generateCategoryRecommendations(
  category: MisinformationCategory, 
  userProfile: UserProfile, 
  recentResults: VerificationResult[]
): Recommendation[]
```

**Parameters:**
- `category: MisinformationCategory` - Misinformation category
- `userProfile: UserProfile` - User profile
- `recentResults: VerificationResult[]` - Recent verification results

**Returns:** Array of `Recommendation` objects

##### generatePerformanceRecommendations

Generates recommendations based on quiz performance.

```typescript
generatePerformanceRecommendations(
  userProfile: UserProfile, 
  recentSessions: LearningSession[]
): Recommendation[]
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `recentSessions: LearningSession[]` - Recent learning sessions

**Returns:** Array of `Recommendation` objects

##### generateContextualRecommendations

Generates contextual recommendations based on current events or trends.

```typescript
generateContextualRecommendations(
  userProfile: UserProfile, 
  trendingTopics: string[], 
  currentEvents: string[]
): Recommendation[]
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `trendingTopics: string[]` - Trending topics
- `currentEvents: string[]` - Current events

**Returns:** Array of `Recommendation` objects

##### generateLearningPath

Gets personalized learning path recommendations.

```typescript
generateLearningPath(
  userProfile: UserProfile, 
  goals: string[]
): LearningPathRecommendation
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `goals: string[]` - Learning goals

**Returns:** `LearningPathRecommendation` object

##### generateResourceRecommendations

Generates resource recommendations based on user interests.

```typescript
generateResourceRecommendations(
  userProfile: UserProfile, 
  interests: string[]
): Resource[]
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `interests: string[]` - User interests

**Returns:** Array of `Resource` objects

## TemplateEngine

Handlebars-based templating system for educational content.

#### Constructor

```typescript
new TemplateEngine()
```

#### Methods

##### renderExplanation

Renders explanation content with user-specific template.

```typescript
renderExplanation(
  content: EducationalContent, 
  userProfile: UserProfile, 
  options?: Partial<TemplateOptions>
): string
```

**Parameters:**
- `content: EducationalContent` - Educational content
- `userProfile: UserProfile` - User profile
- `options?: Partial<TemplateOptions>` - Template options

**Returns:** Rendered HTML string

##### renderQuiz

Renders quiz content with interactive elements.

```typescript
renderQuiz(
  quiz: Quiz, 
  userProfile: UserProfile, 
  options?: Partial<TemplateOptions>
): string
```

**Parameters:**
- `quiz: Quiz` - Quiz object
- `userProfile: UserProfile` - User profile
- `options?: Partial<TemplateOptions>` - Template options

**Returns:** Rendered HTML string

##### renderRecommendation

Renders recommendation content.

```typescript
renderRecommendation(
  recommendation: Recommendation, 
  userProfile: UserProfile, 
  options?: Partial<TemplateOptions>
): string
```

**Parameters:**
- `recommendation: Recommendation` - Recommendation object
- `userProfile: UserProfile` - User profile
- `options?: Partial<TemplateOptions>` - Template options

**Returns:** Rendered HTML string

##### renderDashboard

Renders dashboard with user progress and content.

```typescript
renderDashboard(
  userProfile: UserProfile, 
  recentContent: EducationalContent[], 
  options?: Partial<TemplateOptions>
): string
```

**Parameters:**
- `userProfile: UserProfile` - User profile
- `recentContent: EducationalContent[]` - Recent content
- `options?: Partial<TemplateOptions>` - Template options

**Returns:** Rendered HTML string

##### registerTemplate

Registers a custom template.

```typescript
registerTemplate(
  name: string, 
  templateString: string, 
  level?: LiteracyLevel
): void
```

**Parameters:**
- `name: string` - Template name
- `templateString: string` - Template string
- `level?: LiteracyLevel` - Optional literacy level

##### registerPartial

Registers a custom partial.

```typescript
registerPartial(name: string, partialString: string): void
```

**Parameters:**
- `name: string` - Partial name
- `partialString: string` - Partial string

##### registerHelper

Registers a custom helper.

```typescript
registerHelper(name: string, helper: Handlebars.HelperDelegate): void
```

**Parameters:**
- `name: string` - Helper name
- `helper: Handlebars.HelperDelegate` - Helper function

##### precompileTemplates

Precompiles templates for better performance.

```typescript
precompileTemplates(): Map<string, string>
```

**Returns:** Map of precompiled templates

## Data Types

### Core Types

#### VerificationResult

```typescript
interface VerificationResult {
  id: string;
  content: string;
  verdict: 'true' | 'false' | 'uncertain';
  confidence: number;
  evidence: Evidence[];
  source: string;
  timestamp: Date;
  category: MisinformationCategory;
}
```

#### UserProfile

```typescript
interface UserProfile {
  id: string;
  literacyLevel: LiteracyLevel;
  language: string;
  preferences: UserPreferences;
  progress: UserProgress;
  learningHistory: LearningSession[];
}
```

#### EducationalContent

```typescript
interface EducationalContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  difficulty: LiteracyLevel;
  language: string;
  category: MisinformationCategory;
  metadata: ContentMetadata;
}
```

#### Quiz

```typescript
interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  difficulty: LiteracyLevel;
  category: MisinformationCategory;
  timeLimit?: number;
  passingScore: number;
  metadata: ContentMetadata;
}
```

#### Recommendation

```typescript
interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionItems: string[];
  resources: Resource[];
  priority: number;
  category: MisinformationCategory;
}
```

### Enums

#### LiteracyLevel

```typescript
enum LiteracyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}
```

#### MisinformationCategory

```typescript
enum MisinformationCategory {
  HEALTH = 'health',
  POLITICS = 'politics',
  SCIENCE = 'science',
  TECHNOLOGY = 'technology',
  ECONOMY = 'economy',
  SOCIAL = 'social',
  ENVIRONMENT = 'environment',
  GENERAL = 'general'
}
```

#### ContentType

```typescript
enum ContentType {
  EXPLANATION = 'explanation',
  QUIZ = 'quiz',
  TUTORIAL = 'tutorial',
  RESOURCE = 'resource',
  RECOMMENDATION = 'recommendation'
}
```

#### QuestionType

```typescript
enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SCENARIO = 'scenario',
  DRAG_DROP = 'drag_drop',
  FILL_BLANK = 'fill_blank'
}
```

## Error Handling

The API uses standard JavaScript Error objects with specific error types:

### Common Error Types

- `ValidationError` - Invalid input parameters
- `NotFoundError` - Resource not found
- `ConfigurationError` - Invalid configuration
- `ProcessingError` - Content processing failed
- `TemplateError` - Template rendering failed

### Error Handling Example

```typescript
try {
  const session = await educationalAgent.processVerificationResults(request);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof ProcessingError) {
    console.error('Processing failed:', error.message);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Examples

### Basic Usage

```typescript
import { EducationalAgent } from './EducationalAgent';

const agent = new EducationalAgent();

const session = await agent.processVerificationResults({
  userId: 'user_123',
  verificationResults: [verificationResult],
  contentType: [ContentType.EXPLANATION, ContentType.QUIZ]
});
```

### Advanced Configuration

```typescript
const agent = new EducationalAgent({
  enableGamification: true,
  enablePersonalization: true,
  maxRecommendations: 15,
  sessionTimeout: 60
});
```

### Custom Templates

```typescript
import { TemplateEngine } from './templates/TemplateEngine';

const templateEngine = new TemplateEngine();

templateEngine.registerTemplate('custom_alert', `
  <div class="alert alert-{{type}}">
    <h3>{{title}}</h3>
    <p>{{content}}</p>
  </div>
`);
```

For more examples, see the `/examples` directory in the repository.