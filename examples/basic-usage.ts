/**
 * Basic usage example for VEDA Multilingual Processing Agent
 */

import { MultilingualAgent, AgentConfig } from '../src';

async function basicUsageExample() {
  console.log('=== VEDA Multilingual Processing Agent - Basic Usage ===\n');

  // Create default configuration
  const config: AgentConfig = MultilingualAgent.createDefaultConfig();
  
  // Initialize the agent
  const agent = new MultilingualAgent(config);

  // Example texts in different Indian languages
  const texts = [
    'नमस्ते, आप कैसे हैं?', // Hindi
    'নমস্কার, আপনি কেমন আছেন?', // Bengali
    'నమస్కారం, మీరు ఎలా ఉన్నారు?', // Telugu
    'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?', // Tamil
    'Hello, how are you?' // English
  ];

  console.log('Processing texts in different languages:\n');

  for (const text of texts) {
    console.log(`Input: ${text}`);
    
    try {
      const result = await agent.processText(text);
      
      console.log(`Detected Language: ${result.detectedLanguage.language} (${result.detectedLanguage.script})`);
      console.log(`Confidence: ${result.detectedLanguage.confidence.toFixed(2)}`);
      console.log(`Translated: ${result.translatedText}`);
      console.log(`Normalized: ${result.normalizedText}`);
      console.log(`Region: ${result.contextNotes.region}`);
      console.log(`Cultural Notes: ${result.contextNotes.culturalNotes.slice(0, 2).join(', ')}`);
      console.log(`Processing Time: ${result.processingMetadata.processingTime}ms`);
      console.log(`Components Used: ${result.processingMetadata.componentsUsed.join(', ')}`);
      console.log('---\n');
    } catch (error) {
      console.error(`Error processing text: ${error}`);
    }
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };