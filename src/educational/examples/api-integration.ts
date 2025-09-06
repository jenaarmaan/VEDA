/**
 * API Integration Example for VEDA Educational Content Agent
 * 
 * This example demonstrates how to integrate the Educational Content Agent
 * with REST APIs, webhooks, and external services.
 */

import { EducationalAgent } from '../EducationalAgent';
import {
  VerificationResult,
  UserProfile,
  LiteracyLevel,
  MisinformationCategory,
  ContentType,
  EducationalSession
} from '../types';

// Mock API client for demonstration
class MockAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async post(endpoint: string, data: any): Promise<any> {
    console.log(`📤 POST ${this.baseUrl}${endpoint}`);
    console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    
    // Simulate API response
    return {
      success: true,
      data: { id: `api_${Date.now()}`, ...data },
      timestamp: new Date().toISOString()
    };
  }

  async get(endpoint: string): Promise<any> {
    console.log(`📥 GET ${this.baseUrl}${endpoint}`);
    
    // Simulate API response
    return {
      success: true,
      data: { endpoint, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString()
    };
  }
}

// Webhook handler for real-time updates
class WebhookHandler {
  private educationalAgent: EducationalAgent;
  private apiClient: MockAPIClient;

  constructor(educationalAgent: EducationalAgent, apiClient: MockAPIClient) {
    this.educationalAgent = educationalAgent;
    this.apiClient = apiClient;
  }

  async handleVerificationResult(verificationData: any): Promise<void> {
    console.log('🔔 Webhook: New verification result received');
    
    try {
      // Convert API data to internal format
      const verificationResult: VerificationResult = {
        id: verificationData.id,
        content: verificationData.content,
        verdict: verificationData.verdict,
        confidence: verificationData.confidence,
        evidence: verificationData.evidence || [],
        source: verificationData.source,
        timestamp: new Date(verificationData.timestamp),
        category: verificationData.category
      };

      // Process with educational agent
      const session = await this.educationalAgent.processVerificationResults({
        userId: verificationData.userId,
        verificationResults: [verificationResult],
        contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
      });

      // Send results back to API
      await this.apiClient.post('/educational-content', {
        sessionId: session.id,
        userId: verificationData.userId,
        content: session.content,
        quizzes: session.quizzes,
        recommendations: session.recommendations
      });

      console.log('✅ Webhook processed successfully');
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      await this.apiClient.post('/webhook-errors', {
        error: error.message,
        data: verificationData
      });
    }
  }

  async handleUserProgressUpdate(userId: string, progressData: any): Promise<void> {
    console.log(`🔔 Webhook: User progress update for ${userId}`);
    
    try {
      // Update user profile with new progress data
      const updatedProfile = await this.educationalAgent.getPersonalizedRecommendations(userId);
      
      // Send updated recommendations to API
      await this.apiClient.post('/user-recommendations', {
        userId,
        recommendations: updatedProfile,
        timestamp: new Date().toISOString()
      });

      console.log('✅ User progress updated successfully');
    } catch (error) {
      console.error('❌ User progress update failed:', error);
    }
  }
}

