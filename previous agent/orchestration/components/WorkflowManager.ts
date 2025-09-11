/**
 * WorkflowManager - Manages agent execution workflows with parallelism and dependencies
 * Handles complex execution patterns, timeouts, retries, and error recovery
 */

import { 
  VerificationRequest,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStatus,
  AgentResponse,
  SpecializedAgent,
  Priority,
  OrchestrationEvent,
  EventCallback
} from '../types';
import { agentRegistry } from '../agents';

export interface ExecutionPlan {
  steps: WorkflowStep[];
  estimatedDuration: number;
  parallelGroups: string[][];
  dependencies: Map<string, string[]>;
}

export class WorkflowManager {
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();
  private eventCallbacks: EventCallback[] = [];
  private defaultTimeout: number = 30000; // 30 seconds
  private maxRetries: number = 3;

  constructor(config?: { defaultTimeout?: number; maxRetries?: number }) {
    if (config?.defaultTimeout) this.defaultTimeout = config.defaultTimeout;
    if (config?.maxRetries) this.maxRetries = config.maxRetries;
  }

  /**
   * Create and execute a workflow for a verification request
   */
  async executeWorkflow(
    request: VerificationRequest,
    selectedAgents: string[],
    executionOrder: string[]
  ): Promise<WorkflowExecution> {
    const workflowId = this.generateWorkflowId();
    
    const execution: WorkflowExecution = {
      id: workflowId,
      requestId: request.id,
      steps: this.createWorkflowSteps(selectedAgents, executionOrder, request.priority),
      status: 'pending',
      startTime: Date.now(),
      results: new Map(),
      errors: new Map()
    };

    this.activeWorkflows.set(workflowId, execution);
    this.emitEvent({
      type: 'workflow_started',
      requestId: request.id,
      timestamp: Date.now(),
      data: { workflowId, selectedAgents }
    });

    try {
      execution.status = 'running';
      await this.executeSteps(execution, request);
      execution.status = 'completed';
      execution.endTime = Date.now();
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.errors.set('workflow', error instanceof Error ? error.message : 'Unknown error');
    }

    this.emitEvent({
      type: 'workflow_completed',
      requestId: request.id,
      timestamp: Date.now(),
      data: { 
        workflowId, 
        status: execution.status,
        duration: execution.endTime! - execution.startTime
      }
    });

    return execution;
  }

  private createWorkflowSteps(
    agentIds: string[],
    executionOrder: string[],
    priority: Priority
  ): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const dependencies = this.calculateDependencies(executionOrder);

    for (const agentId of agentIds) {
      const step: WorkflowStep = {
        id: `${agentId}-${Date.now()}`,
        agentId,
        dependencies: dependencies.get(agentId) || [],
        timeout: this.getTimeoutForPriority(priority),
        retryCount: 0,
        maxRetries: this.maxRetries,
        priority
      };
      steps.push(step);
    }

