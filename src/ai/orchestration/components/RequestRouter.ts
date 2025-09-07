/**
 * RequestRouter - Determines relevant agents based on input content
 * Analyzes content type and metadata to select the most appropriate agents
 */

import { 
  VerificationRequest, 
  ContentType, 
  SpecializedAgent,
  Priority 
} from '../types';
import { agentRegistry } from '../agents';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for the content classification prompt
const ClassifyContentInputSchema = z.object({
  content: z.string().describe('The user-provided text content to classify.'),
});

const ClassifyContentOutputSchema = z.object({
  contentType: z.enum([
    'news_article',
    'social_media_post',
    'video_content',
    'image_with_text',
    'academic_paper',
    'government_document',
    'educational_content',
    'multimedia_content',
    'unknown',
  ]).describe('The most likely content type based on the input text.'),
  justification: z.string().describe('A brief justification for the chosen content type.'),
});

// Define the Genkit prompt for content classification
const classifyContentPrompt = ai.definePrompt({
    name: 'classifyContentPrompt',
    input: { schema: ClassifyContentInputSchema },
    output: { schema: ClassifyContentOutputSchema },
    prompt: `Analyze the following text and classify its content type.
The primary goal is to determine if it resembles a news article, a social media post, educational material, or other specific formats.
If the type is ambiguous, classify it as 'unknown'.

Content to classify:
"{{{content}}}"

Provide the output in the specified JSON format.`,
});


export interface RoutingDecision {
  selectedAgents: string[];
  executionOrder: string[];
  estimatedTime: number;
  reasoning: string;
}

export class RequestRouter {
  private contentTypeRules: Map<ContentType, string[]> = new Map();
  private priorityMultipliers: Map<Priority, number> = new Map();

  constructor() {
    this.initializeRoutingRules();
  }

  private initializeRoutingRules(): void {
    // Define which agents should be used for each content type
    this.contentTypeRules.set('news_article', [
      'content-analysis',
      'source-forensics',
      'multilingual',
      'social-graph'
    ]);

    this.contentTypeRules.set('social_media_post', [
      'content-analysis',
      'social-graph',
      'source-forensics'
    ]);

    this.contentTypeRules.set('video_content', [
      'content-analysis',
      'source-forensics',
      'educational-content'
    ]);

    this.contentTypeRules.set('image_with_text', [
      'content-analysis',
      'source-forensics',
      'multilingual'
    ]);

    this.contentTypeRules.set('academic_paper', [
      'content-analysis',
      'source-forensics',
      'educational-content'
    ]);

    this.contentTypeRules.set('government_document', [
      'content-analysis',
      'source-forensics'
    ]);

    this.contentTypeRules.set('educational_content', [
      'educational-content',
      'content-analysis',
      'source-forensics'
    ]);

    this.contentTypeRules.set('multimedia_content', [
      'content-analysis',
      'source-forensics',
      'social-graph',
      'educational-content'
    ]);

    this.contentTypeRules.set('unknown', [
      'content-analysis',
      'source-forensics',
      'multilingual',
      'social-graph',
      'educational-content'
    ]);

    // Priority multipliers for execution time estimation
    this.priorityMultipliers.set('low', 1.0);
    this.priorityMultipliers.set('medium', 0.8);
    this.priorityMultipliers.set('high', 0.6);
    this.priorityMultipliers.set('critical', 0.4);
  }
  
  /**
   * Intelligently determine the content type from the request content.
   * If the content type is 'unknown', it uses an AI prompt to classify it.
   */
  private async determineContentType(request: VerificationRequest): Promise<ContentType> {
    if (request.contentType !== 'unknown') {
      return request.contentType;
    }

    try {
      const classification = await classifyContentPrompt({ content: request.content });
      return classification?.contentType || 'unknown';
    } catch (error) {
      console.error("Content classification failed, defaulting to 'unknown'.", error);
      return 'unknown';
    }
  }


  /**
   * Route a verification request to appropriate agents
   */
  async routeRequest(request: VerificationRequest): Promise<RoutingDecision> {
    const determinedContentType = await this.determineContentType(request);
    const metadata = request.metadata;
    
    // Get base agent list for the determined content type
    const baseAgents = this.contentTypeRules.get(determinedContentType) || 
                      this.contentTypeRules.get('unknown')!;

    // Filter agents based on availability and content requirements
    const availableAgents = await this.filterAvailableAgents(baseAgents);
    
    // Apply content-specific routing logic
    const selectedAgents = await this.applyContentSpecificRouting(
      availableAgents, 
      { ...request, contentType: determinedContentType } // Use the determined type
    );

    // Determine execution order based on dependencies and priority
    const executionOrder = this.determineExecutionOrder(selectedAgents, request);

    // Estimate processing time
    const estimatedTime = this.estimateProcessingTime(selectedAgents, request);

    // Generate reasoning for the routing decision
    const reasoning = this.generateRoutingReasoning(
      determinedContentType, 
      selectedAgents, 
      executionOrder,
      metadata
    );

    return {
      selectedAgents,
      executionOrder,
      estimatedTime,
      reasoning
    };
  }

