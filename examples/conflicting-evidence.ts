/**
 * Conflicting Evidence Example for VEDA Content Analysis Agent
 * Demonstrates how the agent handles conflicting reports and evolving information
 */

import { ContentAnalysisAgent, defaultConfig } from '../src/index';

async function conflictingEvidenceExample() {
  console.log('=== VEDA Content Analysis Agent - Conflicting Evidence Example ===\n');

  // Initialize the agent
  const agent = new ContentAnalysisAgent(defaultConfig);

  // Example scenario: Evolving news story with conflicting reports
  const scenarios = [
    {
      title: 'Scenario 1: Initial Conflicting Reports',
      text: 'A house fire in Mumbai killed five people. Later reports say only three died and two were injured.'
    },
    {
      title: 'Scenario 2: Evolving Information',
      text: 'Breaking: Fire in Mumbai building. Update: 5 casualties confirmed. Latest: Official count is 3 dead, 2 injured.'
    },
    {
      title: 'Scenario 3: Social Media vs Official Sources',
      text: 'Social media reports 10 deaths in Mumbai fire. Official sources confirm only 3 fatalities.'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n${scenario.title}`);
    console.log('='.repeat(60));
    console.log(`Text: ${scenario.text}\n`);

    try {
      const result = await agent.analyzeContent(scenario.text);

      console.log(`Claims Found: ${result.claims.length}`);
      console.log(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);

      // Analyze each report
      result.reports.forEach((report, index) => {
        console.log(`\nReport ${index + 1}:`);
        console.log(`  Claim: ${report.claimText}`);
        console.log(`  Verdict: ${report.finalVerdict}`);
        console.log(`  Confidence: ${(report.confidenceScore * 100).toFixed(1)}%`);
        console.log(`  Evidence Sources: ${report.evidence.length}`);

        // Show evidence breakdown by source type
        const sourceTypes = new Map();
        report.evidence.forEach(ev => {
          sourceTypes.set(ev.sourceType, (sourceTypes.get(ev.sourceType) || 0) + 1);
        });

        console.log('  Source Types:');
        sourceTypes.forEach((count, sourceType) => {
          console.log(`    ${sourceType}: ${count} source(s)`);
        });

        // Show confidence breakdown
        console.log('  Confidence Breakdown:');
        report.confidenceBreakdown.breakdown.forEach(breakdown => {
          console.log(`    ${breakdown.sourceType}: ${(breakdown.contribution * 100).toFixed(1)}% contribution`);
        });

        console.log(`\n  Explanation: ${report.explanation}`);
      });

      // Show timeline analysis
      if (result.reports.length > 0) {
        const timeline = result.reports[0].timeline;
        if (timeline.length > 1) {
          console.log('\n  Timeline Analysis:');
          timeline.forEach((evidence, index) => {
            console.log(`    ${index + 1}. ${evidence.source} (${evidence.timestamp.toISOString()}): ${evidence.verdict}`);
          });
        }
      }

    } catch (error) {
      console.error(`Error analyzing scenario: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(60));
  }
}

// Run the example
if (require.main === module) {
  conflictingEvidenceExample().catch(console.error);
}

export { conflictingEvidenceExample };