/**
 * Basic Usage Example for VEDA Educational Content Agent
 * 
 * This example demonstrates how to use the Educational Content Agent
 * to process verification results and generate educational content.
 */

import { EducationalAgent } from '../EducationalAgent';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  ContentType
} from '../types';

async function basicUsageExample() {
  console.log('🚀 VEDA Educational Content Agent - Basic Usage Example\n');

  // Initialize the Educational Agent
  const educationalAgent = new EducationalAgent({
    enableGamification: true,
    enablePersonalization: true,
    enableAnalytics: true,
    maxRecommendations: 5
  });

  // Create a sample user profile
  const userProfile: UserProfile = {
    id: 'user_12345',
    literacyLevel: LiteracyLevel.INTERMEDIATE,
    language: 'en',
    preferences: {
      difficulty: 'intermediate',
      learningStyle: 'interactive',
      topics: ['health', 'science'],
      notifications: true
    },
    progress: {
      totalPoints: 150,
      level: 3,
      badges: [],
      completedModules: [],
      streak: 5,
      lastActivity: new Date()
    },
    learningHistory: []
  };

  console.log('👤 User Profile Created:');
  console.log(`   - ID: ${userProfile.id}`);
  console.log(`   - Level: ${userProfile.literacyLevel}`);
  console.log(`   - Current Points: ${userProfile.progress.totalPoints}`);
  console.log(`   - Learning Streak: ${userProfile.progress.streak} days\n`);

  // Create sample verification results
  const verificationResults: VerificationResult[] = [
    {
      id: 'health_claim_001',
      content: 'Drinking hot water with lemon cures all diseases instantly.',
      verdict: 'false',
      confidence: 95,
      evidence: [
        {
          type: 'fact_check',
          description: 'No scientific evidence supports this claim according to medical experts',
          reliability: 98,
          source: 'Mayo Clinic'
        },
        {
          type: 'source_analysis',
          description: 'This claim lacks peer-reviewed scientific backing',
          reliability: 95,
          source: 'PubMed'
        }
      ],
      source: 'social_media',
      timestamp: new Date(),
      category: MisinformationCategory.HEALTH
    },
    {
      id: 'science_claim_001',
      content: 'Climate change is a hoax created by scientists for funding.',
      verdict: 'false',
      confidence: 98,
      evidence: [
        {
          type: 'source_analysis',
          description: 'Overwhelming scientific consensus supports climate change',
          reliability: 99,
          source: 'IPCC Reports'
        }
      ],
      source: 'news_article',
      timestamp: new Date(),
      category: MisinformationCategory.SCIENCE
    }
  ];

  console.log('📊 Verification Results to Process:');
  verificationResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.category.toUpperCase()}: "${result.content.substring(0, 50)}..."`);
    console.log(`      Verdict: ${result.verdict.toUpperCase()} (${result.confidence}% confidence)`);
  });
  console.log('');

  // Process verification results and generate educational content
  console.log('🎓 Generating Educational Content...\n');

  const session = await educationalAgent.processVerificationResults({
    userId: userProfile.id,
    verificationResults,
    contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION],
    options: {
      includeExplanations: true,
      includeQuizzes: true,
      includeRecommendations: true,
      quizCount: 3
    }
  });

  console.log('✅ Educational Session Created:');
  console.log(`   - Session ID: ${session.id}`);
  console.log(`   - Explanations Generated: ${session.content.length}`);
  console.log(`   - Quizzes Generated: ${session.quizzes.length}`);
  console.log(`   - Recommendations Generated: ${session.recommendations.length}\n`);

  // Display generated explanations
  console.log('📝 Generated Explanations:');
  session.content.forEach((explanation, index) => {
    console.log(`   ${index + 1}. ${explanation.title}`);
    console.log(`      Difficulty: ${explanation.difficulty}`);
    console.log(`      Category: ${explanation.category}`);
    console.log(`      Estimated Reading Time: ${explanation.metadata.estimatedTime} minutes`);
  });
  console.log('');

  // Display generated quizzes
  console.log('🧩 Generated Quizzes:');
  session.quizzes.forEach((quiz, index) => {
    console.log(`   ${index + 1}. ${quiz.title}`);
    console.log(`      Questions: ${quiz.questions.length}`);
    console.log(`      Difficulty: ${quiz.difficulty}`);
    console.log(`      Time Limit: ${quiz.timeLimit}s`);
    console.log(`      Passing Score: ${quiz.passingScore}%`);
  });
  console.log('');

  // Display recommendations
  console.log('💡 Generated Recommendations:');
  session.recommendations.forEach((recommendation, index) => {
    console.log(`   ${index + 1}. ${recommendation.title} (Priority: ${recommendation.priority})`);
    console.log(`      Type: ${recommendation.type}`);
    console.log(`      Category: ${recommendation.category}`);
    console.log(`      Action Items: ${recommendation.actionItems.length}`);
  });
  console.log('');

  // Simulate completing a quiz
  console.log('🎯 Simulating Quiz Completion...\n');

  const quizResults = {
    quizResults: {
      quizId: session.quizzes[0].id,
      score: 85,
      answers: {
        'q1': 'false',
        'q2': 'true',
        'q3': 'false'
      },
      timeSpent: 180 // 3 minutes
    }
  };

  const updatedProfile = await educationalAgent.completeLearningSession(session.id, quizResults);

  console.log('🏆 User Progress Updated:');
  console.log(`   - New Total Points: ${updatedProfile.progress.totalPoints}`);
  console.log(`   - Current Level: ${updatedProfile.progress.level}`);
  console.log(`   - Badges Earned: ${updatedProfile.progress.badges.length}`);
  console.log(`   - Completed Modules: ${updatedProfile.progress.completedModules.length}`);
  console.log(`   - Learning Streak: ${updatedProfile.progress.streak} days\n`);

  // Display earned badges
  if (updatedProfile.progress.badges.length > 0) {
    console.log('🎖️  New Badges Earned:');
    updatedProfile.progress.badges.forEach(badge => {
      console.log(`   - ${badge.icon} ${badge.name}: ${badge.description}`);
    });
    console.log('');
  }

  // Get personalized recommendations
  console.log('🎯 Getting Personalized Recommendations...\n');

  const personalizedRecommendations = await educationalAgent.getPersonalizedRecommendations(
    userProfile.id,
    {
      currentEvent: 'health_awareness_month',
      trendingTopics: ['vaccines', 'nutrition'],
      userGoals: ['improve_health_literacy']
    }
  );

  console.log('📋 Personalized Recommendations:');
  personalizedRecommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec.title}`);
    console.log(`      Priority: ${rec.priority}`);
    console.log(`      Type: ${rec.type}`);
    console.log(`      Resources: ${rec.resources.length}`);
  });
  console.log('');

  // Export content as HTML
  console.log('📄 Exporting Content as HTML...\n');

  const htmlContent = educationalAgent.exportContent(session.id, 'html');
  console.log(`✅ HTML content generated (${htmlContent.length} characters)`);
  console.log('   - Ready for frontend rendering');
  console.log('   - Includes interactive quiz elements');
  console.log('   - Responsive design for all devices\n');

  // Get user progress analytics
  console.log('📈 User Progress Analytics:');

  const analytics = await educationalAgent.getUserProgressAnalytics(userProfile.id, 'month');
  console.log(`   - Total Sessions: ${analytics.totalSessions}`);
  console.log(`   - Average Score: ${analytics.averageScore.toFixed(1)}%`);
  console.log(`   - Completed Modules: ${analytics.completedModules}`);
  console.log(`   - Time Spent: ${analytics.timeSpent} minutes`);
  console.log(`   - Improvement Areas: ${analytics.improvementAreas.join(', ')}\n`);

  console.log('🎉 Basic Usage Example Completed Successfully!');
  console.log('   The VEDA Educational Content Agent has successfully:');
  console.log('   ✓ Processed verification results');
  console.log('   ✓ Generated personalized educational content');
  console.log('   ✓ Created interactive quizzes');
  console.log('   ✓ Provided tailored recommendations');
  console.log('   ✓ Tracked user progress and gamification');
  console.log('   ✓ Exported content for frontend integration');
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };