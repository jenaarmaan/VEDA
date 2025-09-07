/**
 * Real Agent Usage Example
 * Demonstrates how to use the orchestration system with your existing agents
 */

import { orchestrationAgent } from '../index';

// Example 1: Basic content verification with your real agents
export async function basicVerificationExample() {
  console.log('🔍 Starting basic verification with your real agents...');
  
  const result = await orchestrationAgent.verifyContent(
    'Scientists at MIT have developed a new AI system that can detect misinformation with 95% accuracy. The system uses advanced machine learning algorithms to analyze content patterns and source credibility.',
    'news_article',
    {
      source: 'mit.edu',
      language: 'en',
      platform: 'news',
      url: 'https://news.mit.edu/2024/ai-misinformation-detection',
      author: 'MIT News Office'
    },
    'high'
  );

  if (result.success && result.report) {
    console.log('✅ Verification completed successfully!');
    console.log('📊 Final Verdict:', result.report.finalVerdict);
    console.log('🎯 Confidence:', Math.round(result.report.confidence * 100) + '%');
    console.log('⏱️ Processing Time:', result.processingTime + 'ms');
    console.log('🤖 Agents Used:', result.report.agentResults.map(r => r.agentName).join(', '));
    console.log('📝 Summary:', result.report.summary);
    console.log('💡 Recommendations:');
    result.report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  } else {
    console.log('❌ Verification failed:', result.error);
  }
}

// Example 2: Social media content verification
export async function socialMediaVerificationExample() {
  console.log('\n📱 Verifying social media content...');
  
  const result = await orchestrationAgent.verifyContent(
    'BREAKING: New study shows vaccines are 100% safe! Share this with everyone! 🚀 #VaccinesWork #Health',
    'social_media_post',
    {
      platform: 'twitter',
      author: '@health_expert',
      language: 'en',
      url: 'https://twitter.com/health_expert/status/1234567890'
    },
    'medium'
  );

  if (result.success && result.report) {
    console.log('✅ Social media verification completed!');
    console.log('📊 Verdict:', result.report.finalVerdict);
    console.log('🎯 Confidence:', Math.round(result.report.confidence * 100) + '%');
    
    // Show which agents were most influential
    const agentResults = result.report.agentResults;
    agentResults.forEach(agent => {
      console.log(`   ${agent.agentName}: ${agent.verdict} (${Math.round(agent.confidence * 100)}%)`);
    });
  }
}

// Example 3: Multilingual content verification
export async function multilingualVerificationExample() {
  console.log('\n🌍 Verifying multilingual content...');
  
  const result = await orchestrationAgent.verifyContent(
    'Los científicos han descubierto un nuevo planeta con potencial para la vida. El planeta está ubicado a 100 años luz de distancia y tiene condiciones atmosféricas similares a la Tierra.',
    'news_article',
    {
      language: 'es',
      source: 'bbc.com',
      platform: 'news',
      url: 'https://www.bbc.com/mundo/noticias-123456'
    },
    'medium'
  );

  if (result.success && result.report) {
    console.log('✅ Multilingual verification completed!');
    console.log('📊 Verdict:', result.report.finalVerdict);
    console.log('🎯 Confidence:', Math.round(result.report.confidence * 100) + '%');
    
    // Check if multilingual agent was used
    const multilingualResult = result.report.agentResults.find(r => r.agentId === 'multilingual');
    if (multilingualResult) {
      console.log('🌐 Multilingual Analysis:', multilingualResult.reasoning);
    }
  }
}

// Example 4: Educational content verification
export async function educationalContentVerificationExample() {
  console.log('\n📚 Verifying educational content...');
  
  const result = await orchestrationAgent.verifyContent(
    'Photosynthesis is the process by which plants convert sunlight into energy. This process occurs in the chloroplasts and produces oxygen as a byproduct. The chemical equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.',
    'educational_content',
    {
      language: 'en',
      tags: ['biology', 'science', 'education'],
      source: 'textbook',
      subjectArea: 'biology'
    },
    'high'
  );

  if (result.success && result.report) {
    console.log('✅ Educational content verification completed!');
    console.log('📊 Verdict:', result.report.finalVerdict);
    console.log('🎯 Confidence:', Math.round(result.report.confidence * 100) + '%');
    
    // Show educational-specific metadata
    const educationalResult = result.report.agentResults.find(r => r.agentId === 'educational-content');
    if (educationalResult && educationalResult.metadata) {
      console.log('📖 Educational Value:', educationalResult.metadata.educationalValue);
      console.log('🔬 Accuracy Score:', educationalResult.metadata.accuracyScore);
    }
  }
}

