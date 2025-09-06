/**
 * Example of integrating VEDA Multilingual Agent into a verification pipeline
 */

import { MultilingualAgent, AgentConfig, ProcessingOptions } from '../src';

interface VerificationResult {
  id: string;
  originalText: string;
  detectedLanguage: string;
  translatedText: string;
  normalizedText: string;
  culturalContext: any;
  misinformationFlags: string[];
  processingTime: number;
  confidence: number;
}

class VEDAVerificationPipeline {
  private agent: MultilingualAgent;

  constructor(config: AgentConfig) {
    this.agent = new MultilingualAgent(config);
  }

  async verifyContent(content: string, contentId: string): Promise<VerificationResult> {
    console.log(`\n=== Verifying Content ID: ${contentId} ===`);
    console.log(`Original Text: ${content}`);

    const startTime = Date.now();
    
    // Process the content through the multilingual agent
    const result = await this.agent.processText(content);
    
    const processingTime = Date.now() - startTime;

    // Extract misinformation flags
    const misinformationFlags = this.extractMisinformationFlags(
      result.normalizedText,
      result.contextNotes.commonMisinformationPatterns
    );

    // Calculate overall confidence
    const confidence = this.calculateConfidence(result);

    const verificationResult: VerificationResult = {
      id: contentId,
      originalText: content,
      detectedLanguage: result.detectedLanguage.language,
      translatedText: result.translatedText,
      normalizedText: result.normalizedText,
      culturalContext: result.contextNotes,
      misinformationFlags,
      processingTime,
      confidence
    };

    this.logVerificationResult(verificationResult);
    return verificationResult;
  }

  private extractMisinformationFlags(text: string, patterns: string[]): string[] {
    const flags: string[] = [];
    const lowerText = text.toLowerCase();

    patterns.forEach(pattern => {
      if (lowerText.includes(pattern.toLowerCase())) {
        flags.push(pattern);
      }
    });

    // Additional flag detection logic
    if (lowerText.includes('viral') || lowerText.includes('वायरल') || lowerText.includes('ভাইরাল')) {
      flags.push('VIRAL_CONTENT');
    }

    if (lowerText.includes('urgent') || lowerText.includes('तुरंत') || lowerText.includes('তৎক্ষণাৎ')) {
      flags.push('URGENCY_CLAIM');
    }

    if (lowerText.includes('share') || lowerText.includes('शेयर') || lowerText.includes('শেয়ার')) {
      flags.push('SHARE_REQUEST');
    }

    return flags;
  }

  private calculateConfidence(result: any): number {
    let confidence = result.detectedLanguage.confidence;
    
    // Adjust confidence based on context
    if (result.contextNotes.culturalNotes.length > 0) {
      confidence += 0.1;
    }
    
    if (result.processingMetadata.warnings.length > 0) {
      confidence -= 0.1;
    }
    
    if (result.processingMetadata.errors.length > 0) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private logVerificationResult(result: VerificationResult): void {
    console.log(`\n--- Verification Results ---`);
    console.log(`Detected Language: ${result.detectedLanguage} (${result.confidence.toFixed(2)} confidence)`);
    console.log(`Translated Text: ${result.translatedText}`);
    console.log(`Normalized Text: ${result.normalizedText}`);
    console.log(`Cultural Context: ${result.culturalContext.region}`);
    console.log(`Misinformation Flags: ${result.misinformationFlags.length > 0 ? result.misinformationFlags.join(', ') : 'None'}`);
    console.log(`Processing Time: ${result.processingTime}ms`);
    
    if (result.misinformationFlags.length > 0) {
      console.log(`⚠️  WARNING: Potential misinformation detected!`);
    } else {
      console.log(`✅ No obvious misinformation patterns detected`);
    }
  }

  async verifyBatch(contents: Array<{ id: string; text: string }>): Promise<VerificationResult[]> {
    console.log(`\n=== Batch Verification of ${contents.length} contents ===`);
    
    const results: VerificationResult[] = [];
    
    for (const content of contents) {
      const result = await this.verifyContent(content.text, content.id);
      results.push(result);
    }

    this.logBatchSummary(results);
    return results;
  }

  private logBatchSummary(results: VerificationResult[]): void {
    console.log(`\n=== Batch Verification Summary ===`);
    console.log(`Total Contents: ${results.length}`);
    console.log(`Average Processing Time: ${(results.reduce((sum, r) => sum + r.processingTime, 0) / results.length).toFixed(2)}ms`);
    console.log(`Average Confidence: ${(results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(2)}`);
    
    const languageDistribution = results.reduce((acc, r) => {
      acc[r.detectedLanguage] = (acc[r.detectedLanguage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`Language Distribution:`);
    Object.entries(languageDistribution).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count} (${(count / results.length * 100).toFixed(1)}%)`);
    });
    
    const flaggedContents = results.filter(r => r.misinformationFlags.length > 0);
    console.log(`Contents with Misinformation Flags: ${flaggedContents.length} (${(flaggedContents.length / results.length * 100).toFixed(1)}%)`);
  }
}

async function verificationPipelineExample() {
  console.log('=== VEDA Verification Pipeline Example ===\n');

  // Initialize the verification pipeline
  const config = MultilingualAgent.createDefaultConfig();
  const pipeline = new VEDAVerificationPipeline(config);

  // Example contents to verify
  const contents = [
    {
      id: 'content-001',
      text: 'नमस्ते, आप कैसे हैं? यह एक सामान्य संदेश है।'
    },
    {
      id: 'content-002',
      text: 'अफवाह फैल रही है कि यह वायरल हो रहा है। तुरंत शेयर करें!'
    },
    {
      id: 'content-003',
      text: 'নমস্কার, আপনি কেমন আছেন? এটি একটি সাধারণ বার্তা।'
    },
    {
      id: 'content-004',
      text: 'গুজব ছড়িয়ে পড়ছে যে এটি ভাইরাল হচ্ছে। তৎক্ষণাৎ শেয়ার করুন!'
    },
    {
      id: 'content-005',
      text: 'Hello, this is a normal message in English.'
    },
    {
      id: 'content-006',
      text: 'URGENT: This is going viral! Share immediately!'
    }
  ];

  // Verify each content individually
  console.log('=== Individual Content Verification ===');
  for (const content of contents) {
    await pipeline.verifyContent(content.text, content.id);
  }

  // Verify all contents in batch
  console.log('\n=== Batch Verification ===');
  await pipeline.verifyBatch(contents);
}

// Run the example
if (require.main === module) {
  verificationPipelineExample().catch(console.error);
}

export { VEDAVerificationPipeline, verificationPipelineExample };