  private async filterAvailableAgents(agentIds: string[]): Promise<string[]> {
    const availableAgents: string[] = [];

    for (const agentId of agentIds) {
      const agent = agentRegistry.getAgent(agentId);
      if (agent && await agent.isAvailable()) {
        availableAgents.push(agentId);
      }
    }

    return availableAgents;
  }

  private async applyContentSpecificRouting(
    baseAgents: string[], 
    request: VerificationRequest
  ): Promise<string[]> {
    const selectedAgents = [...baseAgents];
    const metadata = request.metadata;

    // Add multilingual agent if content is not in English
    if (metadata.language && metadata.language !== 'en') {
      if (!selectedAgents.includes('multilingual')) {
        selectedAgents.push('multilingual');
      }
    }

    // Add social graph agent for social media content
    if (request.contentType === 'social_media_post' || (metadata.platform && ['twitter', 'facebook', 'instagram', 'tiktok'].includes(metadata.platform))) {
      if (!selectedAgents.includes('social-graph')) {
        selectedAgents.push('social-graph');
      }
    }

    // Add educational content agent for educational materials
    if (request.contentType === 'educational_content' || 
        metadata.tags?.some(tag => ['education', 'learning', 'tutorial'].includes(tag.toLowerCase()))) {
      if (!selectedAgents.includes('educational-content')) {
        selectedAgents.push('educational-content');
      }
    }

    // Remove agents that don't support the content type
    const supportedAgents = selectedAgents.filter(agentId => {
      const agent = agentRegistry.getAgent(agentId);
      return agent && agent.supportedContentTypes.includes(request.contentType);
    });

    return [...new Set(supportedAgents)]; // Return unique agent IDs
  }

  private determineExecutionOrder(agentIds: string[], request: VerificationRequest): string[] {
    // Define agent dependencies
    const dependencies: Map<string, string[]> = new Map();
    dependencies.set('source-forensics', ['content-analysis']);
    dependencies.set('social-graph', ['content-analysis']);
    dependencies.set('educational-content', ['content-analysis']);

    // Topological sort to respect dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (agentId: string) => {
      if (visiting.has(agentId)) {
        throw new Error(`Circular dependency detected involving agent: ${agentId}`);
      }
      if (visited.has(agentId)) {
        return;
      }

      visiting.add(agentId);
      
      const deps = dependencies.get(agentId) || [];
      for (const dep of deps) {
        if (agentIds.includes(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(agentId);
      visited.add(agentId);
      order.push(agentId);
    };

    for (const agentId of agentIds) {
      visit(agentId);
    }

    return order;
  }

  private estimateProcessingTime(agentIds: string[], request: VerificationRequest): number {
    let totalTime = 0;
    const priorityMultiplier = this.priorityMultipliers.get(request.priority) || 1.0;

    for (const agentId of agentIds) {
      const agent = agentRegistry.getAgent(agentId);
      if (agent) {
        totalTime += agent.maxProcessingTime;
      }
    }

    // Apply priority multiplier and add overhead
    return Math.ceil(totalTime * priorityMultiplier * 1.2); // 20% overhead
  }

  private generateRoutingReasoning(
    contentType: ContentType,
    selectedAgents: string[],
    executionOrder: string[],
    metadata: any
  ): string {
    const reasons: string[] = [];

    reasons.push(`Content type determined as '${contentType}', requiring specialized analysis`);
    
    if (metadata.language && metadata.language !== 'en') {
      reasons.push(`Non-English content (${metadata.language}) requires multilingual analysis`);
    }

    if (metadata.platform) {
      reasons.push(`Platform-specific analysis needed for ${metadata.platform}`);
    }

    if (selectedAgents.length > 1) {
      reasons.push(`Multi-agent approach selected for comprehensive verification`);
    }

    reasons.push(`Execution order: ${executionOrder.join(' → ')}`);

    return reasons.join('. ');
  }

  /**
   * Get routing statistics for monitoring
   */
  getRoutingStats(): {
    supportedContentTypes: ContentType[];
    availableAgents: string[];
    routingRules: Record<string, string[]>;
  } {
    return {
      supportedContentTypes: Array.from(this.contentTypeRules.keys()),
      availableAgents: agentRegistry.getAllAgents().map(agent => agent.agentId),
      routingRules: Object.fromEntries(this.contentTypeRules)
    };
  }
}
