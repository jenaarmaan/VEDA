/**
 * VEDA Orchestration Agent - Main Export
 * Central controller for misinformation verification platform
 */

// Core types and interfaces
export * from './types';

// Main orchestration agent
export { OrchestrationAgent, orchestrationAgent } from './OrchestrationAgent';

// Core components
export { RequestRouter } from './components/RequestRouter';
export { WorkflowManager } from './components/WorkflowManager';
export { ResultAggregator } from './components/ResultAggregator';
export { DecisionEngine } from './components/DecisionEngine';
export { ReportUnifier } from './components/ReportUnifier';
export { HealthMonitor } from './components/HealthMonitor';

// Agent registry
export { AgentRegistry, agentRegistry } from './agents';

// Real agent adapters (integrated with your existing agents)
export { ContentAnalysisAgentAdapter } from './agents/adapters/ContentAnalysisAgentAdapter';
export { SourceForensicsAgentAdapter } from './agents/adapters/SourceForensicsAgentAdapter';
export { MultilingualAgentAdapter } from './agents/adapters/MultilingualAgentAdapter';
export { SocialGraphAgentAdapter } from './agents/adapters/SocialGraphAgentAdapter';
export { EducationalContentAgentAdapter } from './agents/adapters/EducationalContentAgentAdapter';

// Example agents (for reference and testing)
export { ContentAnalysisAgent } from './agents/examples/ContentAnalysisAgent';
// Note: Other example agents are available but not exported to avoid conflicts