    return steps;
  }

  private calculateDependencies(executionOrder: string[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();
    
    for (let i = 1; i < executionOrder.length; i++) {
      const currentAgent = executionOrder[i];
      const previousAgents = executionOrder.slice(0, i);
      dependencies.set(currentAgent, previousAgents);
    }

    return dependencies;
  }

  private getTimeoutForPriority(priority: Priority): number {
    const multipliers = {
      'low': 1.5,
      'medium': 1.0,
      'high': 0.7,
      'critical': 0.5
    };
    return Math.ceil(this.defaultTimeout * multipliers[priority]);
  }

  private async executeSteps(
    execution: WorkflowExecution,
    request: VerificationRequest
  ): Promise<void> {
    const executionPlan = this.createExecutionPlan(execution.steps);
    
    // Execute parallel groups sequentially, but steps within each group in parallel
    for (const parallelGroup of executionPlan.parallelGroups) {
      await this.executeParallelGroup(parallelGroup, execution, request);
    }
  }

  private createExecutionPlan(steps: WorkflowStep[]): ExecutionPlan {
    const dependencies = new Map<string, string[]>();
    const parallelGroups: string[][] = [];
    const completed = new Set<string>();
    const remaining = new Set(steps.map(step => step.agentId));

    // Build dependency map
    for (const step of steps) {
      dependencies.set(step.agentId, step.dependencies);
    }

    // Group steps by execution level (parallel execution groups)
    while (remaining.size > 0) {
      const currentGroup: string[] = [];
      
      for (const agentId of remaining) {
        const deps = dependencies.get(agentId) || [];
        if (deps.every(dep => completed.has(dep))) {
          currentGroup.push(agentId);
        }
      }

      if (currentGroup.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }

      parallelGroups.push(currentGroup);
      currentGroup.forEach(agentId => {
        completed.add(agentId);
        remaining.delete(agentId);
      });
    }

    return {
      steps,
      estimatedDuration: this.estimateDuration(steps),
      parallelGroups,
      dependencies
    };
  }

  private async executeParallelGroup(
    agentIds: string[],
    execution: WorkflowExecution,
    request: VerificationRequest
  ): Promise<void> {
    const promises = agentIds.map(agentId => 
      this.executeAgentStep(agentId, execution, request)
    );

    const results = await Promise.allSettled(promises);
    
    // Handle results and errors
    results.forEach((result, index) => {
      const agentId = agentIds[index];
      if (result.status === 'fulfilled') {
        execution.results.set(agentId, result.value);
      } else {
        execution.errors.set(agentId, result.reason);
      }
    });
  }

  private async executeAgentStep(
    agentId: string,
    execution: WorkflowExecution,
    request: VerificationRequest
  ): Promise<AgentResponse> {
    const step = execution.steps.find(s => s.agentId === agentId);
    if (!step) {
      throw new Error(`Step not found for agent: ${agentId}`);
    }

    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= step.maxRetries; attempt++) {
      try {
        step.retryCount = attempt;
        
        const startTime = Date.now();
        const response = await this.executeWithTimeout(
          agent.analyze(request),
          step.timeout
        );
        const processingTime = Date.now() - startTime;

        // Update response with actual processing time
        response.processingTime = processingTime;

        this.emitEvent({
          type: 'agent_response',
          requestId: execution.requestId,
          timestamp: Date.now(),
          data: { agentId, response, attempt }
        });

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < step.maxRetries) {
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error(`Agent ${agentId} failed after ${step.maxRetries} retries`);
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
      })
    ]);
  }

  private estimateDuration(steps: WorkflowStep[]): number {
    // Simple estimation based on agent max processing times
    let totalTime = 0;
    for (const step of steps) {
      const agent = agentRegistry.getAgent(step.agentId);
      if (agent) {
        totalTime += agent.maxProcessingTime;
      }
    }
    return totalTime;
  }

  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get active workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowExecution | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * Get all active workflows
   */
  getAllWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow || workflow.status !== 'running') {
      return false;
    }

    workflow.status = 'cancelled';
    workflow.endTime = Date.now();
    
    this.emitEvent({
      type: 'workflow_completed',
      requestId: workflow.requestId,
      timestamp: Date.now(),
      data: { workflowId, status: 'cancelled' }
    });

    return true;
  }

  /**
   * Clean up completed workflows
   */
  cleanupCompletedWorkflows(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    for (const [workflowId, workflow] of this.activeWorkflows) {
      if (workflow.endTime && (now - workflow.endTime) > maxAge) {
        this.activeWorkflows.delete(workflowId);
      }
    }
  }

  /**
   * Subscribe to workflow events
   */
  onEvent(callback: EventCallback): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Unsubscribe from workflow events
   */
  offEvent(callback: EventCallback): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  private emitEvent(event: OrchestrationEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  /**
   * Get workflow statistics
   */
  getStats(): {
    activeWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    averageExecutionTime: number;
  } {
    const workflows = this.getAllWorkflows();
    const completed = workflows.filter(w => w.status === 'completed');
    const failed = workflows.filter(w => w.status === 'failed');
    
    const totalTime = completed.reduce((sum, w) => 
      sum + (w.endTime! - w.startTime), 0
    );
    
    return {
      activeWorkflows: workflows.filter(w => w.status === 'running').length,
      completedWorkflows: completed.length,
      failedWorkflows: failed.length,
      averageExecutionTime: completed.length > 0 ? totalTime / completed.length : 0
    };
  }
}
