/**
 * Custom Configuration Example for VEDA Content Analysis Agent
 * Demonstrates how to configure the agent with custom settings
 */

import { ContentAnalysisAgent, APIConfig } from '../src/index';

async function customConfigurationExample() {
  console.log('=== VEDA Content Analysis Agent - Custom Configuration Example ===\n');

  // Custom API configuration
  const customConfig: APIConfig = {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || 'your-gemini-api-key',
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-pro'
    },
    indiaFactCheck: {
      apiKey: process.env.INDIA_FACT_CHECK_API_KEY || 'your-india-fact-check-api-key',
      baseUrl: 'https://api.indiafactcheck.com'
    },
    timeout: 60000, // 60 seconds
    maxRetries: 5
  };

  // Initialize agent with custom configuration
  const agent = new ContentAnalysisAgent(customConfig);

  console.log('Custom Configuration:');
  console.log(`- Timeout: ${customConfig.timeout}ms`);
  console.log(`- Max Retries: ${customConfig.maxRetries}`);
  console.log(`- Gemini Model: ${customConfig.gemini.model}`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Example text for analysis
  const inputText = 'A major earthquake struck the region yesterday, causing significant damage to infrastructure.';

  try {
    // Perform health check
    console.log('Performing health check...');
    const health = await agent.healthCheck();
    console.log('Health Status:');
    Object.entries(health).forEach(([component, status]) => {
      console.log(`  ${component}: ${status ? '✓ Healthy' : '✗ Unhealthy'}`);
    });
    console.log('\n' + '-'.repeat(40) + '\n');

    // Analyze content
    console.log('Analyzing content...');
    const result = await agent.analyzeContent(inputText);

    // Display results
    console.log('Analysis Results:');
    console.log(`Input: ${result.inputText}`);
    console.log(`Claims Found: ${result.claims.length}`);
    console.log(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`Processing Time: ${result.processingTime}ms`);

    // Get analysis statistics
    const stats = agent.getAnalysisStats(result);
    console.log('\nAnalysis Statistics:');
    console.log(`  Total Claims: ${stats.totalClaims}`);
    console.log(`  Total Evidence: ${stats.totalEvidence}`);
    console.log(`  Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`  Processing Time: ${stats.processingTime}ms`);

    console.log('\nVerdict Distribution:');
    Object.entries(stats.verdictDistribution).forEach(([verdict, count]) => {
      console.log(`  ${verdict}: ${count}`);
    });

    console.log('\nSource Type Distribution:');
    Object.entries(stats.sourceTypeDistribution).forEach(([sourceType, count]) => {
      console.log(`  ${sourceType}: ${count}`);
    });

    // Update configuration dynamically
    console.log('\n' + '-'.repeat(40));
    console.log('Updating configuration...');
    agent.updateConfig({
      timeout: 30000, // Reduce timeout to 30 seconds
      maxRetries: 3   // Reduce retries to 3
    });

    const updatedConfig = agent.getConfig();
    console.log('Updated Configuration:');
    console.log(`- Timeout: ${updatedConfig.timeout}ms`);
    console.log(`- Max Retries: ${updatedConfig.maxRetries}`);

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the example
if (require.main === module) {
  customConfigurationExample().catch(console.error);
}

export { customConfigurationExample };