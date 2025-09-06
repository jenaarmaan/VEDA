/**
 * Usage Examples for VEDA Orchestration Agent
 * Demonstrates various ways to use the orchestration system
 */

import { 
  orchestrationAgent, 
  OrchestrationAgent,
  agentRegistry 
} from '../index';
import { ContentAnalysisAgent } from '../agents/examples/ContentAnalysisAgent';
import { SourceForensicsAgent } from '../agents/examples/SourceForensicsAgent';
import { MultilingualAgent } from '../agents/examples/MultilingualAgent';
import { SocialGraphAgent } from '../agents/examples/SocialGraphAgent';
import { EducationalContentAgent } from '../agents/examples/EducationalContentAgent';

// Example 1: Basic Content Verification
export async function basicVerificationExample() {
  console.log('=== Basic Verification Example ===');
  
  const result = await orchestrationAgent.verifyContent(
    'Scientists at MIT have developed a new AI system that can detect misinformation with 95% accuracy.',
    'news_article',
    {
      source: 'mit.edu',
      language: 'en',
      platform: 'news',
      author: 'MIT News Office'
    },
    'high'
  );

  if (result.success && result.report) {
    console.log('✅ Verification successful!');
    console.log('Verdict:', result.report.finalVerdict);
    console.log('Confidence:', Math.round(result.report.confidence * 100) + '%');
    console.log('Summary:', result.report.summary);
    console.log('Processing time:', result.processingTime + 'ms');
  } else {
    console.log('❌ Verification failed:', result.error);
  }
}

// Example 2: Social Media Content Verification
export async function socialMediaVerificationExample() {
  console.log('\n=== Social Media Verification Example ===');
  
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
    console.log('✅ Social media verification complete!');
    console.log('Verdict:', result.report.finalVerdict);
    console.log('Recommendations:');
    result.report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
}

// Example 3: Multilingual Content Verification
export async function multilingualVerificationExample() {
  console.log('\n=== Multilingual Verification Example ===');
  
  const result = await orchestrationAgent.verifyContent(
    'Los científicos han descubierto un nuevo planeta con potencial para la vida. El planeta está ubicado a 100 años luz de distancia.',
    'news_article',
    {
      language: 'es',
      source: 'bbc.com',
      platform: 'news'
    },
    'medium'
  );

  if (result.success && result.report) {
    console.log('✅ Multilingual verification complete!');
    console.log('Verdict:', result.report.finalVerdict);
    console.log('Evidence found:', result.report.evidence.length + ' items');
  }
}

// Example 4: Educational Content Verification
export async function educationalContentVerificationExample() {
  console.log('\n=== Educational Content Verification Example ===');
  
  const result = await orchestrationAgent.verifyContent(
    'Photosynthesis is the process by which plants convert sunlight into energy. This process occurs in the chloroplasts and produces oxygen as a byproduct. The chemical equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.',
    'educational_content',
    {
      language: 'en',
      tags: ['biology', 'science', 'education'],
      source: 'textbook'
    },
    'high'
  );

  if (result.success && result.report) {
    console.log('✅ Educational content verification complete!');
    console.log('Verdict:', result.report.finalVerdict);
    console.log('Detailed analysis:', result.report.detailedAnalysis.substring(0, 200) + '...');
  }
}

// Example 5: Custom Configuration
export async function customConfigurationExample() {
  console.log('\n=== Custom Configuration Example ===');
  
  const customAgent = new OrchestrationAgent({
    defaultTimeout: 45000,
    maxRetries: 5,
    parallelExecution: true,
    cacheEnabled: true,
    cacheTTL: 7200000, // 2 hours
    agentWeights: {
      'content-analysis': 1.0,
      'source-forensics': 1.5, // Higher weight for source verification
      'multilingual': 0.7,
      'social-graph': 1.1,
      'educational-content': 0.9
    },
    confidenceThresholds: {
      high: 0.85,
      medium: 0.65,
      low: 0.45
    }
  });

  const result = await customAgent.verifyContent(
    'Climate change is a hoax perpetrated by scientists to get more funding.',
    'social_media_post',
    {
      platform: 'facebook',
      author: '@climate_skeptic',
      language: 'en'
    },
    'critical'
  );

  if (result.success && result.report) {
    console.log('✅ Custom configuration verification complete!');
    console.log('Verdict:', result.report.finalVerdict);
    console.log('Risk assessment:', result.report.metadata.riskLevel);
  }

  customAgent.destroy();
}

