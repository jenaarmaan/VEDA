/**
 * Conflicting Evidence Demo Script
 * Demonstrates the specific scenario mentioned in the requirements:
 * "A house fire in Mumbai killed five people" vs "Later reports say only three died and two were injured"
 */

import { ContentAnalysisAgent, defaultConfig } from '../src/index';

async function conflictingEvidenceDemo() {
  console.log('=== VEDA Content Analysis Agent - Conflicting Evidence Demo ===\n');

  // Initialize the agent
  const agent = new ContentAnalysisAgent(defaultConfig);

  // The specific conflicting scenario from the requirements
  const conflictingText = `
    A house fire in Mumbai killed five people yesterday evening. 
    The fire started at around 8 PM in a residential building in Andheri. 
    Firefighters arrived within 15 minutes and managed to control the blaze.
    Later reports say only three died and two were injured.
  `;

  console.log('Input Text:');
  console.log(conflictingText);
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    console.log('Analyzing conflicting evidence scenario...');
    const result = await agent.analyzeContent(conflictingText);

    console.log('Analysis Results:');
    console.log(`Total Claims Found: ${result.claims.length}`);
    console.log(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`Processing Time: ${result.processingTime}ms`);
    console.log('\n' + '-'.repeat(60) + '\n');

    // Analyze each claim and its evidence
    result.reports.forEach((report, index) => {
      console.log(`Claim ${index + 1}: "${report.claimText}"`);
      console.log(`Final Verdict: ${report.finalVerdict}`);
      console.log(`Confidence Score: ${(report.confidenceScore * 100).toFixed(1)}%`);
      console.log(`Evidence Sources: ${report.evidence.length}`);
      
      // Show evidence breakdown
      if (report.evidence.length > 0) {
        console.log('\nEvidence Breakdown:');
        report.evidence.forEach((evidence, evIndex) => {
          console.log(`  ${evIndex + 1}. ${evidence.source} (${evidence.sourceType})`);
          console.log(`     Verdict: ${evidence.verdict}`);
          console.log(`     Confidence: ${(evidence.confidenceScore * 100).toFixed(1)}%`);
          console.log(`     Timestamp: ${evidence.timestamp.toISOString()}`);
          if (evidence.summary) {
            console.log(`     Summary: ${evidence.summary}`);
          }
        });
      }

      // Show confidence breakdown
      console.log('\nConfidence Breakdown:');
      report.confidenceBreakdown.breakdown.forEach((breakdown, bIndex) => {
        console.log(`  ${bIndex + 1}. ${breakdown.sourceType}`);
        console.log(`     Weight: ${breakdown.weight}`);
        console.log(`     Score: ${(breakdown.score * 100).toFixed(1)}%`);
        console.log(`     Contribution: ${(breakdown.contribution * 100).toFixed(1)}%`);
      });

      // Show timeline
      if (report.timeline.length > 0) {
        console.log('\nEvidence Timeline (chronological):');
        report.timeline.forEach((evidence, tIndex) => {
          console.log(`  ${tIndex + 1}. ${evidence.timestamp.toISOString()} - ${evidence.source}: ${evidence.verdict}`);
        });
      }

      console.log('\nDetailed Explanation:');
      console.log(report.explanation);
      console.log('\n' + '-'.repeat(60) + '\n');
    });

    // Test the specific requirement: "correctly boosts confidence for the later official update"
    console.log('Testing Confidence Boost for Later Official Updates:');
    
    const officialReports = result.reports.filter(report => 
      report.evidence.some(ev => ev.sourceType === 'OFFICIAL')
    );
    
    const socialMediaReports = result.reports.filter(report => 
      report.evidence.some(ev => ev.sourceType === 'SOCIAL_MEDIA')
    );

    if (officialReports.length > 0 && socialMediaReports.length > 0) {
      const avgOfficialConfidence = officialReports.reduce((sum, report) => 
        sum + report.confidenceScore, 0) / officialReports.length;
      
      const avgSocialConfidence = socialMediaReports.reduce((sum, report) => 
        sum + report.confidenceScore, 0) / socialMediaReports.length;

      console.log(`Average Official Source Confidence: ${(avgOfficialConfidence * 100).toFixed(1)}%`);
      console.log(`Average Social Media Confidence: ${(avgSocialConfidence * 100).toFixed(1)}%`);
      
      if (avgOfficialConfidence > avgSocialConfidence) {
        console.log('✓ SUCCESS: Official sources have higher confidence than social media sources');
      } else {
        console.log('✗ ISSUE: Official sources should have higher confidence');
      }
    }

    // Export the complete analysis
    console.log('\n' + '='.repeat(80));
    console.log('Exporting Complete Analysis...');
    
    const jsonExport = agent.exportResult(result, 'json');
    const textExport = agent.exportResult(result, 'text');

    console.log('\nJSON Export (first 1000 characters):');
    console.log(jsonExport.substring(0, 1000) + '...');

    console.log('\nText Export (first 1000 characters):');
    console.log(textExport.substring(0, 1000) + '...');

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the demo
if (require.main === module) {
  conflictingEvidenceDemo().catch(console.error);
}

export { conflictingEvidenceDemo };