// Simple UUID generator without native crypto (timestamp + Math.random)
function generateTaskId(): string {
  const hex = (n: number) => n.toString(16).padStart(4, '0');
  const now = Date.now();
  const rand = Math.floor(Math.random() * 0xffffffff);
  // Build UUID-like string: 8-4-4-4-12
  return (
    hex((now >> 16) & 0xffff) + hex(now & 0xffff) + '-' +
    hex((rand >> 16) & 0xffff) + '-' +
    hex(rand & 0xffff) + '-' +
    hex(Math.floor(Math.random() * 0xffff)) + '-' +
    hex(Math.floor(Math.random() * 0xffff)) + hex(Math.floor(Math.random() * 0xffff)) + hex(Math.floor(Math.random() * 0xffff))
  );
}
import { supabase } from './supabase';
import { TaskExecutionResult, TaskHandlerRegistry } from './taskHandlers';

/**
 * Represents a task that can be scheduled for future execution
 */
export interface ScheduledTask {
  id: string;
  type: 'email' | 'push' | 'orchestration' | 'database_update' | 'custom' | 'individual_email';
  data: any;
  executeAt: Date;
  priority: 'low' | 'normal' | 'high';
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  } | undefined;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  metadata?: Record<string, any> | undefined;
  
  // Personalized messaging support
  send_individual_messages?: boolean;
  per_user_variables?: Array<{
    user_id: string;
    variables: Record<string, any>;
  }> | undefined;
  recipient_count?: number | undefined;
}

/**
 * Input for scheduling a new task (without id, status, createdAt)
 */
export interface ScheduleTaskInput {
  type: ScheduledTask['type'];
  data: any;
  executeAt: Date;
  priority?: ScheduledTask['priority'];
  retryPolicy?: ScheduledTask['retryPolicy'];
  metadata?: Record<string, any>;
  
  // Personalized messaging support
  send_individual_messages?: boolean;
  per_user_variables?: Array<{
    user_id: string;
    variables: Record<string, any>;
  }>;
  recipient_count?: number; // Expected number of recipients for validation
}

/**
 * Response from scheduler operations
 */
export interface SchedulerResponse {
  success: boolean;
  message: string;
  taskId?: string;
  error?: string;
}

/**
 * Database row structure for planned_workflows table
 */
export interface DatabaseTask {
  id: string;
  user_id?: string;
  workflow_type: string;
  workflow_data: any;
  scheduled_for: string; // ISO timestamp
  status: string;
  priority: string;
  created_at: string;
  retry_count?: number | undefined;
  max_retries?: number | undefined;
  backoff_ms?: number | undefined;
  metadata?: any | undefined;
  task_data?: any | undefined; // JSONB field for additional task data including personalized messaging
}

/**
 * Central scheduler for managing all scheduled tasks across the app
 * Phase 1.2: Database integration with smart RAM/DB loading
 * Phase 1.3: Task execution engine with dual timers
 */
export class CentralScheduler {
  private tasks = new Map<string, ScheduledTask>(); // RAM storage for <1 hour tasks
  private isRunning = false;
  private executionTimer: NodeJS.Timeout | null = null; // Check RAM every 10 seconds
  private pollTimer: NodeJS.Timeout | null = null; // Poll DB every 60 minutes
  private readonly ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly RAM_CHECK_INTERVAL = 10 * 1000; // 10 seconds
  private readonly DB_POLL_INTERVAL = 60 * 60 * 1000; // 60 minutes

  constructor() {
    console.log('CentralScheduler: Initialized with database integration');
    this.initializeFromDatabase();
  }

