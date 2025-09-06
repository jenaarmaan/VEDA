/**
 * VEDA Social Graph Agent - Example Usage Scripts
 * 
 * This file provides easy access to all example scripts
 */

export { basicExample } from './basic-usage';
export { advancedExample } from './advanced-usage';
export { RealTimeMonitor, realTimeMonitoringExample } from './real-time-monitoring';

// Example runner function
async function runAllExamples() {
  console.log('🚀 Running all VEDA Social Graph Agent examples...');
  console.log('==================================================');

  try {
    console.log('\n1️⃣ Running Basic Usage Example...');
    const { basicExample } = await import('./basic-usage');
    await basicExample();

    console.log('\n2️⃣ Running Advanced Usage Example...');
    const { advancedExample } = await import('./advanced-usage');
    await advancedExample();

    console.log('\n3️⃣ Running Real-time Monitoring Example...');
    const { realTimeMonitoringExample } = await import('./real-time-monitoring');
    await realTimeMonitoringExample();

    console.log('\n✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}