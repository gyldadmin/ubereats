/**
 * Integration Tests for Personalized Messaging with CentralScheduler
 * 
 * These tests validate the complete end-to-end flow:
 * CentralScheduler → TaskHandlerRegistry → IndividualEmailHandler → EmailService
 */

import type { ScheduleTaskInput } from '../scheduler';
import { CentralScheduler } from '../scheduler';

// Mock dependencies at the module level
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: [{ id: 'test-task-123' }],
          error: null
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [
            { user_id: 'user1', email: 'john@example.com' },
            { user_id: 'user2', email: 'jane@example.com' }
          ],
          error: null
        }))
      }))
    }))
  }
}));

jest.mock('../emailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      success: true,
      message: 'Email sent successfully',
      emailId: 'email-123'
    })
  }))
}));

jest.mock('../contentTemplateService', () => ({
  preparePersonalizedData: jest.fn().mockImplementation((userIds, emails, perUserVariables, globalVariables) => {
    return userIds.map((userId, index) => ({
      user_id: userId,
      email: emails[index],
      first_name: perUserVariables[index]?.variables?.firstName || '',
      global_variables: globalVariables,
      user_variables: perUserVariables[index]?.variables || {},
      merged_variables: { ...globalVariables, ...perUserVariables[index]?.variables }
    }));
  }),
  processPersonalizedContentTemplate: jest.fn().mockImplementation((contentKey, contentType, globalVariables, personalizedData) => {
    return Promise.resolve(personalizedData.map(userData => ({
      user_id: userData.user_id,
      email: userData.email,
      success: true,
      processed_template: {
        content_key: contentKey,
        content_type: contentType,
        processed_primary_text: `Hello ${userData.user_variables.firstName || 'there'}`,
        processed_secondary_text: `Welcome to ${globalVariables.gathering_title || 'our event'}`,
        processed_tertiary_text: null
      }
    })));
  })
}));

