import { SourceForensicsAgent, DEFAULT_CONFIG } from '../src/index';
import { MediaFile, ForensicsConfig } from '../src/types';

/**
 * Basic usage example for VEDA Source Forensics Agent
 */
async function basicUsageExample() {
  // Initialize the agent with default configuration
  const config: ForensicsConfig = {
    ...DEFAULT_CONFIG,
    // Add your API keys here
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
    tineyeApiKey: process.env.TINEYE_API_KEY,
    tineyeApiId: process.env.TINEYE_API_ID,
  };

  const agent = new SourceForensicsAgent(config);

  // Define a media file to analyze
  const mediaFile: MediaFile = {
    id: 'example-image-1',
    url: 'https://example.com/suspicious-image.jpg',
    type: 'image',
    filename: 'suspicious-image.jpg',
    size: 1024000,
    mimeType: 'image/jpeg',
  };

  try {
    console.log('Starting comprehensive forensics analysis...');
    
    // Perform comprehensive analysis
    const report = await agent.analyzeMedia(mediaFile);
    
    console.log('Analysis completed!');
    console.log('Media ID:', report.mediaId);
    console.log('Authenticity Score:', report.authenticityScore);
    console.log('Risk Level:', report.riskAssessment.level);
    console.log('Manipulation Indicators:', report.metadata.manipulationIndicators.length);
    console.log('Reverse Search Matches:', report.reverseSearch.reduce((sum, r) => sum + r.totalMatches, 0));
    console.log('Timeline Events:', report.timeline.events.length);
    console.log('Chain of Custody Entries:', report.chainOfCustody.entries.length);
    
    // Display risk factors
    if (report.riskAssessment.factors.length > 0) {
      console.log('\nRisk Factors:');
      report.riskAssessment.factors.forEach(factor => {
        console.log(`- ${factor}`);
      });
    }
    
    // Display recommendations
    if (report.riskAssessment.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.riskAssessment.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

/**
 * Quick analysis example for real-time verification
 */
async function quickAnalysisExample() {
  const config: ForensicsConfig = {
    ...DEFAULT_CONFIG,
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  };

  const agent = new SourceForensicsAgent(config);

  const mediaFile: MediaFile = {
    id: 'quick-test-1',
    url: 'https://example.com/quick-test.jpg',
    type: 'image',
    filename: 'quick-test.jpg',
    mimeType: 'image/jpeg',
  };

  try {
    console.log('Performing quick analysis...');
    
    const result = await agent.quickAnalysis(mediaFile);
    
    console.log('Quick Analysis Results:');
    console.log('Authenticity Score:', result.authenticityScore);
    console.log('Risk Level:', result.riskLevel);
    console.log('Key Findings:', result.keyFindings);
    
  } catch (error) {
    console.error('Quick analysis failed:', error);
  }
}

/**
 * Media comparison example
 */
async function mediaComparisonExample() {
  const config: ForensicsConfig = {
    ...DEFAULT_CONFIG,
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  };

  const agent = new SourceForensicsAgent(config);

  const mediaFile1: MediaFile = {
    id: 'comparison-1',
    url: 'https://example.com/image1.jpg',
    type: 'image',
    filename: 'image1.jpg',
    mimeType: 'image/jpeg',
  };

  const mediaFile2: MediaFile = {
    id: 'comparison-2',
    url: 'https://example.com/image2.jpg',
    type: 'image',
    filename: 'image2.jpg',
    mimeType: 'image/jpeg',
  };

  try {
    console.log('Comparing media files...');
    
    const comparison = await agent.compareMedia(mediaFile1, mediaFile2);
    
    console.log('Comparison Results:');
    console.log('Similarity:', comparison.similarity);
    console.log('Exact Match:', comparison.fingerprintComparison.exactMatch);
    console.log('Hash Matches:', comparison.fingerprintComparison.hashMatches);
    console.log('Recommendations:', comparison.recommendations);
    
  } catch (error) {
    console.error('Comparison failed:', error);
  }
}

/**
 * Duplicate detection example
 */
async function duplicateDetectionExample() {
  const config: ForensicsConfig = {
    ...DEFAULT_CONFIG,
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
  };

  const agent = new SourceForensicsAgent(config);

  const mediaFiles: MediaFile[] = [
    {
      id: 'dup-test-1',
      url: 'https://example.com/image1.jpg',
      type: 'image',
      filename: 'image1.jpg',
      mimeType: 'image/jpeg',
    },
    {
      id: 'dup-test-2',
      url: 'https://example.com/image2.jpg',
      type: 'image',
      filename: 'image2.jpg',
      mimeType: 'image/jpeg',
    },
    {
      id: 'dup-test-3',
      url: 'https://example.com/image3.jpg',
      type: 'image',
      filename: 'image3.jpg',
      mimeType: 'image/jpeg',
    },
  ];

  try {
    console.log('Detecting duplicates...');
    
    const result = await agent.detectDuplicates(mediaFiles);
    
    console.log('Duplicate Detection Results:');
    console.log('Duplicates found:', result.duplicates.length);
    console.log('Unique files:', result.uniqueFiles.length);
    
    result.duplicates.forEach((dup, index) => {
      console.log(`\nDuplicate Group ${index + 1}:`);
      console.log('Similarity:', dup.similarity);
      console.log('Type:', dup.type);
      console.log('Files:', dup.files.map(f => f.id));
    });
    
  } catch (error) {
    console.error('Duplicate detection failed:', error);
  }
}

// Run examples
if (require.main === module) {
  console.log('VEDA Source Forensics Agent - Basic Usage Examples\n');
  
  basicUsageExample()
    .then(() => console.log('\n---\n'))
    .then(() => quickAnalysisExample())
    .then(() => console.log('\n---\n'))
    .then(() => mediaComparisonExample())
    .then(() => console.log('\n---\n'))
    .then(() => duplicateDetectionExample())
    .catch(console.error);
}