// Example 6: Event Monitoring
export async function eventMonitoringExample() {
  console.log('\n=== Event Monitoring Example ===');
  
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
        console.log('🏥 Health update:', event.data.alert.message);
        break;
    }
  });

  const result = await orchestrationAgent.verifyContent(
    'This is a test content for event monitoring.',
    'news_article',
    { source: 'test.com' },
    'medium'
  );

  console.log('Event monitoring example completed');
}

// Example 7: System Health Monitoring
export async function healthMonitoringExample() {
  console.log('\n=== Health Monitoring Example ===');
  
  // Get system statistics
  const stats = orchestrationAgent.getStats();
  console.log('System Statistics:');
  console.log('  Total requests:', stats.totalRequests);
  console.log('  Success rate:', Math.round((stats.successfulRequests / stats.totalRequests) * 100) + '%');
  console.log('  Average processing time:', Math.round(stats.averageProcessingTime) + 'ms');
  console.log('  System health:', stats.systemHealth);
  console.log('  Active workflows:', stats.activeWorkflows);

  // Get agent health
  const agentHealth = await orchestrationAgent.getAgentHealth();
  console.log('\nAgent Health:');
  for (const [agentId, health] of agentHealth) {
    console.log(`  ${agentId}: ${health.status} (${Math.round(health.successRate * 100)}% success)`);
  }

  // Get health alerts
  const alerts = orchestrationAgent.getAlerts();
  if (alerts.length > 0) {
    console.log('\nActive Alerts:');
    alerts.forEach(alert => {
      console.log(`  ${alert.severity.toUpperCase()}: ${alert.message}`);
    });
  }
}

// Example 8: Batch Processing
export async function batchProcessingExample() {
  console.log('\n=== Batch Processing Example ===');
  
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

  console.log('Processing batch of', contents.length, 'contents...');
  
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
        console.log(`✅ Content ${index + 1}: ${verificationResult.report?.finalVerdict}`);
      } else {
        console.log(`❌ Content ${index + 1}: Failed - ${verificationResult.error}`);
      }
    } else {
      console.log(`❌ Content ${index + 1}: Error - ${result.reason}`);
    }
  });
}

// Example 9: Custom Agent Integration
export async function customAgentIntegrationExample() {
  console.log('\n=== Custom Agent Integration Example ===');
  
  // Register custom agents
  agentRegistry.registerAgent(new ContentAnalysisAgent());
  agentRegistry.registerAgent(new SourceForensicsAgent());
  agentRegistry.registerAgent(new MultilingualAgent());
  agentRegistry.registerAgent(new SocialGraphAgent());
  agentRegistry.registerAgent(new EducationalContentAgent());

  console.log('Registered agents:', agentRegistry.getAllAgents().map(a => a.agentName));

  const result = await orchestrationAgent.verifyContent(
    'This content will be analyzed by all registered agents.',
    'news_article',
    { source: 'example.com' },
    'high'
  );

  if (result.success && result.report) {
    console.log('✅ Custom agent integration successful!');
    console.log('Agents used:', result.report.agentResults.map(r => r.agentName));
  }
}

// Example 10: Error Handling and Recovery
export async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  try {
    // Test with invalid content type
    const result = await orchestrationAgent.verifyContent(
      'Test content',
      'invalid_type' as any,
      {},
      'medium'
    );

    if (!result.success) {
      console.log('❌ Expected failure:', result.error);
    }
  } catch (error) {
    console.log('❌ Caught error:', error);
  }

  // Test with empty content
  try {
    const result = await orchestrationAgent.verifyContent(
      '',
      'news_article',
      {},
      'medium'
    );

    if (!result.success) {
      console.log('❌ Empty content handled:', result.error);
    }
  } catch (error) {
    console.log('❌ Empty content error:', error);
  }
}

// Run all examples
export async function runAllExamples() {
  console.log('🚀 Running VEDA Orchestration Agent Examples\n');
  
  try {
    await basicVerificationExample();
    await socialMediaVerificationExample();
    await multilingualVerificationExample();
    await educationalContentVerificationExample();
    await customConfigurationExample();
    await eventMonitoringExample();
    await healthMonitoringExample();
    await batchProcessingExample();
    await customAgentIntegrationExample();
    await errorHandlingExample();
    
    console.log('\n✅ All examples completed successfully!');
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
  customConfigurationExample,
  eventMonitoringExample,
  healthMonitoringExample,
  batchProcessingExample,
  customAgentIntegrationExample,
  errorHandlingExample
};