describe('CentralScheduler Integration Tests - Personalized Messaging', () => {
  let scheduler: CentralScheduler;

  beforeEach(() => {
    // Create a fresh scheduler instance for each test
    scheduler = new CentralScheduler();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Stop the execution engine to prevent Jest hanging
    await scheduler.stopExecutionEngine();
  });

  describe('Individual Email Scheduling Integration', () => {
    it('should schedule and execute individual email task end-to-end', async () => {
      console.log('Integration Test: Starting individual email scheduling test');

      // Define personalized email task
      const taskInput: ScheduleTaskInput = {
        type: 'individual_email',
        executeAt: new Date(Date.now() + 1000), // 1 second from now
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000 },
        
        // Personalized messaging flags at scheduler level
        send_individual_messages: true,
        per_user_variables: [
          { 
            user_id: 'user1', 
            variables: { 
              firstName: 'John', 
              customUrl: 'app://rsvp/john-123',
              role: 'Developer'
            } 
          },
          { 
            user_id: 'user2', 
            variables: { 
              firstName: 'Jane', 
              customUrl: 'app://rsvp/jane-456',
              role: 'Designer'
            } 
          }
        ],
        recipient_count: 2,
        
        data: {
          // EmailServiceInputs format
          template_name: 'gathering_invite',
          email_type: 'invitation',
          sender_fullname: 'Alice Smith',
          subject: 'You\'re invited to our team gathering',
          body1: 'Join us for an amazing team gathering!',
          body2: 'RSVP by clicking your personalized link below.',
          send_date: new Date(),
          to_address: [], // Will be fetched by IndividualEmailHandler
          
          // Global template variables
          gathering_title: 'Q1 Team Celebration',
          host_name: 'Alice Smith',
          gathering_date: '2024-02-15',
          gathering_location: 'Downtown Office',
          attendee_count: 25
        }
      };

      // Schedule the task
      console.log('Integration Test: Scheduling individual email task');
      const scheduleResult = await scheduler.schedule(taskInput);
      
      expect(scheduleResult.success).toBe(true);
      expect(scheduleResult.taskId).toBeDefined();
      expect(scheduleResult.message).toContain('Task scheduled for');

      console.log('Integration Test: Task scheduled successfully', {
        taskId: scheduleResult.taskId,
        scheduledTime: taskInput.executeAt
      });

      // Start execution engine to process the task
      console.log('Integration Test: Starting execution engine');
      scheduler.startExecutionEngine();

      // Wait for task to be processed (with timeout)
      console.log('Integration Test: Waiting for task execution');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      // Stop execution engine
      await scheduler.stopExecutionEngine();
      console.log('Integration Test: Execution engine stopped');

      // Verify the mocks were called correctly
      const { EmailService } = require('../emailService');
      const mockEmailService = EmailService.mock.instances[0];
      
      expect(mockEmailService.send).toHaveBeenCalledTimes(2); // One for each user
      
      // Verify first email call
      expect(mockEmailService.send).toHaveBeenNthCalledWith(1, expect.objectContaining({
        to_address: ['john@example.com'],
        send_individual_messages: undefined, // Should be removed
        per_user_variables: undefined // Should be removed
      }));
      
      // Verify second email call
      expect(mockEmailService.send).toHaveBeenNthCalledWith(2, expect.objectContaining({
        to_address: ['jane@example.com'],
        send_individual_messages: undefined, // Should be removed
        per_user_variables: undefined // Should be removed
      }));

      console.log('Integration Test: Individual email integration test completed successfully');
    }, 10000); // 10 second timeout

    it('should handle individual email validation errors in scheduler', async () => {
      console.log('Integration Test: Testing individual email validation errors');

      // Define invalid personalized email task (missing per_user_variables)
      const invalidTaskInput: ScheduleTaskInput = {
        type: 'individual_email',
        executeAt: new Date(Date.now() + 1000),
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000 },
        
        // Invalid: send_individual_messages=true but no per_user_variables
        send_individual_messages: true,
        // per_user_variables: [] // Missing!
        
        data: {
          template_name: 'gathering_invite',
          email_type: 'invitation',
          sender_fullname: 'Alice Smith',
          subject: 'Test Subject',
          body1: 'Test Body',
          send_date: new Date(),
          to_address: []
        }
      };

      // Schedule the task
      const scheduleResult = await scheduler.schedule(invalidTaskInput);
      
      // Should fail at scheduling time due to missing per_user_variables
      expect(scheduleResult.success).toBe(false);
      expect(scheduleResult.error).toContain('per_user_variables is required');
      
      // EmailService should not have been called due to scheduling failure
      const { EmailService } = require('../emailService');
      expect(EmailService).not.toHaveBeenCalled();

      console.log('Integration Test: Validation error handling test completed');
    }, 10000);

    it('should handle individual email processing with partial failures', async () => {
      console.log('Integration Test: Testing partial failure handling');

      // Mock EmailService to simulate partial failures
      const { EmailService } = require('../emailService');
      EmailService.mockImplementation(() => ({
        send: jest.fn()
          .mockResolvedValueOnce({
            success: true,
            message: 'Email sent successfully',
            emailId: 'email-123'
          })
          .mockResolvedValueOnce({
            success: false,
            message: 'Email sending failed',
            error: 'SMTP connection failed'
          })
      }));

      const taskInput: ScheduleTaskInput = {
        type: 'individual_email',
        executeAt: new Date(Date.now() + 1000),
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000 },
        
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } },
          { user_id: 'user2', variables: { firstName: 'Jane' } }
        ],
        recipient_count: 2,
        
        data: {
          template_name: 'test_template',
          email_type: 'notification',
          sender_fullname: 'Test Sender',
          subject: 'Test Subject',
          body1: 'Test Body',
          send_date: new Date(),
          to_address: []
        }
      };

      // Schedule and execute
      const scheduleResult = await scheduler.schedule(taskInput);
      expect(scheduleResult.success).toBe(true);
      
      scheduler.startExecutionEngine();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await scheduler.stopExecutionEngine();

      // Verify both emails were attempted
      const mockEmailService = EmailService.mock.instances[0];
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);

      console.log('Integration Test: Partial failure handling test completed');
    }, 10000);
  });

  describe('Orchestration Integration with Individual Messaging', () => {
    it('should route orchestration tasks to individual email handler', async () => {
      console.log('Integration Test: Testing orchestration → individual email routing');

      // Define orchestration task with individual messaging
      const orchestrationTaskInput: ScheduleTaskInput = {
        type: 'orchestration',
        executeAt: new Date(Date.now() + 1000),
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000 },
        
        // Individual messaging flags at scheduler level
        send_individual_messages: true,
        per_user_variables: [
          { 
            user_id: 'user1', 
            variables: { 
              firstName: 'John',
              department: 'Engineering',
              customUrl: 'app://meeting/john-rsvp'
            } 
          },
          { 
            user_id: 'user2', 
            variables: { 
              firstName: 'Jane',
              department: 'Design', 
              customUrl: 'app://meeting/jane-rsvp'
            } 
          }
        ],
        recipient_count: 2,
        
        data: {
          // OrchestrationInputs format
          mode: 'both', // Required for individual messaging
          send_date: new Date(),
          content_key: 'gathering_reminder',
          gathering_title: 'Monthly All-Hands',
          host_name: 'CEO Team',
          gathering_date: '2024-02-20',
          gathering_location: 'Main Conference Room',
          attendee_count: 50
        }
      };

      // Schedule the orchestration task
      const scheduleResult = await scheduler.schedule(orchestrationTaskInput);
      expect(scheduleResult.success).toBe(true);

      console.log('Integration Test: Orchestration task scheduled', {
        taskId: scheduleResult.taskId
      });

      // Execute the task
      scheduler.startExecutionEngine();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await scheduler.stopExecutionEngine();

      // Verify that individual emails were sent (routed through OrchestrationHandler)
      const { EmailService } = require('../emailService');
      const mockEmailService = EmailService.mock.instances[0];
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);

      // Verify orchestration data was converted to email format
      expect(mockEmailService.send).toHaveBeenCalledWith(expect.objectContaining({
        template_name: 'gathering_reminder',
        gathering_title: 'Monthly All-Hands',
        host_name: 'CEO Team'
      }));

      console.log('Integration Test: Orchestration routing test completed');
    }, 10000);
  });

  describe('Database Integration', () => {
    it('should persist personalized messaging data to database', async () => {
      console.log('Integration Test: Testing database persistence of personalized data');

      const taskInput: ScheduleTaskInput = {
        type: 'individual_email',
        executeAt: new Date(Date.now() + 60000), // 1 minute from now (won't execute)
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000 },
        
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } }
        ],
        recipient_count: 1,
        
        data: {
          template_name: 'test_template',
          email_type: 'notification',
          sender_fullname: 'Test Sender',
          subject: 'Test Subject',
          body1: 'Test Body',
          send_date: new Date(),
          to_address: []
        }
      };

      // Schedule the task (should persist to database)
      const scheduleResult = await scheduler.schedule(taskInput);
      expect(scheduleResult.success).toBe(true);

      // Verify supabase insert was called with personalized data
      const { supabase } = require('../supabase');
      expect(supabase.from).toHaveBeenCalledWith('planned_workflows');
      
      const insertCall = supabase.from().insert;
             expect(insertCall).toHaveBeenCalledWith(expect.objectContaining({
         type: 'individual_email',
        data: expect.objectContaining({
          send_individual_messages: true,
          per_user_variables: expect.arrayContaining([
            expect.objectContaining({
              user_id: 'user1',
              variables: expect.objectContaining({
                firstName: 'John'
              })
            })
          ]),
          recipient_count: 1
        })
      }));

      console.log('Integration Test: Database persistence test completed');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully during personalized messaging', async () => {
      console.log('Integration Test: Testing database error handling');

      // Mock database error for user email fetching
      const { supabase } = require('../supabase');
      supabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({
            data: [{ id: 'test-task-123' }],
            error: null
          }))
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      });

      const taskInput: ScheduleTaskInput = {
        type: 'individual_email',
        executeAt: new Date(Date.now() + 1000),
        retryPolicy: { maxRetries: 3, retryDelayMs: 1000 },
        
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } }
        ],
        recipient_count: 1,
        
        data: {
          template_name: 'test_template',
          email_type: 'notification',
          sender_fullname: 'Test Sender',
          subject: 'Test Subject',
          body1: 'Test Body',
          send_date: new Date(),
          to_address: []
        }
      };

      // Schedule and execute
      const scheduleResult = await scheduler.schedule(taskInput);
      expect(scheduleResult.success).toBe(true);
      
      scheduler.startExecutionEngine();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await scheduler.stopExecutionEngine();

      // EmailService should not have been called due to database error
      const { EmailService } = require('../emailService');
      const mockEmailService = EmailService.mock.instances[0];
      expect(mockEmailService.send).not.toHaveBeenCalled();

      console.log('Integration Test: Database error handling test completed');
    }, 10000);
  });
});