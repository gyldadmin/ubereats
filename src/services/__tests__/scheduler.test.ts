import { CentralScheduler, ScheduleTaskInput } from '../scheduler';

describe('CentralScheduler', () => {
  let scheduler: CentralScheduler;

  beforeEach(() => {
    scheduler = new CentralScheduler();
  });

  afterEach(() => {
    // Stop the execution engine to clean up background timers
    scheduler.stopExecutionEngine();
  });

  describe('schedule', () => {
    it('should schedule a task successfully', async () => {
      const input: ScheduleTaskInput = {
        type: 'email',
        data: { to: 'test@example.com', subject: 'Test' },
        executeAt: new Date(Date.now() + 60000), // 1 minute from now
        priority: 'normal'
      };

      const result = await scheduler.schedule(input);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.message).toContain('Task scheduled');
    });

    it('should reject tasks with invalid type', async () => {
      const input: ScheduleTaskInput = {
        type: 'invalid' as any,
        data: {},
        executeAt: new Date(Date.now() + 60000)
      };

      const result = await scheduler.schedule(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task type must be one of');
    });

    it('should reject tasks scheduled for the past', async () => {
      const input: ScheduleTaskInput = {
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() - 60000) // 1 minute ago
      };

      const result = await scheduler.schedule(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot schedule tasks for the past');
    });

    it('should set default priority to normal', async () => {
      const input: ScheduleTaskInput = {
        type: 'push',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      };

      const result = await scheduler.schedule(input);
      expect(result.success).toBe(true);

      const task = await scheduler.getTask(result.taskId!);
      expect(task?.priority).toBe('normal');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending task', async () => {
      // Schedule a task
      const scheduleResult = await scheduler.schedule({
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      // Cancel it
      const cancelResult = await scheduler.cancel(scheduleResult.taskId!);

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.message).toContain('cancelled successfully');

      // Check status
      const status = await scheduler.getStatus(scheduleResult.taskId!);
      expect(status).toBe('cancelled');
    });

    it('should reject cancelling non-existent task', async () => {
      const result = await scheduler.cancel('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No task found');
    });
  });

  describe('reschedule', () => {
    it('should reschedule a pending task', async () => {
      // Schedule a task
      const scheduleResult = await scheduler.schedule({
        type: 'push',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      const newExecuteAt = new Date(Date.now() + 120000); // 2 minutes from now

      // Reschedule it
      const rescheduleResult = await scheduler.reschedule(scheduleResult.taskId!, newExecuteAt);

      expect(rescheduleResult.success).toBe(true);

      // Check new execution time
      const task = await scheduler.getTask(scheduleResult.taskId!);
      expect(task?.executeAt.getTime()).toBe(newExecuteAt.getTime());
    });

    it('should reject rescheduling non-existent task', async () => {
      const result = await scheduler.reschedule('non-existent-id', new Date());

      expect(result.success).toBe(false);
      expect(result.error).toContain('No task found');
    });
  });

  describe('getStatus', () => {
    it('should return task status', async () => {
      const scheduleResult = await scheduler.schedule({
        type: 'orchestration',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      const status = await scheduler.getStatus(scheduleResult.taskId!);
      expect(status).toBe('pending');
    });

    it('should return null for non-existent task', async () => {
      const status = await scheduler.getStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('listPendingTasks', () => {
    it('should list tasks in priority order', async () => {
      // Schedule tasks with different priorities
      await scheduler.schedule({
        type: 'email',
        data: { priority: 'low' },
        executeAt: new Date(Date.now() + 60000),
        priority: 'low'
      });

      await scheduler.schedule({
        type: 'push',
        data: { priority: 'high' },
        executeAt: new Date(Date.now() + 60000),
        priority: 'high'
      });

      await scheduler.schedule({
        type: 'orchestration',
        data: { priority: 'normal' },
        executeAt: new Date(Date.now() + 60000),
        priority: 'normal'
      });

      const tasks = await scheduler.listPendingTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks[0].priority).toBe('high');
      expect(tasks[1].priority).toBe('normal');
      expect(tasks[2].priority).toBe('low');
    });

    it('should not include cancelled tasks', async () => {
      // Schedule and cancel a task
      const scheduleResult = await scheduler.schedule({
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      await scheduler.cancel(scheduleResult.taskId!);

      const pendingTasks = await scheduler.listPendingTasks();
      expect(pendingTasks).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Schedule some tasks
      const task1 = await scheduler.schedule({
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      const task2 = await scheduler.schedule({
        type: 'push',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      // Cancel one
      await scheduler.cancel(task1.taskId!);

      const stats = await scheduler.getStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove completed and cancelled tasks', async () => {
      // Schedule tasks
      const task1 = await scheduler.schedule({
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      const task2 = await scheduler.schedule({
        type: 'push',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      // Cancel one task
      await scheduler.cancel(task1.taskId!);

      // Cleanup
      const removedCount = await scheduler.cleanup();

      expect(removedCount).toBe(1); // Only cancelled task removed
      
      const allTasks = await scheduler.listAllTasks();
      expect(allTasks).toHaveLength(1); // Only pending task remains
      expect(allTasks[0].status).toBe('pending');
    });
  });

  describe('Personalized Messaging', () => {
    describe('schedule() with personalized messaging', () => {
      it('should accept send_individual_messages flag', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: { firstName: 'John' } },
            { user_id: 'user2', variables: { firstName: 'Jane' } }
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(true);
        expect(result.taskId).toBeDefined();

        const task = await scheduler.getTask(result.taskId!);
        expect(task?.send_individual_messages).toBe(true);
        expect(task?.per_user_variables).toEqual(input.per_user_variables);
      });

      it('should store per_user_variables in scheduled task', async () => {
        const perUserVars = [
          { user_id: 'user1', variables: { firstName: 'Alice', customUrl: 'app://rsvp/alice' } },
          { user_id: 'user2', variables: { firstName: 'Bob', customUrl: 'app://rsvp/bob' } }
        ];

        const input = {
          type: 'email' as const,
          data: { template: 'test' },
          executeAt: new Date(Date.now() + 120000),
          send_individual_messages: true,
          per_user_variables: perUserVars
        };

        const result = await scheduler.schedule(input);
        const task = await scheduler.getTask(result.taskId!);
        
        expect(task?.per_user_variables).toEqual(perUserVars);
        expect(task?.per_user_variables).toHaveLength(2);
        expect(task?.per_user_variables![0].variables.firstName).toBe('Alice');
        expect(task?.per_user_variables![1].variables.customUrl).toBe('app://rsvp/bob');
      });

      it('should validate per_user_variables array structure', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [] // Empty array should fail
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('per_user_variables array');
      });

      it('should validate user_id fields in per_user_variables', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: '', variables: { firstName: 'John' } } // Empty user_id should fail
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid user_id');
      });

      it('should validate variables objects in per_user_variables', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: null as any } // Null variables should fail
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid variables');
      });

      it('should validate recipient_count matches per_user_variables length', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: { firstName: 'John' } }
          ],
          recipient_count: 2 // Mismatch: 1 variable but expecting 2 recipients
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('must match recipient_count');
      });

      it('should store personalized data in database', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours (database only)
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: { firstName: 'John' } }
          ],
          recipient_count: 1
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(true);

        // Task should not be in RAM (>1 hour)
        const ramTasks = await scheduler.listPendingTasks();
        const ramTask = ramTasks.find(t => t.id === result.taskId);
        expect(ramTask).toBeUndefined();

        // But should be retrievable from database
        const task = await scheduler.getTask(result.taskId!);
        expect(task?.send_individual_messages).toBe(true);
        expect(task?.per_user_variables).toEqual(input.per_user_variables);
        expect(task?.recipient_count).toBe(1);
      });

      it('should load personalized tasks from database on startup', async () => {
        // First, schedule a personalized task that will be in database only
        const input = {
          type: 'email' as const,
          data: { template: 'test' },
          executeAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes (should load into RAM)
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: { firstName: 'Test' } }
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(true);

        // Create a new scheduler instance to test loading from database
        const newScheduler = new (scheduler.constructor as any)();
        
        // The new scheduler should load the personalized task
        const task = await newScheduler.getTask(result.taskId!);
        expect(task?.send_individual_messages).toBe(true);
        expect(task?.per_user_variables).toEqual(input.per_user_variables);
      });
    });

    describe('validation errors for personalized messaging', () => {
      it('should reject personalized tasks without per_user_variables', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true
          // Missing per_user_variables
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.error).toContain('per_user_variables is required');
      });

      it('should reject per_user_variables with missing user_id', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { variables: { firstName: 'John' } } as any // Missing user_id
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid user_id');
      });

      it('should reject per_user_variables with invalid user_id type', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 123, variables: { firstName: 'John' } } as any // Number instead of string
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid user_id');
      });

      it('should reject per_user_variables with missing variables', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1' } as any // Missing variables
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid variables');
      });

      it('should reject per_user_variables with invalid variables type', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: 'invalid' } as any // String instead of object
          ]
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid variables');
      });

      it('should reject mismatched recipient_count', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000),
          send_individual_messages: true,
          per_user_variables: [
            { user_id: 'user1', variables: { firstName: 'John' } },
            { user_id: 'user2', variables: { firstName: 'Jane' } }
          ],
          recipient_count: 3 // Mismatch: 2 variables but expecting 3 recipients
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('must match recipient_count');
      });
    });

    describe('backward compatibility', () => {
      it('should handle tasks without personalized messaging flags', async () => {
        const input = {
          type: 'orchestration' as const,
          data: { test: 'data' },
          executeAt: new Date(Date.now() + 60000)
          // No personalized messaging fields
        };

        const result = await scheduler.schedule(input);
        expect(result.success).toBe(true);

        const task = await scheduler.getTask(result.taskId!);
        expect(task?.send_individual_messages).toBe(false);
        expect(task?.per_user_variables).toBeUndefined();
        expect(task?.recipient_count).toBeUndefined();
      });

      it('should default send_individual_messages to false', async () => {
        const input = {
          type: 'email' as const,
          data: { template: 'test' },
          executeAt: new Date(Date.now() + 60000)
          // send_individual_messages not specified
        };

        const result = await scheduler.schedule(input);
        const task = await scheduler.getTask(result.taskId!);
        
        expect(task?.send_individual_messages).toBe(false);
      });
    });
  });
});