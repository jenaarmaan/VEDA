/**
 * VEDA Educational Content Agent - Main Entry Point
 * 
 * This is the main entry point for the VEDA Educational Content Agent.
 * It exports all the core components and types for external use.
 */

// Core Components
export { EducationalAgent } from './educational/EducationalAgent';
export { ExplanationGenerator } from './educational/ExplanationGenerator';
export { QuizBuilder } from './educational/QuizBuilder';
export { GamificationEngine } from './educational/GamificationEngine';
export { RecommendationEngine } from './educational/RecommendationEngine';
export { TemplateEngine } from './educational/templates/TemplateEngine';

// Types and Interfaces
export * from './educational/types';

// Configuration Types
export type { EducationalAgentConfig } from './educational/EducationalAgent';
export type { GamificationConfig } from './educational/GamificationEngine';
export type { TemplateContext, TemplateOptions } from './educational/templates/TemplateEngine';

// Example Usage
export { basicUsageExample } from './educational/examples/basic-usage';
export { advancedScenariosExample } from './educational/examples/advanced-scenarios';
export { apiIntegrationExample } from './educational/examples/api-integration';

// Version Information
export const VERSION = '1.0.0';
export const DESCRIPTION = 'VEDA Educational Content Agent - Empowering users with knowledge to combat misinformation';

// Main Application Class
export class VEDAEducationalAgent {
  private agent: EducationalAgent;

  constructor(config?: Partial<EducationalAgentConfig>) {
    this.agent = new EducationalAgent(config);
  }

  /**
   * Get the underlying EducationalAgent instance
   */
  getAgent(): EducationalAgent {
    return this.agent;
  }

  /**
   * Initialize the agent with default configuration
   */
  static create(config?: Partial<EducationalAgentConfig>): VEDAEducationalAgent {
    return new VEDAEducationalAgent(config);
  }

  /**
   * Get version information
   */
  static getVersion(): string {
    return VERSION;
  }

  /**
   * Get description
   */
  static getDescription(): string {
    return DESCRIPTION;
  }
}

// Default export
export default VEDAEducationalAgent;