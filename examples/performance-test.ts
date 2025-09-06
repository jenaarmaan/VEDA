/**
 * Performance testing example for VEDA Multilingual Processing Agent
 */

import { MultilingualAgent, AgentConfig } from '../src';

interface PerformanceMetrics {
  totalTexts: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  languageDistribution: Record<string, number>;
  errorCount: number;
}

class PerformanceTester {
  private agent: MultilingualAgent;

  constructor(config: AgentConfig) {
    this.agent = new MultilingualAgent(config);
  }

  async runPerformanceTest(texts: string[], iterations: number = 1): Promise<PerformanceMetrics> {
    console.log(`\n=== Performance Test ===`);
    console.log(`Texts: ${texts.length}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Total Operations: ${texts.length * iterations}\n`);

    const startTime = Date.now();
    const results: Array<{ success: boolean; time: number; language: string; error?: string }> = [];
    const languageDistribution: Record<string, number> = {};

    for (let i = 0; i < iterations; i++) {
      console.log(`Iteration ${i + 1}/${iterations}`);
      
      for (let j = 0; j < texts.length; j++) {
        const text = texts[j];
        const operationStart = Date.now();
        
        try {
          const result = await this.agent.processText(text);
          const operationTime = Date.now() - operationStart;
          
          results.push({
            success: true,
            time: operationTime,
            language: result.detectedLanguage.language
          });
          
          languageDistribution[result.detectedLanguage.language] = 
            (languageDistribution[result.detectedLanguage.language] || 0) + 1;
          
          process.stdout.write('.');
        } catch (error) {
          const operationTime = Date.now() - operationStart;
          results.push({
            success: false,
            time: operationTime,
            language: 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          process.stdout.write('X');
        }
      }
      console.log(''); // New line after each iteration
    }

    const totalTime = Date.now() - startTime;
    const successfulResults = results.filter(r => r.success);
    const errorCount = results.filter(r => !r.success).length;
    
    const metrics: PerformanceMetrics = {
      totalTexts: texts.length * iterations,
      totalTime,
      averageTime: successfulResults.length > 0 ? 
        successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length : 0,
      minTime: successfulResults.length > 0 ? 
        Math.min(...successfulResults.map(r => r.time)) : 0,
      maxTime: successfulResults.length > 0 ? 
        Math.max(...successfulResults.map(r => r.time)) : 0,
      successRate: (successfulResults.length / results.length) * 100,
      languageDistribution,
      errorCount
    };

    this.logPerformanceResults(metrics);
    return metrics;
  }

  private logPerformanceResults(metrics: PerformanceMetrics): void {
    console.log(`\n=== Performance Results ===`);
    console.log(`Total Operations: ${metrics.totalTexts}`);
    console.log(`Total Time: ${metrics.totalTime}ms (${(metrics.totalTime / 1000).toFixed(2)}s)`);
    console.log(`Average Time per Operation: ${metrics.averageTime.toFixed(2)}ms`);
    console.log(`Min Time: ${metrics.minTime}ms`);
    console.log(`Max Time: ${metrics.maxTime}ms`);
    console.log(`Success Rate: ${metrics.successRate.toFixed(2)}%`);
    console.log(`Error Count: ${metrics.errorCount}`);
    
    console.log(`\nLanguage Distribution:`);
    Object.entries(metrics.languageDistribution).forEach(([lang, count]) => {
      const percentage = (count / metrics.totalTexts) * 100;
      console.log(`  ${lang}: ${count} (${percentage.toFixed(1)}%)`);
    });
    
    console.log(`\nThroughput: ${(metrics.totalTexts / (metrics.totalTime / 1000)).toFixed(2)} operations/second`);
  }

  async runBatchPerformanceTest(texts: string[], iterations: number = 1): Promise<PerformanceMetrics> {
    console.log(`\n=== Batch Performance Test ===`);
    console.log(`Texts: ${texts.length}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Total Operations: ${iterations}\n`);

    const startTime = Date.now();
    const results: Array<{ success: boolean; time: number; language: string; error?: string }> = [];
    const languageDistribution: Record<string, number> = {};

    for (let i = 0; i < iterations; i++) {
      console.log(`Iteration ${i + 1}/${iterations}`);
      const operationStart = Date.now();
      
      try {
        const batchResults = await this.agent.processBatch(texts);
        const operationTime = Date.now() - operationStart;
        
        results.push({
          success: true,
          time: operationTime,
          language: 'batch'
        });
        
        batchResults.forEach(result => {
          languageDistribution[result.detectedLanguage.language] = 
            (languageDistribution[result.detectedLanguage.language] || 0) + 1;
        });
        
        process.stdout.write('.');
      } catch (error) {
        const operationTime = Date.now() - operationStart;
        results.push({
          success: false,
          time: operationTime,
          language: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        process.stdout.write('X');
      }
    }

    const totalTime = Date.now() - startTime;
    const successfulResults = results.filter(r => r.success);
    const errorCount = results.filter(r => !r.success).length;
    
    const metrics: PerformanceMetrics = {
      totalTexts: texts.length * iterations,
      totalTime,
      averageTime: successfulResults.length > 0 ? 
        successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length : 0,
      minTime: successfulResults.length > 0 ? 
        Math.min(...successfulResults.map(r => r.time)) : 0,
      maxTime: successfulResults.length > 0 ? 
        Math.max(...successfulResults.map(r => r.time)) : 0,
      successRate: (successfulResults.length / results.length) * 100,
      languageDistribution,
      errorCount
    };

    this.logPerformanceResults(metrics);
    return metrics;
  }

  async runMemoryTest(texts: string[], iterations: number = 100): Promise<void> {
    console.log(`\n=== Memory Test ===`);
    console.log(`Texts: ${texts.length}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Total Operations: ${texts.length * iterations}\n`);

    const initialMemory = process.memoryUsage();
    console.log(`Initial Memory Usage:`);
    console.log(`  RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    for (let i = 0; i < iterations; i++) {
      for (const text of texts) {
        await this.agent.processText(text);
      }
      
      if (i % 10 === 0) {
        const currentMemory = process.memoryUsage();
        console.log(`Iteration ${i}: Heap Used: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      }
    }

    const finalMemory = process.memoryUsage();
    console.log(`\nFinal Memory Usage:`);
    console.log(`  RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    
    console.log(`\nMemory Change:`);
    console.log(`  RSS: ${((finalMemory.rss - initialMemory.rss) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${((finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024).toFixed(2)} MB`);
  }
}

async function performanceTestExample() {
  console.log('=== VEDA Multilingual Agent Performance Test ===\n');

  // Initialize the performance tester
  const config = MultilingualAgent.createDefaultConfig();
  const tester = new PerformanceTester(config);

  // Test texts in different languages
  const testTexts = [
    'नमस्ते, आप कैसे हैं?',
    'নমস্কার, আপনি কেমন আছেন?',
    'నమస్కారం, మీరు ఎలా ఉన్నారు?',
    'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
    'Hello, how are you?',
    'यार, डॉ. शर्मा ने कहा कि यह अफवाह है',
    'গুজব ছড়িয়ে পড়ছে যে এটি ভাইরাল হচ্ছে',
    'పుకారు వ్యాప్తి చెందుతోంది',
    'வதந்தி பரவுகிறது',
    'This is a test message in English'
  ];

  // Run individual performance test
  await tester.runPerformanceTest(testTexts, 3);

  // Run batch performance test
  await tester.runBatchPerformanceTest(testTexts, 3);

  // Run memory test
  await tester.runMemoryTest(testTexts.slice(0, 5), 50);
}

// Run the example
if (require.main === module) {
  performanceTestExample().catch(console.error);
}

export { PerformanceTester, performanceTestExample };