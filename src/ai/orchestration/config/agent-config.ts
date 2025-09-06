/**
 * Agent Configuration
 * Configuration for connecting to your existing agents
 */

export interface AgentConfig {
  endpoint: string;
  apiKey: string;
  timeout: number;
  retries: number;
}

export const agentConfigs: Record<string, AgentConfig> = {
  'content-analysis': {
    endpoint: process.env.CONTENT_ANALYSIS_AGENT_URL || 'http://localhost:3001/api/content-analysis',
    apiKey: process.env.CONTENT_ANALYSIS_AGENT_API_KEY || 'your-content-analysis-api-key',
    timeout: 15000,
    retries: 3
  },
  'source-forensics': {
    endpoint: process.env.SOURCE_FORENSICS_AGENT_URL || 'http://localhost:3002/api/source-forensics',
    apiKey: process.env.SOURCE_FORENSICS_AGENT_API_KEY || 'your-source-forensics-api-key',
    timeout: 20000,
    retries: 3
  },
  'multilingual': {
    endpoint: process.env.MULTILINGUAL_AGENT_URL || 'http://localhost:3003/api/multilingual',
    apiKey: process.env.MULTILINGUAL_AGENT_API_KEY || 'your-multilingual-api-key',
    timeout: 12000,
    retries: 3
  },
  'social-graph': {
    endpoint: process.env.SOCIAL_GRAPH_AGENT_URL || 'http://localhost:3004/api/social-graph',
    apiKey: process.env.SOCIAL_GRAPH_AGENT_API_KEY || 'your-social-graph-api-key',
    timeout: 18000,
    retries: 3
  },
  'educational-content': {
    endpoint: process.env.EDUCATIONAL_CONTENT_AGENT_URL || 'http://localhost:3005/api/educational-content',
    apiKey: process.env.EDUCATIONAL_CONTENT_AGENT_API_KEY || 'your-educational-content-api-key',
    timeout: 25000,
    retries: 3
  }
};

/**
 * Get configuration for a specific agent
 */
export function getAgentConfig(agentId: string): AgentConfig {
  const config = agentConfigs[agentId];
  if (!config) {
    throw new Error(`Configuration not found for agent: ${agentId}`);
  }
  return config;
}

/**
 * Validate all agent configurations
 */
export function validateAgentConfigs(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [agentId, config] of Object.entries(agentConfigs)) {
    if (!config.endpoint) {
      errors.push(`Missing endpoint for agent: ${agentId}`);
    }
    if (!config.apiKey || config.apiKey === `your-${agentId.replace('-', '-')}-api-key`) {
      errors.push(`Missing or default API key for agent: ${agentId}`);
    }
    if (config.timeout <= 0) {
      errors.push(`Invalid timeout for agent: ${agentId}`);
    }
    if (config.retries < 0) {
      errors.push(`Invalid retries for agent: ${agentId}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Environment variable documentation
 */
export const ENV_VARS_DOCUMENTATION = {
  CONTENT_ANALYSIS_AGENT_URL: 'URL for your Content Analysis Agent API endpoint',
  CONTENT_ANALYSIS_AGENT_API_KEY: 'API key for Content Analysis Agent authentication',
  SOURCE_FORENSICS_AGENT_URL: 'URL for your Source Forensics Agent API endpoint',
  SOURCE_FORENSICS_AGENT_API_KEY: 'API key for Source Forensics Agent authentication',
  MULTILINGUAL_AGENT_URL: 'URL for your Multilingual Agent API endpoint',
  MULTILINGUAL_AGENT_API_KEY: 'API key for Multilingual Agent authentication',
  SOCIAL_GRAPH_AGENT_URL: 'URL for your Social Graph Agent API endpoint',
  SOCIAL_GRAPH_AGENT_API_KEY: 'API key for Social Graph Agent authentication',
  EDUCATIONAL_CONTENT_AGENT_URL: 'URL for your Educational Content Agent API endpoint',
  EDUCATIONAL_CONTENT_AGENT_API_KEY: 'API key for Educational Content Agent authentication'
};