async function apiIntegrationExample() {
  console.log('🚀 VEDA Educational Content Agent - API Integration Example\n');

  // Initialize components
  const educationalAgent = new EducationalAgent({
    enableGamification: true,
    enablePersonalization: true,
    enableAnalytics: true
  });

  const apiClient = new MockAPIClient('https://api.veda-platform.com');
  const webhookHandler = new WebhookHandler(educationalAgent, apiClient);

  console.log('🌐 REST API Integration Example\n');

  // Simulate receiving verification results via API
  const apiVerificationData = {
    id: 'api_verification_001',
    userId: 'api_user_123',
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
    timestamp: new Date().toISOString(),
    category: 'health'
  };

  console.log('📥 Processing verification result from API...');
  await webhookHandler.handleVerificationResult(apiVerificationData);
  console.log('');

  console.log('🔄 Batch API Processing Example\n');

  // Simulate batch processing of multiple verification results
  const batchVerificationData = Array.from({ length: 5 }, (_, i) => ({
    id: `api_batch_${i}`,
    userId: `api_user_${i}`,
    content: `Sample misinformation claim ${i + 1}`,
    verdict: i % 2 === 0 ? 'false' : 'true',
    confidence: 80 + (i * 3),
    evidence: [
      {
        type: 'fact_check',
        description: `Evidence for claim ${i + 1}`,
        reliability: 85 + (i * 2),
        source: `Source ${i + 1}`
      }
    ],
    source: 'api_batch',
    timestamp: new Date().toISOString(),
    category: ['health', 'science', 'technology'][i % 3]
  }));

  console.log(`📦 Processing ${batchVerificationData.length} verification results in batch...`);

  const batchPromises = batchVerificationData.map(data => 
    webhookHandler.handleVerificationResult(data)
  );

  await Promise.all(batchPromises);
  console.log('✅ Batch processing completed\n');

  console.log('👤 User Profile API Integration\n');

  // Simulate user profile management via API
  const userProfileData = {
    id: 'api_user_profile_001',
    literacyLevel: 'intermediate',
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
      streak: 5,
      lastActivity: new Date().toISOString()
    }
  };

  console.log('📊 Fetching user profile from API...');
  const userProfile = await apiClient.get(`/users/${userProfileData.id}`);
  console.log('✅ User profile retrieved\n');

  console.log('🎓 Generating educational content for API user...');
  
  const educationalSession = await educationalAgent.processVerificationResults({
    userId: userProfileData.id,
    verificationResults: [apiVerificationData],
    contentType: [ContentType.EXPLANATION, ContentType.QUIZ, ContentType.RECOMMENDATION]
  });

  // Send educational content to API
  await apiClient.post('/educational-content', {
    sessionId: educationalSession.id,
    userId: userProfileData.id,
    content: educationalSession.content,
    quizzes: educationalSession.quizzes,
    recommendations: educationalSession.recommendations,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  });

  console.log('✅ Educational content sent to API\n');

  console.log('📱 Real-time Updates Example\n');

  // Simulate real-time user interactions
  const realTimeInteractions = [
    {
      type: 'quiz_start',
      userId: userProfileData.id,
      sessionId: educationalSession.id,
      timestamp: new Date().toISOString()
    },
    {
      type: 'question_answer',
      userId: userProfileData.id,
      sessionId: educationalSession.id,
      questionId: 'q1',
      answer: 'false',
      timestamp: new Date().toISOString()
    },
    {
      type: 'quiz_complete',
      userId: userProfileData.id,
      sessionId: educationalSession.id,
      score: 85,
      timestamp: new Date().toISOString()
    }
  ];

  console.log('🔄 Processing real-time interactions...');
  
  for (const interaction of realTimeInteractions) {
    await apiClient.post('/user-interactions', interaction);
    console.log(`   ✅ Processed: ${interaction.type}`);
  }

  console.log('');

  console.log('📊 Analytics API Integration\n');

  // Generate and send analytics data
  const analyticsData = await educationalAgent.getUserProgressAnalytics(userProfileData.id, 'week');
  
  await apiClient.post('/analytics', {
    userId: userProfileData.id,
    period: 'week',
    metrics: analyticsData,
    generatedAt: new Date().toISOString()
  });

  console.log('📈 Analytics data sent to API:');
  console.log(`   - Total Sessions: ${analyticsData.totalSessions}`);
  console.log(`   - Average Score: ${analyticsData.averageScore.toFixed(1)}%`);
  console.log(`   - Time Spent: ${analyticsData.timeSpent} minutes\n`);

  console.log('🔔 Webhook Configuration Example\n');

  // Simulate webhook configuration
  const webhookConfig = {
    endpoints: [
      {
        url: 'https://api.veda-platform.com/webhooks/verification-results',
        events: ['verification.completed', 'verification.updated'],
        secret: 'webhook_secret_key'
      },
      {
        url: 'https://api.veda-platform.com/webhooks/user-progress',
        events: ['user.progress.updated', 'user.badge.earned'],
        secret: 'webhook_secret_key'
      }
    ],
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    }
  };

  await apiClient.post('/webhooks/configure', webhookConfig);
  console.log('✅ Webhook configuration updated\n');

  console.log('🛡️ Error Handling and Resilience Example\n');

  // Simulate API errors and recovery
  const errorScenarios = [
    {
      name: 'Network Timeout',
      error: new Error('Request timeout after 30 seconds'),
      recovery: 'Retry with exponential backoff'
    },
    {
      name: 'Rate Limiting',
      error: new Error('Rate limit exceeded: 429 Too Many Requests'),
      recovery: 'Implement rate limiting and queuing'
    },
    {
      name: 'Invalid Data',
      error: new Error('Invalid verification result format'),
      recovery: 'Validate data before processing'
    }
  ];

  console.log('🚨 Testing error scenarios...');
  
  for (const scenario of errorScenarios) {
    console.log(`   📋 Scenario: ${scenario.name}`);
    console.log(`   ❌ Error: ${scenario.error.message}`);
    console.log(`   🔧 Recovery: ${scenario.recovery}`);
    
    // Simulate error handling
    try {
      throw scenario.error;
    } catch (error) {
      await apiClient.post('/errors', {
        error: error.message,
        scenario: scenario.name,
        recovery: scenario.recovery,
        timestamp: new Date().toISOString()
      });
    }
  }

  console.log('✅ Error handling scenarios completed\n');

  console.log('📦 Content Export and Distribution Example\n');

  // Export content in different formats for API distribution
  const exportFormats = ['html', 'json'];

  for (const format of exportFormats) {
    const exportedContent = educationalAgent.exportContent(educationalSession.id, format as any);
    
    await apiClient.post('/content-export', {
      sessionId: educationalSession.id,
      format,
      content: exportedContent,
      size: exportedContent.length,
      timestamp: new Date().toISOString()
    });

    console.log(`📄 Exported content in ${format.toUpperCase()} format (${exportedContent.length} characters)`);
  }

  console.log('');

  console.log('🔄 Background Processing Example\n');

  // Simulate background processing for large datasets
  const backgroundTasks = [
    {
      id: 'task_001',
      type: 'batch_processing',
      status: 'pending',
      data: { verificationResults: batchVerificationData }
    },
    {
      id: 'task_002',
      type: 'analytics_generation',
      status: 'pending',
      data: { userId: userProfileData.id, period: 'month' }
    },
    {
      id: 'task_003',
      type: 'content_optimization',
      status: 'pending',
      data: { sessionId: educationalSession.id }
    }
  ];

  console.log('⚙️ Processing background tasks...');
  
  for (const task of backgroundTasks) {
    await apiClient.post('/background-tasks', {
      ...task,
      status: 'processing',
      startedAt: new Date().toISOString()
    });
    
    console.log(`   🔄 Processing: ${task.type} (${task.id})`);
    
    // Simulate task completion
    await apiClient.post('/background-tasks/complete', {
      taskId: task.id,
      status: 'completed',
      completedAt: new Date().toISOString()
    });
    
    console.log(`   ✅ Completed: ${task.type} (${task.id})`);
  }

  console.log('');

  console.log('🎉 API Integration Example Completed Successfully!');
  console.log('   The VEDA Educational Content Agent has demonstrated:');
  console.log('   ✓ REST API integration for verification results');
  console.log('   ✓ Webhook handling for real-time updates');
  console.log('   ✓ Batch processing capabilities');
  console.log('   ✓ User profile management via API');
  console.log('   ✓ Real-time interaction tracking');
  console.log('   ✓ Analytics data generation and export');
  console.log('   ✓ Webhook configuration and management');
  console.log('   ✓ Comprehensive error handling and recovery');
  console.log('   ✓ Content export in multiple formats');
  console.log('   ✓ Background task processing');
  console.log('   ✓ Scalable architecture for production use');
}

// Run the example
if (require.main === module) {
  apiIntegrationExample().catch(console.error);
}

export { apiIntegrationExample };