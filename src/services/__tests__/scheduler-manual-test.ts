import { centralScheduler } from '../scheduler';

/**
 * Manual test functions for the CentralScheduler
 * These can be called from your app UI to test scheduler functionality
 */

export const schedulerManualTests = {
  /**
   * Test basic scheduling functionality
   */
  async testBasicScheduling(): Promise<void> {
    console.log('🧪 Testing basic scheduling...');

    try {
      // Schedule a test task for 10 seconds from now
      const result = await centralScheduler.schedule({
        type: 'custom',
        data: { message: 'Hello from scheduler!' },
        executeAt: new Date(Date.now() + 10000), // 10 seconds
        priority: 'normal',
        metadata: { test: 'basic-scheduling' }
      });

      if (result.success) {
        console.log('✅ Task scheduled successfully:', result.taskId);
        console.log('📊 Message:', result.message);
        
        // Get task details
        const task = await centralScheduler.getTask(result.taskId!);
        console.log('📋 Task details:', {
          id: task?.id,
          type: task?.type,
          executeAt: task?.executeAt.toISOString(),
          priority: task?.priority,
          status: task?.status
        });
      } else {
        console.error('❌ Failed to schedule task:', result.error);
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  },

  /**
   * Test task cancellation
   */
  async testTaskCancellation(): Promise<void> {
    console.log('🧪 Testing task cancellation...');

    try {
      // Schedule a task
      const scheduleResult = await centralScheduler.schedule({
        type: 'email',
        data: { to: 'test@example.com', subject: 'Test Email' },
        executeAt: new Date(Date.now() + 60000), // 1 minute
        priority: 'high'
      });

      if (!scheduleResult.success) {
        console.error('❌ Failed to schedule task for cancellation test');
        return;
      }

      console.log('✅ Task scheduled for cancellation test:', scheduleResult.taskId);

      // Cancel the task
      const cancelResult = await centralScheduler.cancel(scheduleResult.taskId!);

      if (cancelResult.success) {
        console.log('✅ Task cancelled successfully');
        
        // Verify status
        const status = await centralScheduler.getStatus(scheduleResult.taskId!);
        console.log('📊 Task status after cancellation:', status);
      } else {
        console.error('❌ Failed to cancel task:', cancelResult.error);
      }
    } catch (error) {
      console.error('❌ Cancellation test failed:', error);
    }
  },

  /**
   * Test task rescheduling
   */
  async testTaskRescheduling(): Promise<void> {
    console.log('🧪 Testing task rescheduling...');

    try {
      // Schedule a task
      const originalTime = new Date(Date.now() + 120000); // 2 minutes
      const scheduleResult = await centralScheduler.schedule({
        type: 'push',
        data: { title: 'Test Push', message: 'Hello World' },
        executeAt: originalTime,
        priority: 'normal'
      });

      if (!scheduleResult.success) {
        console.error('❌ Failed to schedule task for reschedule test');
        return;
      }

      console.log('✅ Task scheduled for reschedule test:', scheduleResult.taskId);
      console.log('📅 Original time:', originalTime.toISOString());

      // Reschedule for 5 minutes later
      const newTime = new Date(Date.now() + 300000); // 5 minutes
      const rescheduleResult = await centralScheduler.reschedule(scheduleResult.taskId!, newTime);

      if (rescheduleResult.success) {
        console.log('✅ Task rescheduled successfully');
        console.log('📅 New time:', newTime.toISOString());
        
        // Verify new time
        const task = await centralScheduler.getTask(scheduleResult.taskId!);
        console.log('📋 Updated task time:', task?.executeAt.toISOString());
      } else {
        console.error('❌ Failed to reschedule task:', rescheduleResult.error);
      }
    } catch (error) {
      console.error('❌ Reschedule test failed:', error);
    }
  },

  /**
   * Test priority ordering
   */
  async testPriorityOrdering(): Promise<void> {
    console.log('🧪 Testing priority ordering...');

    try {
      const executeTime = new Date(Date.now() + 180000); // 3 minutes

      // Schedule tasks with different priorities
      const tasks = await Promise.all([
        centralScheduler.schedule({
          type: 'custom',
          data: { name: 'Low Priority Task' },
          executeAt: executeTime,
          priority: 'low'
        }),
        centralScheduler.schedule({
          type: 'custom',
          data: { name: 'High Priority Task' },
          executeAt: executeTime,
          priority: 'high'
        }),
        centralScheduler.schedule({
          type: 'custom',
          data: { name: 'Normal Priority Task' },
          executeAt: executeTime,
          priority: 'normal'
        })
      ]);

      console.log('✅ All tasks scheduled');

      // Get pending tasks (should be ordered by priority)
      const pendingTasks = await centralScheduler.listPendingTasks();
      
      console.log('📋 Tasks in priority order:');
      pendingTasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.data.name} (${task.priority})`);
      });

      // Should be: High, Normal, Low
      if (pendingTasks.length === 3 &&
          pendingTasks[0].priority === 'high' &&
          pendingTasks[1].priority === 'normal' &&
          pendingTasks[2].priority === 'low') {
        console.log('✅ Priority ordering is correct');
      } else {
        console.error('❌ Priority ordering is incorrect');
      }
    } catch (error) {
      console.error('❌ Priority test failed:', error);
    }
  },

  /**
   * Test scheduler statistics
   */
  async testSchedulerStats(): Promise<void> {
    console.log('🧪 Testing scheduler statistics...');

    try {
      // Get initial stats
      const initialStats = await centralScheduler.getStats();
      console.log('📊 Initial stats:', initialStats);

      // Schedule some tasks
      await centralScheduler.schedule({
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      const task2 = await centralScheduler.schedule({
        type: 'push',
        data: {},
        executeAt: new Date(Date.now() + 120000)
      });

      // Cancel one task
      await centralScheduler.cancel(task2.taskId!);

      // Get updated stats
      const updatedStats = await centralScheduler.getStats();
      console.log('📊 Updated stats:', updatedStats);

      console.log('✅ Stats test completed');
    } catch (error) {
      console.error('❌ Stats test failed:', error);
    }
  },

  /**
   * Test input validation
   */
  async testInputValidation(): Promise<void> {
    console.log('🧪 Testing input validation...');

    try {
      // Test invalid task type
      const invalidTypeResult = await centralScheduler.schedule({
        type: 'invalid' as any,
        data: {},
        executeAt: new Date(Date.now() + 60000)
      });

      console.log('❌ Invalid type test:', invalidTypeResult.success ? 'FAILED' : 'PASSED');

      // Test past date
      const pastDateResult = await centralScheduler.schedule({
        type: 'email',
        data: {},
        executeAt: new Date(Date.now() - 60000) // 1 minute ago
      });

      console.log('❌ Past date test:', pastDateResult.success ? 'FAILED' : 'PASSED');

      // Test invalid priority
      const invalidPriorityResult = await centralScheduler.schedule({
        type: 'push',
        data: {},
        executeAt: new Date(Date.now() + 60000),
        priority: 'invalid' as any
      });

      console.log('❌ Invalid priority test:', invalidPriorityResult.success ? 'FAILED' : 'PASSED');

      console.log('✅ Input validation tests completed');
    } catch (error) {
      console.error('❌ Validation test failed:', error);
    }
  },

  /**
   * Test smart storage (Step 1.2) - RAM vs Database storage
   */
  async testSmartStorage(): Promise<void> {
    console.log('🧪 Testing smart storage (RAM vs Database)...');

    try {
      // Test 1: Schedule task for 30 minutes (should be in RAM + DB)
      const nearTask = await centralScheduler.schedule({
        type: 'push',
        data: { title: 'Near task', message: 'Executes within 1 hour' },
        executeAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        priority: 'normal'
      });

      // Test 2: Schedule task for 2 hours (should be in DB only)
      const farTask = await centralScheduler.schedule({
        type: 'email',
        data: { to: 'test@example.com', subject: 'Far task' },
        executeAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        priority: 'normal'
      });

      if (nearTask.success && farTask.success) {
        console.log('✅ Both tasks scheduled successfully');
        console.log('📋 Near task (30min):', nearTask.taskId, '- Should be in RAM + DB');
        console.log('📋 Far task (2hr):', farTask.taskId, '- Should be in DB only');

        // Check engine status to see RAM count
        const engineStatus = centralScheduler.getEngineStatus();
        console.log('🔧 Engine status:', engineStatus);
      } else {
        console.log('❌ Failed to schedule smart storage test tasks');
      }
    } catch (error) {
      console.error('❌ Smart storage test failed:', error);
    }
  },

  /**
   * Test execution engine (Step 1.3) - Task execution
   */
  async testExecutionEngine(): Promise<void> {
    console.log('🧪 Testing execution engine...');

    try {
      // Schedule a task to execute in 15 seconds
      const result = await centralScheduler.schedule({
        type: 'custom',
        data: { message: 'Testing execution engine', timestamp: Date.now() },
        executeAt: new Date(Date.now() + 15000), // 15 seconds
        priority: 'high',
        metadata: { test: 'execution-engine' }
      });

      if (result.success && result.taskId) {
        console.log('✅ Task scheduled for execution test:', result.taskId);
        console.log('⏰ Task should execute in ~15 seconds');
        console.log('👀 Watch the console for execution logs...');

        // Check status periodically
        const checkStatus = async () => {
          const status = await centralScheduler.getStatus(result.taskId!);
          console.log('📊 Task status:', status);
          
          if (status === 'pending') {
            setTimeout(checkStatus, 5000); // Check again in 5 seconds
          } else {
            console.log('🏁 Task execution finished with status:', status);
          }
        };

        setTimeout(checkStatus, 5000); // Start checking after 5 seconds
      } else {
        console.log('❌ Failed to schedule execution test task:', result.error);
      }
    } catch (error) {
      console.error('❌ Execution engine test failed:', error);
    }
  },

  /**
   * Test database persistence - Schedule task, verify it exists in database
   */
  async testDatabasePersistence(): Promise<void> {
    console.log('🧪 Testing database persistence...');

    try {
      // Schedule a task for 45 minutes from now
      const result = await centralScheduler.schedule({
        type: 'orchestration',
        data: { mode: 'push_preferred', users: ['test-user'], title: 'Persistence test' },
        executeAt: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
        priority: 'normal',
        metadata: { test: 'database-persistence' }
      });

      if (result.success && result.taskId) {
        console.log('✅ Task scheduled for persistence test:', result.taskId);
        
        // Verify we can retrieve it
        const retrievedTask = await centralScheduler.getTask(result.taskId);
        if (retrievedTask) {
          console.log('✅ Task retrieved successfully from scheduler');
          console.log('📋 Task data:', {
            id: retrievedTask.id,
            type: retrievedTask.type,
            status: retrievedTask.status,
            executeAt: retrievedTask.executeAt.toISOString()
          });
        } else {
          console.log('❌ Failed to retrieve scheduled task');
        }
      } else {
        console.log('❌ Failed to schedule persistence test task:', result.error);
      }
    } catch (error) {
      console.error('❌ Database persistence test failed:', error);
    }
  },

  /**
   * Test handler system (Step 2.1) - Task handlers and registry
   */
  async testHandlerSystem(): Promise<void> {
    console.log('🧪 Testing handler system...');

    try {
      // Test 1: Schedule a custom task that uses the LogMessageHandler
      const result = await centralScheduler.schedule({
        type: 'custom',
        data: {
          message: 'Hello from the handler system!',
          level: 'info'
        },
        executeAt: new Date(Date.now() + 10000), // 10 seconds
        priority: 'high',
        metadata: { test: 'handler-system' }
      });

      if (result.success && result.taskId) {
        console.log('✅ Custom task scheduled successfully:', result.taskId);
        console.log('⏰ Task should execute in ~10 seconds via LogMessageHandler');
        console.log('👀 Watch for "LogMessageHandler: [INFO]" message in console...');

        // Monitor task status
        const checkStatus = async () => {
          const status = await centralScheduler.getStatus(result.taskId!);
          console.log('📊 Handler task status:', status);
          
          if (status === 'pending') {
            setTimeout(checkStatus, 3000); // Check again in 3 seconds
          } else {
            console.log('🏁 Handler task finished with status:', status);
          }
        };

        setTimeout(checkStatus, 3000); // Start checking after 3 seconds
      } else {
        console.log('❌ Failed to schedule handler test task:', result.error);
      }

      // Test 2: Try to schedule an unsupported task type
      const unsupportedResult = await centralScheduler.schedule({
        type: 'email', // No email handler registered yet
        data: { to: 'test@example.com', subject: 'Test' },
        executeAt: new Date(Date.now() + 5000),
        priority: 'normal'
      });

      if (unsupportedResult.success) {
        console.log('📋 Email task scheduled (will fail execution - no handler):', unsupportedResult.taskId);
      } else {
        console.log('❌ Email task scheduling failed:', unsupportedResult.error);
      }

    } catch (error) {
      console.error('❌ Handler system test failed:', error);
    }
  },

  /**
   * Run all tests including new Steps 1.2, 1.3, and 2.1 tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Running all scheduler tests...\n');

    await this.testBasicScheduling();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testTaskCancellation();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testTaskRescheduling();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testPriorityOrdering();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testSchedulerStats();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testInputValidation();
    console.log('\n' + '='.repeat(50) + '\n');

    // New tests for Steps 1.2 and 1.3
    await this.testSmartStorage();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testExecutionEngine();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.testDatabasePersistence();
    console.log('\n' + '='.repeat(50) + '\n');

    // New test for Step 2.1
    await this.testHandlerSystem();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('🎉 All scheduler tests completed!');
  }
};