/**
 * Batch Processing Example for VEDA Content Analysis Agent
 * Demonstrates how to process multiple texts efficiently
 */

import { ContentAnalysisAgent, defaultConfig } from '../src/index';

async function batchProcessingExample() {
  console.log('=== VEDA Content Analysis Agent - Batch Processing Example ===\n');

  // Initialize the agent
  const agent = new ContentAnalysisAgent(defaultConfig);

  // Sample texts for batch processing
  const texts = [
    'A house fire in Mumbai killed five people yesterday.',
    'The government announced new economic policies today.',
    'Social media reports suggest a major incident occurred.',
    'Official sources confirm the safety of all residents.',
    'Breaking: Multiple casualties reported in the incident.'
  ];

  console.log(`Processing ${texts.length} texts in batch...\n`);

  const results = [];
  const startTime = Date.now();

  try {
    // Process each text
    for (let i = 0; i < texts.length; i++) {
      console.log(`Processing text ${i + 1}/${texts.length}...`);
      const result = await agent.analyzeContent(texts[i]);
      results.push(result);
      
      console.log(`  Claims: ${result.claims.length}, Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`\nBatch processing completed in ${totalTime}ms`);
    console.log(`Average time per text: ${(totalTime / texts.length).toFixed(0)}ms\n`);

    // Aggregate statistics
    const totalClaims = results.reduce((sum, result) => sum + result.claims.length, 0);
    const totalEvidence = results.reduce((sum, result) => 
      sum + result.reports.reduce((reportSum, report) => reportSum + report.evidence.length, 0), 0);
    const averageConfidence = results.reduce((sum, result) => sum + result.overallConfidence, 0) / results.length;

    console.log('Batch Statistics:');
    console.log(`  Total Texts Processed: ${texts.length}`);
    console.log(`  Total Claims Found: ${totalClaims}`);
    console.log(`  Total Evidence Gathered: ${totalEvidence}`);
    console.log(`  Average Confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    console.log(`  Total Processing Time: ${totalTime}ms`);

    // Show detailed results for each text
    console.log('\n' + '='.repeat(60));
    console.log('Detailed Results:');
    console.log('='.repeat(60));

    results.forEach((result, index) => {
      console.log(`\nText ${index + 1}: ${texts[index]}`);
      console.log(`Claims: ${result.claims.length}, Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
      
      if (result.reports.length > 0) {
        console.log('Reports:');
        result.reports.forEach((report, reportIndex) => {
          console.log(`  ${reportIndex + 1}. ${report.claimText}`);
          console.log(`     Verdict: ${report.finalVerdict} (${(report.confidenceScore * 100).toFixed(1)}%)`);
        });
      }
    });

    // Export all results
    console.log('\n' + '-'.repeat(40));
    console.log('Exporting batch results...');
    
    const batchExport = {
      summary: {
        totalTexts: texts.length,
        totalClaims: totalClaims,
        totalEvidence: totalEvidence,
        averageConfidence: averageConfidence,
        totalProcessingTime: totalTime
      },
      results: results.map((result, index) => ({
        textIndex: index,
        inputText: result.inputText,
        claimsCount: result.claims.length,
        overallConfidence: result.overallConfidence,
        processingTime: result.processingTime,
        reports: result.reports.map(report => ({
          claimText: report.claimText,
          finalVerdict: report.finalVerdict,
          confidenceScore: report.confidenceScore,
          evidenceCount: report.evidence.length
        }))
      }))
    };

    console.log('Batch export summary:');
    console.log(JSON.stringify(batchExport.summary, null, 2));

  } catch (error) {
    console.error('Error during batch processing:', error);
  }
}

// Run the example
if (require.main === module) {
  batchProcessingExample().catch(console.error);
}

export { batchProcessingExample };