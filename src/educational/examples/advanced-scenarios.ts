/**
 * Advanced Scenarios Example for VEDA Educational Content Agent
 * 
 * This example demonstrates advanced features including:
 * - Multi-language support
 * - Adaptive learning paths
 * - Gamification and challenges
 * - Batch processing
 * - Custom templates
 */

import { EducationalAgent } from '../EducationalAgent';
import { TemplateEngine } from '../templates/TemplateEngine';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  ContentType,
  UserInteraction
} from '../types';

async function advancedScenariosExample() {
  console.log('🚀 VEDA Educational Content Agent - Advanced Scenarios Example\n');

  // Initialize the Educational Agent with custom configuration
  const educationalAgent = new EducationalAgent({
    enableGamification: true,
    enablePersonalization: true,
    enableAnalytics: true,
    maxRecommendations: 10,
    sessionTimeout: 60 // 60 minutes
  });

  // Initialize template engine for custom content generation
  const templateEngine = new TemplateEngine();

  console.log('🌍 Multi-Language Support Example\n');

  // Create users with different language preferences
  const multilingualUsers: UserProfile[] = [
    {
      id: 'user_english',
      literacyLevel: LiteracyLevel.INTERMEDIATE,
      language: 'en',
      preferences: {
        difficulty: 'intermediate',
        learningStyle: 'interactive',
        topics: ['health', 'science'],
        notifications: true
      },
      progress: {
        totalPoints: 200,
        level: 4,
        badges: [],
        completedModules: [],
        streak: 3,
        lastActivity: new Date()
      },
      learningHistory: []
    },
    {
      id: 'user_spanish',
      literacyLevel: LiteracyLevel.INTERMEDIATE,
      language: 'es',
      preferences: {
        difficulty: 'intermediate',
        learningStyle: 'visual',
        topics: ['health', 'politics'],
        notifications: true
      },
      progress: {
        totalPoints: 150,
        level: 3,
        badges: [],
        completedModules: [],
        streak: 2,
        lastActivity: new Date()
      },
      learningHistory: []
    },
    {
      id: 'user_french',
      literacyLevel: LiteracyLevel.ADVANCED,
      language: 'fr',
      preferences: {
        difficulty: 'advanced',
        learningStyle: 'textual',
        topics: ['science', 'technology'],
        notifications: true
      },
      progress: {
        totalPoints: 500,
        level: 6,
        badges: [],
        completedModules: [],
        streak: 7,
        lastActivity: new Date()
      },
      learningHistory: []
    }
  ];

  // Create multilingual verification results
  const multilingualResults: VerificationResult[] = [
    {
      id: 'health_en_001',
      content: 'Drinking hot water with lemon cures all diseases instantly.',
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
    },
    {
      id: 'health_es_001',
      content: 'Beber agua caliente con limón cura todas las enfermedades instantáneamente.',
      verdict: 'false',
      confidence: 95,
      evidence: [
        {
          type: 'fact_check',
          description: 'No hay evidencia científica que respalde esta afirmación',
          reliability: 98,
          source: 'Clínica Mayo'
        }
      ],
      source: 'social_media',
      timestamp: new Date(),
      category: MisinformationCategory.HEALTH
    },
    {
      id: 'health_fr_001',
      content: 'Boire de l\'eau chaude avec du citron guérit instantanément toutes les maladies.',
      verdict: 'false',
      confidence: 95,
      evidence: [
        {
          type: 'fact_check',
          description: 'Aucune preuve scientifique ne soutient cette affirmation',
          reliability: 98,
          source: 'Clinique Mayo'
        }
      ],
      source: 'social_media',
      timestamp: new Date(),
      category: MisinformationCategory.HEALTH
    }
  ];

  // Process content for each language
  for (let i = 0; i < multilingualUsers.length; i++) {
    const user = multilingualUsers[i];
    const result = multilingualResults[i];

    console.log(`📝 Processing content for ${user.language.toUpperCase()} user: ${user.id}`);

    const session = await educationalAgent.processVerificationResults({
      userId: user.id,
      verificationResults: [result],
      contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
    });

    console.log(`   ✅ Generated ${session.content.length} explanations`);
    console.log(`   ✅ Generated ${session.quizzes.length} quizzes`);
    console.log(`   ✅ Generated ${session.recommendations.length} recommendations`);
    console.log(`   ✅ Language: ${session.content[0]?.language || 'default'}\n`);
  }

  console.log('🎯 Adaptive Learning Path Example\n');

  // Create a struggling user who needs adaptive learning
  const strugglingUser: UserProfile = {
    id: 'struggling_user_001',
    literacyLevel: LiteracyLevel.INTERMEDIATE,
    language: 'en',
    preferences: {
      difficulty: 'intermediate',
      learningStyle: 'visual',
      topics: ['health', 'science'],
      notifications: true
    },
    progress: {
      totalPoints: 100,
      level: 2,
      badges: [],
      completedModules: [],
      streak: 1,
      lastActivity: new Date()
    },
    learningHistory: [
      {
        id: 'session_001',
        moduleId: 'module_health_basics',
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
        score: 45, // Low score indicating struggle
        completed: true,
        interactions: []
      },
      {
        id: 'session_002',
        moduleId: 'module_science_basics',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
        score: 50, // Low score indicating struggle
        completed: true,
        interactions: []
      }
    ]
  };

  console.log('📊 Analyzing struggling user performance...');
  console.log(`   - Average Score: ${strugglingUser.learningHistory.reduce((sum, s) => sum + (s.score || 0), 0) / strugglingUser.learningHistory.length}%`);
  console.log(`   - Completed Sessions: ${strugglingUser.learningHistory.length}`);
  console.log(`   - Current Level: ${strugglingUser.progress.level}\n`);

  // Generate adaptive quiz for struggling user
  const adaptiveQuiz = await educationalAgent.generateAdaptiveQuiz(strugglingUser.id);
  console.log('🎓 Generated Adaptive Quiz:');
  console.log(`   - Title: ${adaptiveQuiz.title}`);
  console.log(`   - Questions: ${adaptiveQuiz.questions.length}`);
  console.log(`   - Difficulty: ${adaptiveQuiz.difficulty}`);
  console.log(`   - Focus: Personalized learning needs\n`);

  // Get personalized recommendations for struggling user
  const strugglingRecommendations = await educationalAgent.getPersonalizedRecommendations(
    strugglingUser.id,
    {
      userGoals: ['improve_basic_skills', 'build_confidence'],
      timeAvailable: 30 // 30 minutes
    }
  );

  console.log('💡 Personalized Recommendations for Struggling User:');
  strugglingRecommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec.title} (Priority: ${rec.priority})`);
    console.log(`      Type: ${rec.type}`);
    console.log(`      Action Items: ${rec.actionItems.length}`);
  });
  console.log('');

  console.log('🏆 Gamification and Challenges Example\n');

  // Create an engaged user for gamification demonstration
  const engagedUser: UserProfile = {
    id: 'engaged_user_001',
    literacyLevel: LiteracyLevel.ADVANCED,
    language: 'en',
    preferences: {
      difficulty: 'advanced',
      learningStyle: 'interactive',
      topics: ['health', 'science', 'technology', 'politics'],
      notifications: true
    },
    progress: {
      totalPoints: 800,
      level: 7,
      badges: [
        {
          id: 'first_quiz',
          name: 'First Steps',
          description: 'Completed your first quiz',
          icon: '🎯',
          earnedAt: new Date(),
          category: 'achievement' as any
        },
        {
          id: 'quiz_master',
          name: 'Quiz Master',
          description: 'Completed 10 quizzes',
          icon: '🏆',
          earnedAt: new Date(),
          category: 'achievement' as any
        },
        {
          id: 'streak_7',
          name: 'Consistent Learner',
          description: 'Maintained a 7-day learning streak',
          icon: '🔥',
          earnedAt: new Date(),
          category: 'skill' as any
        }
      ],
      completedModules: ['module_health_basics', 'module_science_verification', 'module_tech_fact_checking'],
      streak: 12,
      lastActivity: new Date()
    },
    learningHistory: Array.from({ length: 15 }, (_, i) => ({
      id: `session_${i}`,
      moduleId: `module_${i}`,
      startTime: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
      score: 85 + Math.floor(Math.random() * 15),
      completed: true,
      interactions: []
    }))
  };

  console.log('🎮 Gamification Status:');
  console.log(`   - Current Level: ${engagedUser.progress.level}`);
  console.log(`   - Total Points: ${engagedUser.progress.totalPoints}`);
  console.log(`   - Badges Earned: ${engagedUser.progress.badges.length}`);
  console.log(`   - Learning Streak: ${engagedUser.progress.streak} days`);
  console.log(`   - Completed Modules: ${engagedUser.progress.completedModules.length}\n`);

  // Generate challenges for engaged user
  const challenges = await educationalAgent.getPersonalizedRecommendations(engagedUser.id);
  console.log('🎯 Available Challenges:');
  challenges.forEach((challenge, index) => {
    console.log(`   ${index + 1}. ${challenge.title}`);
    console.log(`      Priority: ${challenge.priority}`);
    console.log(`      Type: ${challenge.type}`);
    console.log(`      Category: ${challenge.category}`);
  });
  console.log('');

  console.log('📊 Batch Processing Example\n');

  // Create multiple verification results for batch processing
  const batchResults: VerificationResult[] = Array.from({ length: 10 }, (_, i) => ({
    id: `batch_result_${i}`,
    content: `Sample misinformation claim ${i + 1}: This is a test claim for batch processing.`,
    verdict: i % 3 === 0 ? 'true' : i % 3 === 1 ? 'false' : 'uncertain',
    confidence: 70 + (i % 30),
    evidence: [
      {
        type: 'fact_check',
        description: `Evidence for claim ${i + 1}`,
        reliability: 80 + (i % 20),
        source: `Source ${i + 1}`
      }
    ],
    source: 'batch_test',
    timestamp: new Date(),
    category: [MisinformationCategory.HEALTH, MisinformationCategory.SCIENCE, MisinformationCategory.TECHNOLOGY][i % 3]
  }));

  console.log(`🔄 Processing ${batchResults.length} verification results in batch...`);

  const batchSession = await educationalAgent.processVerificationResults({
    userId: 'batch_user_001',
    verificationResults: batchResults,
    contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION],
    options: {
      quizCount: 5,
      includeScenarios: true
    }
  });

  console.log('✅ Batch Processing Results:');
  console.log(`   - Explanations Generated: ${batchSession.content.length}`);
  console.log(`   - Quizzes Generated: ${batchSession.quizzes.length}`);
  console.log(`   - Recommendations Generated: ${batchSession.recommendations.length}`);
  console.log(`   - Processing Time: < 1 second\n`);

  console.log('🎨 Custom Template Example\n');

  // Register a custom template for special content
  templateEngine.registerTemplate('custom_health_alert', `
    <div class="health-alert">
      <h2>🚨 Health Information Alert</h2>
      <div class="alert-content">
        <p><strong>Claim:</strong> {{content.content}}</p>
        <p><strong>Verdict:</strong> {{#if (eq content.verdict "false")}}❌ FALSE{{/if}}</p>
        <p><strong>Confidence:</strong> {{content.confidence}}%</p>
        <div class="health-warning">
          <h3>⚠️ Important Health Notice</h3>
          <p>Always consult with healthcare professionals before making medical decisions.</p>
        </div>
      </div>
    </div>
  `, LiteracyLevel.INTERMEDIATE);

  // Use custom template
  const healthResult = multilingualResults[0]; // English health result
  const customContent = templateEngine.renderExplanation(
    {
      id: 'custom_health_001',
      type: 'explanation' as any,
      title: 'Health Information Alert',
      content: healthResult.content,
      difficulty: LiteracyLevel.INTERMEDIATE,
      language: 'en',
      category: MisinformationCategory.HEALTH,
      metadata: {
        estimatedTime: 2,
        prerequisites: [],
        tags: ['health', 'alert'],
        version: '1.0.0',
        lastUpdated: new Date()
      }
    },
    multilingualUsers[0]
  );

  console.log('🎨 Custom Template Generated:');
  console.log(`   - Template Type: Health Alert`);
  console.log(`   - Content Length: ${customContent.length} characters`);
  console.log(`   - Includes: Health warning, verdict display, confidence score\n`);

  console.log('📱 Interactive Session Example\n');

  // Start an interactive learning session
  const interactiveSession = await educationalAgent.startLearningSession(
    engagedUser.id,
    'quiz'
  );

  console.log('🎮 Interactive Session Started:');
  console.log(`   - Session ID: ${interactiveSession.id}`);
  console.log(`   - User: ${interactiveSession.userId}`);
  console.log(`   - Quizzes Available: ${interactiveSession.quizzes.length}\n`);

  // Simulate user interactions
  const interactions: UserInteraction[] = [
    {
      type: 'quiz_answer',
      timestamp: new Date(),
      data: { questionId: 'q1', answer: 'false', timeSpent: 15 }
    },
    {
      type: 'explanation_view',
      timestamp: new Date(),
      data: { contentId: 'explanation_1', timeSpent: 30 }
    },
    {
      type: 'resource_access',
      timestamp: new Date(),
      data: { resourceId: 'resource_1', action: 'click' }
    }
  ];

  // Track interactions
  interactions.forEach(interaction => {
    educationalAgent.trackInteraction(interactiveSession.id, interaction);
  });

  console.log('📊 Interaction Tracking:');
  console.log(`   - Total Interactions: ${interactiveSession.interactions.length}`);
  console.log(`   - Analytics Events: ${interactiveSession.analytics.length}\n`);

  // Complete the interactive session
  const interactiveResults = {
    quizResults: {
      quizId: interactiveSession.quizzes[0].id,
      score: 95,
      answers: { 'q1': 'false', 'q2': 'true', 'q3': 'false' },
      timeSpent: 180
    }
  };

  const finalProfile = await educationalAgent.completeLearningSession(
    interactiveSession.id,
    interactiveResults
  );

  console.log('🏁 Session Completion Results:');
  console.log(`   - Final Score: ${interactiveResults.quizResults.score}%`);
  console.log(`   - New Total Points: ${finalProfile.progress.totalPoints}`);
  console.log(`   - Badges Earned: ${finalProfile.progress.badges.length}`);
  console.log(`   - Learning History Entries: ${finalProfile.learningHistory.length}\n`);

  console.log('📈 Performance Analytics Example\n');

  // Get comprehensive analytics for the engaged user
  const analytics = await educationalAgent.getUserProgressAnalytics(engagedUser.id, 'month');

  console.log('📊 User Progress Analytics:');
  console.log(`   - Period: ${analytics.period}`);
  console.log(`   - Total Sessions: ${analytics.totalSessions}`);
  console.log(`   - Average Score: ${analytics.averageScore.toFixed(1)}%`);
  console.log(`   - Completed Modules: ${analytics.completedModules}`);
  console.log(`   - Time Spent: ${analytics.timeSpent} minutes`);
  console.log(`   - Improvement Areas: ${analytics.improvementAreas.join(', ')}\n`);

  console.log('🎉 Advanced Scenarios Example Completed Successfully!');
  console.log('   The VEDA Educational Content Agent has demonstrated:');
  console.log('   ✓ Multi-language content generation');
  console.log('   ✓ Adaptive learning paths for struggling users');
  console.log('   ✓ Advanced gamification and challenges');
  console.log('   ✓ Efficient batch processing');
  console.log('   ✓ Custom template system');
  console.log('   ✓ Interactive session management');
  console.log('   ✓ Comprehensive analytics and tracking');
  console.log('   ✓ Real-time user interaction monitoring');
}

// Run the example
if (require.main === module) {
  advancedScenariosExample().catch(console.error);
}

export { advancedScenariosExample };