  /**
   * Schedule a new task for future execution
   * Smart storage: <1 hour = RAM + Database, >1 hour = Database only
   */
  async schedule(input: ScheduleTaskInput): Promise<SchedulerResponse> {
    try {
      // Validate input
      const validation = this.validateInput(input);
      if (!validation.success) {
        return validation;
      }

      // Create task with generated ID
      const taskId = generateTaskId();
      const task: ScheduledTask = {
        id: taskId,
        type: input.type,
        data: input.data,
        executeAt: new Date(input.executeAt),
        priority: input.priority || 'normal',
        retryPolicy: input.retryPolicy || undefined,
        status: 'pending',
        createdAt: new Date(),
        metadata: input.metadata || undefined,
        
        // Include personalized messaging data
        send_individual_messages: input.send_individual_messages || false,
        per_user_variables: input.per_user_variables,
        recipient_count: input.recipient_count
      };

      // Save to database (always)
      const dbResult = await this.saveTaskToDatabase(task);
      if (!dbResult.success) {
        return dbResult;
      }

      // Determine if task should be in RAM (executes within 1 hour)
      const timeUntilExecution = task.executeAt.getTime() - Date.now();
      const shouldStoreInRAM = timeUntilExecution <= this.ONE_HOUR_MS;

      if (shouldStoreInRAM) {
        // Store in RAM for fast execution
        this.tasks.set(taskId, task);
        console.log('CentralScheduler: Task scheduled in RAM + Database (executes within 1 hour)', {
          taskId,
          type: task.type,
          executeAt: task.executeAt.toISOString(),
          timeUntilExecution: Math.round(timeUntilExecution / 1000 / 60) + ' minutes'
        });
      } else {
        console.log('CentralScheduler: Task scheduled in Database only (executes in >1 hour)', {
          taskId,
          type: task.type,
          executeAt: task.executeAt.toISOString(),
          timeUntilExecution: Math.round(timeUntilExecution / 1000 / 60 / 60) + ' hours'
        });
      }

      return {
        success: true,
        message: `Task scheduled for ${task.executeAt.toISOString()}`,
        taskId
      };

    } catch (error) {
      console.error('CentralScheduler: Error scheduling task', error);
      return {
        success: false,
        message: 'Failed to schedule task',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a scheduled task (updates both RAM and database)
   */
  async cancel(taskId: string): Promise<SchedulerResponse> {
    try {
      // First check RAM
      let task = this.tasks.get(taskId);
      
      // If not in RAM, check database
      if (!task) {
        const dbTask = await this.getTaskFromDatabase(taskId);
        if (!dbTask) {
          return {
            success: false,
            message: 'Task not found',
            error: `No task found with ID: ${taskId}`
          };
        }
        task = dbTask;
      }

      if (task.status === 'processing') {
        return {
          success: false,
          message: 'Cannot cancel task that is currently processing',
          error: 'Task is in processing state'
        };
      }

      if (task.status === 'completed') {
        return {
          success: false,
          message: 'Cannot cancel task that has already completed',
          error: 'Task already completed'
        };
      }

      // Update task status in database
      const dbResult = await this.updateTaskStatusInDatabase(taskId, 'cancelled');
      if (!dbResult.success) {
        return dbResult;
      }

      // Update in RAM if present
      if (this.tasks.has(taskId)) {
        task.status = 'cancelled';
        this.tasks.set(taskId, task);
      }

      console.log('CentralScheduler: Task cancelled', { taskId });

      return {
        success: true,
        message: 'Task cancelled successfully',
        taskId
      };

    } catch (error) {
      console.error('CentralScheduler: Error cancelling task', error);
      return {
        success: false,
        message: 'Failed to cancel task',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reschedule a task for a new execution time
   */
  async reschedule(taskId: string, newExecuteAt: Date): Promise<SchedulerResponse> {
    try {
      const task = this.tasks.get(taskId);
      
      if (!task) {
        return {
          success: false,
          message: 'Task not found',
          error: `No task found with ID: ${taskId}`
        };
      }

      if (task.status !== 'pending') {
        return {
          success: false,
          message: `Cannot reschedule task with status: ${task.status}`,
          error: 'Only pending tasks can be rescheduled'
        };
      }

      // Update execution time
      const oldExecuteAt = task.executeAt;
      task.executeAt = new Date(newExecuteAt);
      this.tasks.set(taskId, task);

      console.log('CentralScheduler: Task rescheduled', {
        taskId,
        oldExecuteAt: oldExecuteAt.toISOString(),
        newExecuteAt: task.executeAt.toISOString()
      });

      return {
        success: true,
        message: `Task rescheduled for ${task.executeAt.toISOString()}`,
        taskId
      };

    } catch (error) {
      console.error('CentralScheduler: Error rescheduling task', error);
      return {
        success: false,
        message: 'Failed to reschedule task',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the status of a specific task (checks RAM first, then database)
   */
  async getStatus(taskId: string): Promise<ScheduledTask['status'] | null> {
    // Check RAM first
    const ramTask = this.tasks.get(taskId);
    if (ramTask) {
      return ramTask.status;
    }

    // Check database if not in RAM
    const dbTask = await this.getTaskFromDatabase(taskId);
    return dbTask ? dbTask.status : null;
  }

  /**
   * Get a specific task by ID (checks RAM first, then database)
   */
  async getTask(taskId: string): Promise<ScheduledTask | null> {
    // Check RAM first
    const ramTask = this.tasks.get(taskId);
    if (ramTask) {
      return ramTask;
    }

    // Check database if not in RAM
    return await this.getTaskFromDatabase(taskId);
  }

  /**
   * List all pending tasks
   */
  async listPendingTasks(): Promise<ScheduledTask[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (high -> normal -> low) then by executeAt
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.executeAt.getTime() - b.executeAt.getTime();
      });
  }

  /**
   * List all tasks (for debugging/monitoring)
   */
  async listAllTasks(): Promise<ScheduledTask[]> {
    return Array.from(this.tasks.values());
  }

  /**
   * Get summary statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const tasks = Array.from(this.tasks.values());
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };
  }

  /**
   * Clear all completed and cancelled tasks (cleanup)
   */
  async cleanup(): Promise<number> {
    const initialCount = this.tasks.size;
    
    const tasksToRemove: string[] = [];
    this.tasks.forEach((task, taskId) => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        tasksToRemove.push(taskId);
      }
    });
    
    tasksToRemove.forEach(taskId => {
      this.tasks.delete(taskId);
    });
    
    const removedCount = initialCount - this.tasks.size;
    console.log('CentralScheduler: Cleanup completed', { removedCount });
    
    return removedCount;
  }

  /**
   * Initialize scheduler by loading upcoming tasks from database
   */
  private async initializeFromDatabase(): Promise<void> {
    try {
      console.log('CentralScheduler: Loading upcoming tasks from database...');
      await this.loadUpcomingTasksFromDatabase();
      this.startExecutionEngine();
      console.log('CentralScheduler: Initialization complete');
    } catch (error) {
      console.error('CentralScheduler: Failed to initialize from database', error);
    }
  }

  /**
   * Load tasks from database that should execute within the next hour
   */
  private async loadUpcomingTasksFromDatabase(): Promise<void> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + this.ONE_HOUR_MS);

      // First, lookup the UUID for 'pending' status
      const { data: statusData, error: statusError } = await supabase
        .from('status_options')
        .select('id')
        .eq('label', 'pending')
        .single();

      if (statusError || !statusData) {
        console.error('CentralScheduler: Failed to lookup pending status UUID', statusError);
        throw new Error(`Failed to lookup pending status: ${statusError?.message || 'Status not found'}`);
      }

      const pendingStatusId = statusData.id;
      console.log('CentralScheduler: Found pending status UUID', { pendingStatusId });

      // Query database for pending tasks within the next hour using the UUID
      // Include status_options join to get the label back
      const { data, error } = await supabase
        .from('planned_workflows')
        .select(`
          *,
          status_options!inner(label)
        `)
        .eq('status', pendingStatusId)
        .gte('scheduled_for', now.toISOString())
        .lte('scheduled_for', oneHourFromNow.toISOString());

      if (error) {
        throw error;
      }

      // Convert database tasks to ScheduledTask format and load into RAM
      const loadedCount = data?.length || 0;
      data?.forEach(dbTask => {
        const task = this.convertDatabaseTaskToScheduledTask(dbTask);
        this.tasks.set(task.id, task);
      });

      console.log('CentralScheduler: Loaded upcoming tasks into RAM', { loadedCount });
    } catch (error) {
      console.error('CentralScheduler: Error loading upcoming tasks', error);
    }
  }

  /**
   * Helper method to lookup status UUID by label
   */
  private async lookupStatusUuid(statusLabel: string): Promise<string> {
    const { data, error } = await supabase
      .from('status_options')
      .select('id')
      .eq('label', statusLabel)
      .single();

    if (error || !data) {
      throw new Error(`Failed to lookup status UUID for "${statusLabel}": ${error?.message || 'Status not found'}`);
    }

    return data.id;
  }

  /**
   * Helper method to lookup workflow type UUID by label
   */
  private async lookupWorkflowTypeUuid(label: string): Promise<string> {
    // Lookup workflow type (seeded via migration)
    const { data, error } = await supabase
      .from('workflow_type')
      .select('id')
      .eq('label', label);

    if (error) {
      throw new Error(`Failed to lookup workflow type UUID for "${label}": ${error.message}`);
    }

    // If one or more rows were found, use the first one's id
    if (data && data.length > 0) {
      if (data.length > 1) {
        console.warn(`lookupWorkflowTypeUuid: multiple workflow_type rows found for label "${label}" – using first result`);
      }
      return data[0]?.id || '';
    }

    // Not found: ensure workflow_type table is seeded via migration
    throw new Error(`Workflow type label "${label}" not found in lookup table. Seed it via migration.`);
  }

  /**
   * Save a task to the database
   */
  private async saveTaskToDatabase(task: ScheduledTask): Promise<SchedulerResponse> {
    try {
      // Resolve current authenticated user for RLS checks
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }
      const currentUserId = authData?.user?.id;
      if (!currentUserId) {
        throw new Error('No active session. Please sign in to schedule tasks.');
      }

      // Lookup the status UUID
      const statusUuid = await this.lookupStatusUuid(task.status);
      // Lookup workflow type UUID
      const typeUuid = await this.lookupWorkflowTypeUuid(task.type);
      
      const dbTask: Partial<DatabaseTask> = {
        id: task.id,
        user_id: currentUserId, // Required by RLS policy
        workflow_type: typeUuid,
        workflow_data: task.data,
        scheduled_for: task.executeAt.toISOString(),
        status: statusUuid, // Use UUID instead of string
        created_at: task.createdAt.toISOString(),
        max_retries: task.retryPolicy?.maxRetries || undefined,
        backoff_ms: task.retryPolicy?.backoffMs || undefined,
        metadata: task.metadata || undefined,
        
        // Store personalized messaging data in task_data JSONB field
        task_data: task.send_individual_messages || task.per_user_variables || task.recipient_count ? {
          send_individual_messages: task.send_individual_messages,
          per_user_variables: task.per_user_variables,
          recipient_count: task.recipient_count
        } : undefined
      };

      const { error } = await supabase
        .from('planned_workflows')
        .insert(dbTask);

      if (error) {
        throw error;
      }

      return { success: true, message: 'Task saved to database' };
    } catch (error) {
      console.error('CentralScheduler: Error saving task to database', error);
      return {
        success: false,
        message: 'Failed to save task to database',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a task from the database by ID
   */
  private async getTaskFromDatabase(taskId: string): Promise<ScheduledTask | null> {
    try {
      const { data, error } = await supabase
        .from('planned_workflows')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.convertDatabaseTaskToScheduledTask(data);
    } catch (error) {
      console.error('CentralScheduler: Error getting task from database', error);
      return null;
    }
  }

  /**
   * Update task status in the database
   */
  private async updateTaskStatusInDatabase(taskId: string, status: ScheduledTask['status']): Promise<SchedulerResponse> {
    try {
      // Lookup the status UUID
      const statusUuid = await this.lookupStatusUuid(status);
      
      const { error } = await supabase
        .from('planned_workflows')
        .update({ status: statusUuid })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      return { success: true, message: 'Task status updated in database' };
    } catch (error) {
      console.error('CentralScheduler: Error updating task status in database', error);
      return {
        success: false,
        message: 'Failed to update task status in database',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert database task to ScheduledTask format
   */
  private convertDatabaseTaskToScheduledTask(dbTask: any): ScheduledTask {
    // Extract status label from joined status_options table, fallback to direct status if no join
    const statusLabel = dbTask.status_options?.label || dbTask.status;
    
    return {
      id: dbTask.id,
      type: dbTask.workflow_type,
      data: dbTask.workflow_data,
      executeAt: new Date(dbTask.scheduled_for),
      priority: dbTask.priority || 'normal',
      retryPolicy: dbTask.max_retries ? {
        maxRetries: dbTask.max_retries,
        backoffMs: dbTask.backoff_ms || 5000
      } : undefined,
      status: statusLabel as ScheduledTask['status'], // Use the label from join or fallback
      createdAt: new Date(dbTask.created_at),
      metadata: dbTask.metadata || undefined,
      
      // Extract personalized messaging data from task_data JSONB field
      send_individual_messages: dbTask.task_data?.send_individual_messages || false,
      per_user_variables: dbTask.task_data?.per_user_variables,
      recipient_count: dbTask.task_data?.recipient_count
    };
  }

  /**
   * Start the execution engine with dual timers
   */
  private startExecutionEngine(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('CentralScheduler: Starting execution engine');

    // Timer 1: Check RAM every 10 seconds for ready tasks
    this.executionTimer = setInterval(() => {
      this.checkRAMForReadyTasks();
    }, this.RAM_CHECK_INTERVAL);

    // Timer 2: Poll database every 60 minutes for upcoming tasks
    this.pollTimer = setInterval(() => {
      this.refreshFromDatabase();
    }, this.DB_POLL_INTERVAL);

    console.log('CentralScheduler: Execution engine started', {
      ramCheckInterval: this.RAM_CHECK_INTERVAL + 'ms',
      dbPollInterval: this.DB_POLL_INTERVAL + 'ms'
    });
  }

  /**
   * Stop the execution engine
   */
  public stopExecutionEngine(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.executionTimer) {
      clearInterval(this.executionTimer);
      this.executionTimer = null;
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    console.log('CentralScheduler: Execution engine stopped');
  }

  /**
   * Check RAM for tasks that are ready to execute
   */
  private async checkRAMForReadyTasks(): Promise<void> {
    try {
      const now = new Date();
      const readyTasks = Array.from(this.tasks.values())
        .filter(task => task.status === 'pending' && task.executeAt <= now)
        .sort((a, b) => {
          // Sort by priority then by execution time
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.executeAt.getTime() - b.executeAt.getTime();
        });

      if (readyTasks.length > 0) {
        console.log('CentralScheduler: Found ready tasks in RAM', { count: readyTasks.length });

        // Execute each ready task
        for (const task of readyTasks) {
          await this.executeTask(task);
        }
      }
    } catch (error) {
      console.error('CentralScheduler: Error checking RAM for ready tasks', error);
    }
  }

  /**
   * Refresh RAM by loading new upcoming tasks from database
   */
  private async refreshFromDatabase(): Promise<void> {
    try {
      console.log('CentralScheduler: Refreshing RAM from database (hourly poll)');
      
      // Clean up completed/cancelled tasks from RAM
      this.cleanupRAM();
      
      // Load new upcoming tasks
      await this.loadUpcomingTasksFromDatabase();
      
      console.log('CentralScheduler: Database refresh complete', { 
        tasksInRAM: this.tasks.size 
      });
    } catch (error) {
      console.error('CentralScheduler: Error refreshing from database', error);
    }
  }

  /**
   * Clean up completed/cancelled tasks from RAM
   */
  private cleanupRAM(): void {
    let removedCount = 0;
    const tasksToRemove: string[] = [];
    
    this.tasks.forEach((task, taskId) => {
      if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'failed') {
        tasksToRemove.push(taskId);
      }
    });
    
    tasksToRemove.forEach(taskId => {
      this.tasks.delete(taskId);
      removedCount++;
    });
    
    if (removedCount > 0) {
      console.log('CentralScheduler: Cleaned up RAM', { removedCount });
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    try {
      console.log('CentralScheduler: Executing task', { 
        taskId: task.id, 
        type: task.type,
        scheduledFor: task.executeAt.toISOString()
      });

      // Update status to processing
      task.status = 'processing';
      this.tasks.set(task.id, task);
      await this.updateTaskStatusInDatabase(task.id, 'processing');

      // Execute the task using the appropriate handler
      let executionResult: TaskExecutionResult;

      try {
        console.log('CentralScheduler: Executing task via handler', { 
          taskId: task.id, 
          type: task.type, 
          dataKeys: Object.keys(task.data || {})
        });
        
        // Route to appropriate handler through registry
        executionResult = await TaskHandlerRegistry.execute(task.type, task.data);
        
        console.log('CentralScheduler: Handler execution result', { 
          taskId: task.id, 
          success: executionResult.success,
          message: executionResult.message
        });
      } catch (executionError) {
        const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown execution error';
        console.error('CentralScheduler: Task execution failed', { 
          taskId: task.id, 
          error: errorMessage 
        });
        
        executionResult = {
          success: false,
          message: 'Task execution failed',
          error: errorMessage
        };
      }

      // Update final status based on execution result
      const finalStatus = executionResult.success ? 'completed' : 'failed';
      task.status = finalStatus;
      this.tasks.set(task.id, task);
      await this.updateTaskStatusInDatabase(task.id, finalStatus);

      console.log('CentralScheduler: Task execution finished', { 
        taskId: task.id, 
        status: finalStatus,
        handlerMessage: executionResult.message
      });

    } catch (error) {
      console.error('CentralScheduler: Error in task execution lifecycle', error);
      
      // Mark as failed if we can
      try {
        task.status = 'failed';
        this.tasks.set(task.id, task);
        await this.updateTaskStatusInDatabase(task.id, 'failed');
      } catch (updateError) {
        console.error('CentralScheduler: Failed to update task status to failed', updateError);
      }
    }
  }

  /**
   * Get execution engine status
   */
  public getEngineStatus(): {
    isRunning: boolean;
    tasksInRAM: number;
    nextRAMCheck: string;
    nextDBPoll: string;
  } {
    return {
      isRunning: this.isRunning,
      tasksInRAM: this.tasks.size,
      nextRAMCheck: this.isRunning ? 'Every 10 seconds' : 'Stopped',
      nextDBPoll: this.isRunning ? 'Every 60 minutes' : 'Stopped'
    };
  }

  /**
   * Validate task input
   */
  private validateInput(input: ScheduleTaskInput): SchedulerResponse {
    if (!input.type) {
      return {
        success: false,
        message: 'Task type is required',
        error: 'Missing required field: type'
      };
    }

    if (!['email', 'push', 'orchestration', 'database_update', 'custom', 'individual_email'].includes(input.type)) {
      return {
        success: false,
        message: 'Invalid task type',
        error: `Task type must be one of: email, push, orchestration, database_update, custom, individual_email`
      };
    }

    if (!input.executeAt || !(input.executeAt instanceof Date)) {
      return {
        success: false,
        message: 'Valid execution date is required',
        error: 'executeAt must be a valid Date object'
      };
    }

    if (input.executeAt < new Date()) {
      return {
        success: false,
        message: 'Execution date must be in the future',
        error: 'Cannot schedule tasks for the past'
      };
    }

    if (input.priority && !['low', 'normal', 'high'].includes(input.priority)) {
      return {
        success: false,
        message: 'Invalid priority',
        error: 'Priority must be one of: low, normal, high'
      };
    }

    // Validate personalized messaging requirements
    if (input.send_individual_messages) {
      if (!input.per_user_variables || input.per_user_variables.length === 0) {
        return {
          success: false,
          message: 'Personalized messaging requires per_user_variables array',
          error: 'per_user_variables is required when send_individual_messages is true'
        };
      }
      
      // Validate per_user_variables structure
      for (let i = 0; i < input.per_user_variables.length; i++) {
        const userVar = input.per_user_variables[i];
        
        if (!userVar) {
          return {
            success: false,
            message: `Missing entry in per_user_variables[${i}]`,
            error: 'Each per_user_variables entry must be defined'
          };
        }
        
        if (!userVar.user_id || typeof userVar.user_id !== 'string') {
          return {
            success: false,
            message: `Invalid user_id in per_user_variables[${i}]`,
            error: 'Each per_user_variables entry must have a valid string user_id'
          };
        }
        
        if (!userVar.variables || typeof userVar.variables !== 'object' || userVar.variables === null) {
          return {
            success: false,
            message: `Invalid variables in per_user_variables[${i}]`,
            error: 'Each per_user_variables entry must have a variables object'
          };
        }
      }
      
      // Validate recipient count matches (if provided)
      if (input.recipient_count !== undefined && input.per_user_variables.length !== input.recipient_count) {
        return {
          success: false,
          message: `per_user_variables count (${input.per_user_variables.length}) must match recipient_count (${input.recipient_count})`,
          error: 'Recipient count mismatch'
        };
      }
    }

    return { success: true, message: 'Valid input' };
  }
}

// Export singleton instance
export const centralScheduler = new CentralScheduler();