// Example 5: System monitoring and health check
export async function systemMonitoringExample() {
  console.log('\n📊 System Monitoring...');
  
  // Get system statistics
  const stats = orchestrationAgent.getStats();
  console.log('📈 System Statistics:');
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Success Rate: ${Math.round((stats.successfulRequests / stats.totalRequests) * 100)}%`);
  console.log(`   Average Processing Time: ${Math.round(stats.averageProcessingTime)}ms`);
  console.log(`   System Health: ${stats.systemHealth}`);
  console.log(`   Active Workflows: ${stats.activeWorkflows}`);
  console.log(`   Cache Hit Rate: ${Math.round(stats.cacheHitRate * 100)}%`);

  // Get agent health
  const agentHealth = await orchestrationAgent.getAgentHealth();
  console.log('\n🏥 Agent Health:');
  for (const [agentId, health] of agentHealth) {
    console.log(`   ${agentId}: ${health.status} (${Math.round(health.successRate * 100)}% success)`);
  }

  // Get system health
  const systemHealth = orchestrationAgent.getSystemHealth();
  console.log('\n🔍 System Health:');
  console.log(`   Overall Status: ${systemHealth.overallStatus}`);
  console.log(`   Healthy Agents: ${systemHealth.healthyAgents}/${systemHealth.totalAgents}`);
  console.log(`   Active Alerts: ${systemHealth.activeAlerts}`);
  console.log(`   Average Health Score: ${Math.round(systemHealth.averageHealthScore * 100)}%`);
}

// Example 6: Event monitoring
export async function eventMonitoringExample() {
  console.log('\n📡 Setting up event monitoring...');
  
  // Set up event listeners
  orchestrationAgent.onEvent((event) => {
    switch (event.type) {
      case 'workflow_started':
        console.log('🚀 Workflow started:', event.data.workflowId);
        break;
      case 'workflow_completed':
        console.log('✅ Workflow completed:', event.data.status);
        break;
      case 'agent_response':
        console.log(`🤖 Agent ${event.data.agentId} responded`);
        break;
      case 'error':
        console.log('❌ Error occurred:', event.data.error);
        break;
      case 'health_update':
        console.log('🏥 Health alert:', event.data.alert.message);
        break;
    }
  });

  // Trigger a verification to see events
  const result = await orchestrationAgent.verifyContent(
    'Test content for event monitoring',
    'news_article',
    { source: 'test.com' },
    'medium'
  );

  console.log('Event monitoring example completed');
}

// Example 7: Batch processing
export async function batchProcessingExample() {
  console.log('\n📦 Batch processing example...');
  
  const contents = [
    {
      content: 'The Earth is flat and NASA is lying to us.',
      type: 'social_media_post' as const,
      metadata: { platform: 'twitter', author: '@flat_earth' }
    },
    {
      content: 'COVID-19 vaccines have been thoroughly tested and are safe and effective.',
      type: 'news_article' as const,
      metadata: { source: 'cdc.gov', language: 'en' }
    },
    {
      content: 'Water boils at 100°C at sea level under standard atmospheric pressure.',
      type: 'educational_content' as const,
      metadata: { language: 'en', tags: ['science', 'physics'] }
    }
  ];

  console.log(`Processing ${contents.length} contents in batch...`);
  
  const results = await Promise.allSettled(
    contents.map((item, index) => 
      orchestrationAgent.verifyContent(
        item.content,
        item.type,
        item.metadata,
        'medium'
      ).then(result => ({ index, result }))
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { result: verificationResult } = result.value;
      if (verificationResult.success) {
        console.log(`✅ Content ${index + 1}: ${verificationResult.report?.finalVerdict} (${Math.round(verificationResult.report?.confidence! * 100)}%)`);
      } else {
        console.log(`❌ Content ${index + 1}: Failed - ${verificationResult.error}`);
      }
    } else {
      console.log(`❌ Content ${index + 1}: Error - ${result.reason}`);
    }
  });
}

// Run all examples
export async function runAllRealAgentExamples() {
  console.log('🚀 Running VEDA Orchestration Agent with Real Agents\n');
  
  try {
    await basicVerificationExample();
    await socialMediaVerificationExample();
    await multilingualVerificationExample();
    await educationalContentVerificationExample();
    await systemMonitoringExample();
    await eventMonitoringExample();
    await batchProcessingExample();
    
    console.log('\n✅ All real agent examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
  }
}

// Export individual examples for selective execution
export {
  basicVerificationExample,
  socialMediaVerificationExample,
  multilingualVerificationExample,
  educationalContentVerificationExample,
  systemMonitoringExample,
  eventMonitoringExample,
  batchProcessingExample
};
