/**
 * Unit Tests for NotificationOrchestrator (Refactored with Repositories)
 * 
 * Tests the dependency injection and repository integration
 */

import { EmailService } from '../emailService';
import { NotificationOrchestrator } from '../notificationOrchestrator';
import { PushService } from '../pushService';
import type { Repositories } from '../repositories';

// Mock the repository dependencies
const mockRepositories: Repositories = {
  userRepository: {
    getUserEmails: jest.fn().mockResolvedValue([
      { user_id: 'user1', email: 'user1@example.com', first_name: 'John' },
      { user_id: 'user2', email: 'user2@example.com', first_name: 'Jane' }
    ])
  } as any,
  workflowRepository: {
    createWorkflow: jest.fn().mockResolvedValue('workflow-123'),
    lookupOrCreateWorkflowType: jest.fn().mockResolvedValue({ id: 'type-123', label: 'orchestration' })
  } as any,
  statusRepository: {
    lookupStatusOption: jest.fn().mockResolvedValue({ id: 'status-123', label: 'pending' })
  } as any
};

// Mock the services
jest.mock('../emailService');
jest.mock('../pushService');

const MockedEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const MockedPushService = PushService as jest.MockedClass<typeof PushService>;

describe('NotificationOrchestrator (Refactored)', () => {
  let orchestrator: NotificationOrchestrator;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockPushService: jest.Mocked<PushService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockEmailService = new MockedEmailService() as jest.Mocked<EmailService>;
    mockPushService = new MockedPushService() as jest.Mocked<PushService>;
    
    // Configure mocks
    mockEmailService.send = jest.fn().mockResolvedValue({
      success: true,
      message: 'Email sent successfully',
      emailId: 'email-123'
    });
    
    mockPushService.send = jest.fn().mockResolvedValue({
      success: true,
      message: 'Push notification sent successfully',
      ticketIds: ['ticket-123']
    });

    // Create orchestrator with dependency injection
    orchestrator = new NotificationOrchestrator(
      mockEmailService,
      mockPushService,
      mockRepositories
    );
  });

  describe('Dependency Injection', () => {
    it('should accept injected dependencies', () => {
      expect(orchestrator).toBeDefined();
      expect(mockRepositories.userRepository.getUserEmails).toBeDefined();
      expect(mockRepositories.workflowRepository.createWorkflow).toBeDefined();
      expect(mockRepositories.statusRepository.lookupStatusOption).toBeDefined();
    });

    it('should create default dependencies when none provided', () => {
      const defaultOrchestrator = new NotificationOrchestrator();
      expect(defaultOrchestrator).toBeDefined();
    });
  });

  describe('Repository Integration', () => {
    it('should use UserRepository for fetching user emails', async () => {
      // Test getUserEmails method indirectly by triggering immediate send
      const orchestrationInputs = {
        mode: 'email' as const,
        users: ['user1', 'user2'],
        title: 'Test Notification',
        content: 'Test content',
        send_date: new Date(),
        template_name: 'test_template',
        email_type: 'notification',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        initiated_by: 'test-user'
      };

      const result = await orchestrator.send(orchestrationInputs);

      // Should have called UserRepository to get emails
      expect(mockRepositories.userRepository.getUserEmails).toHaveBeenCalledWith(['user1', 'user2']);
      
      // Should have attempted to send email
      expect(mockEmailService.send).toHaveBeenCalled();
      
      // Should return success
      expect(result.success).toBe(true);
    });

    it('should use StatusRepository for status lookups', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      
      const orchestrationInputs = {
        mode: 'email' as const,
        users: ['user1'],
        title: 'Test Scheduled Notification',
        content: 'Test content',
        send_date: futureDate,
        template_name: 'test_template',
        email_type: 'notification',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        initiated_by: 'test-user'
      };

      const result = await orchestrator.send(orchestrationInputs);

      // Should have looked up pending status for scheduling
      expect(mockRepositories.statusRepository.lookupStatusOption).toHaveBeenCalledWith('pending');
      
      // Should return success for scheduling
      expect(result.success).toBe(true);
      expect(result.message).toContain('scheduled');
    });

    it('should use WorkflowRepository for workflow creation', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      
      const orchestrationInputs = {
        mode: 'both' as const,
        users: ['user1'],
        title: 'Test Scheduled Notification',
        content: 'Test content',
        send_date: futureDate,
        template_name: 'test_template',
        email_type: 'notification',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        initiated_by: 'test-user'
      };

      const result = await orchestrator.send(orchestrationInputs);

      // Should have looked up/created workflow type
      expect(mockRepositories.workflowRepository.lookupOrCreateWorkflowType).toHaveBeenCalledWith('orchestration');
      
      // Should have created workflow record
      expect(mockRepositories.workflowRepository.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'status-123',
          workflow_type: 'type-123',
          description: 'orchestration_both'
        })
      );
      
      // Should return success for scheduling
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      (mockRepositories.userRepository.getUserEmails as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const orchestrationInputs = {
        mode: 'email' as const,
        users: ['user1'],
        title: 'Test Notification',
        content: 'Test content',
        send_date: new Date(),
        template_name: 'test_template',
        email_type: 'notification',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        initiated_by: 'test-user'
      };

      const result = await orchestrator.send(orchestrationInputs);

      // Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process orchestration request');
    });
  });
});