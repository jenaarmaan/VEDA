/**
 * Basic Usage Example for VEDA Content Analysis Agent
 * Demonstrates how to use the agent for misinformation verification
 */

import { ContentAnalysisAgent, defaultConfig } from '../src/index';

async function basicExample() {
  console.log('=== VEDA Content Analysis Agent - Basic Usage Example ===\n');

  // Initialize the agent with default configuration
  const agent = new ContentAnalysisAgent(defaultConfig);

  // Example text with potential misinformation
  const inputText = `
    Breaking news: A house fire in Mumbai killed five people yesterday evening. 
    The fire started at around 8 PM in a residential building in Andheri. 
    Firefighters arrived within 15 minutes and managed to control the blaze.
    Later reports indicate that only three people died and two were injured.
  `;

  console.log('Input Text:');
  console.log(inputText);
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // Analyze the content
    console.log('Analyzing content...');
    const result = await agent.analyzeContent(inputText);

    // Display results
    console.log('Analysis Results:');
    console.log(`Total Claims Found: ${result.claims.length}`);
    console.log(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`Processing Time: ${result.processingTime}ms`);
    console.log('\n' + '-'.repeat(40) + '\n');

    // Display each claim and its analysis
    result.reports.forEach((report, index) => {
      console.log(`Claim ${index + 1}: ${report.claimText}`);
      console.log(`Verdict: ${report.finalVerdict}`);
      console.log(`Confidence: ${(report.confidenceScore * 100).toFixed(1)}%`);
      console.log(`Evidence Sources: ${report.evidence.length}`);
      console.log('\nExplanation:');
      console.log(report.explanation);
      console.log('\n' + '-'.repeat(40) + '\n');
    });

    // Export results
    console.log('Exporting results...');
    const jsonExport = agent.exportResult(result, 'json');
    const textExport = agent.exportResult(result, 'text');

    console.log('\nJSON Export (first 500 characters):');
    console.log(jsonExport.substring(0, 500) + '...');

    console.log('\nText Export (first 500 characters):');
    console.log(textExport.substring(0, 500) + '...');

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

export { basicExample };