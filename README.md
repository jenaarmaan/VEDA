# VEDA Educational Content Agent

A comprehensive TypeScript implementation of an Educational Content Agent for the VEDA misinformation verification platform. This agent provides users with contextualized learning resources and gamified modules to improve digital literacy and misinformation resilience.

## 🌟 Features

- **Clear Explanations**: Generates plain-language summaries and rationales for verification results
- **Interactive Quizzes**: Converts key facts and errors into multiple-choice and scenario-based questions
- **Gamification**: Manages points, badges, and progression logic to enhance user engagement
- **Personalized Recommendations**: Suggests tailored prevention strategies and resources
- **Adaptive Learning**: Adjusts content complexity based on user literacy levels and language preferences
- **Progress Tracking**: Monitors user progress and dynamically adjusts learning paths
- **Multi-language Support**: Supports multiple languages with fallback mechanisms
- **Template System**: Uses Handlebars for dynamic content generation
- **Analytics Integration**: Comprehensive tracking and analytics for user interactions

## 🏗️ Architecture

The Educational Content Agent is built with a modular architecture consisting of five core components:

### Core Components

1. **ExplanationGenerator** - Produces clear, contextualized explanations for verification results
2. **QuizBuilder** - Converts verification results into interactive quizzes and challenges
3. **GamificationEngine** - Manages points, badges, progression, and user engagement
4. **RecommendationEngine** - Suggests tailored prevention strategies and resources
5. **EducationalAgent** - Main orchestrator that coordinates all components

### Supporting Systems

- **TemplateEngine** - Handlebars-based templating system for dynamic content generation
- **JSON Schema** - Structured data validation for quizzes and resources
- **Analytics System** - User interaction tracking and progress analytics
- **Multi-language Support** - Internationalization and localization capabilities

## 📦 Installation

### Prerequisites

- Node.js 16+ 
- TypeScript 4.5+
- npm or yarn

### Install Dependencies

```bash
npm install handlebars
npm install --save-dev @types/handlebars
npm install --save-dev jest @types/jest ts-jest
```

### Clone and Setup

```bash
git clone <repository-url>
cd veda-educational-agent
npm install
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { EducationalAgent } from './src/educational/EducationalAgent';
import { ContentType, LiteracyLevel, MisinformationCategory } from './src/educational/types';

// Initialize the agent
const educationalAgent = new EducationalAgent({
  enableGamification: true,
  enablePersonalization: true,
  enableAnalytics: true
});

// Create a user profile
const userProfile = {
  id: 'user_123',
  literacyLevel: LiteracyLevel.INTERMEDIATE,
  language: 'en',
  preferences: {
    difficulty: 'intermediate',
    learningStyle: 'interactive',
    topics: ['health', 'science'],
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

// Process verification results
const session = await educationalAgent.processVerificationResults({
  userId: userProfile.id,
  verificationResults: [verificationResult],
  contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
});

// Complete a quiz
const updatedProfile = await educationalAgent.completeLearningSession(session.id, {
  quizResults: {
    quizId: session.quizzes[0].id,
    score: 85,
    answers: { 'q1': 'false' },
    timeSpent: 180
  }
});
```

## 📚 API Reference

### EducationalAgent

The main orchestrator class for the educational content system.

#### Methods

- `processVerificationResults(request)` - Process verification results and generate educational content
- `startLearningSession(userId, sessionType)` - Start a new learning session
- `completeLearningSession(sessionId, results)` - Complete a learning session and update progress
- `getPersonalizedRecommendations(userId, context)` - Get personalized recommendations
- `generateAdaptiveQuiz(userId)` - Generate adaptive quiz based on user's weak areas
- `trackInteraction(sessionId, interaction)` - Track user interactions
- `getUserProgressAnalytics(userId, timeframe)` - Get user progress analytics
- `exportContent(sessionId, format)` - Export content as HTML or JSON
- `getActiveSessions(userId)` - Get active sessions for a user
- `cleanupExpiredSessions()` - Clean up expired sessions

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run All Tests

```bash
npm run test:all
```

### Test Coverage

```bash
npm run test:coverage
```

## 🎯 Usage Examples

### Basic Educational Content Generation

```typescript
import { EducationalAgent } from './src/educational/EducationalAgent';

const agent = new EducationalAgent();

// Process verification results
const session = await agent.processVerificationResults({
  userId: 'user_123',
  verificationResults: [
    {
      id: 'result_1',
      content: 'Drinking hot water with lemon cures all diseases.',
      verdict: 'false',
      confidence: 95,
      evidence: [
        {
          type: 'fact_check',
          description: 'No scientific evidence supports this claim',
          reliability: 98,
          source: 'Mayo Clinic'
        }
      ],
      source: 'social_media',
      timestamp: new Date(),
      category: MisinformationCategory.HEALTH
    }
  ],
  contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
});

console.log(`Generated ${session.content.length} explanations`);
console.log(`Generated ${session.quizzes.length} quizzes`);
console.log(`Generated ${session.recommendations.length} recommendations`);
```

## 🔧 Configuration

### Environment Variables

```bash
# Educational Agent Configuration
EDUCATIONAL_AGENT_ENABLE_GAMIFICATION=true
EDUCATIONAL_AGENT_ENABLE_PERSONALIZATION=true
EDUCATIONAL_AGENT_ENABLE_ANALYTICS=true
EDUCATIONAL_AGENT_DEFAULT_LANGUAGE=en
EDUCATIONAL_AGENT_MAX_RECOMMENDATIONS=10
EDUCATIONAL_AGENT_SESSION_TIMEOUT=30
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY schemas/ ./schemas/
COPY templates/ ./templates/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## 🤝 Contributing

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd veda-educational-agent

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [API Reference](./src/educational/docs/API_REFERENCE.md)
- [Examples](./src/educational/examples/)
- [Schema Documentation](./src/educational/schemas/)

### Getting Help

- Create an issue for bugs or feature requests
- Check existing issues for solutions
- Review the examples for usage patterns
- Consult the API reference for detailed documentation

---

**VEDA Educational Content Agent** - Empowering users with knowledge to combat misinformation through personalized, engaging, and effective educational experiences.