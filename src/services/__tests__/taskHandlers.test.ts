import { EmailHandler, LogMessageHandler, OrchestrationHandler, TaskHandlerRegistry } from '../taskHandlers';

describe('TaskHandlerRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    TaskHandlerRegistry.clear();
  });

  afterEach(() => {
    // Clean up after each test
    TaskHandlerRegistry.clear();
  });

  describe('registration', () => {
    it('should register a handler successfully', () => {
      const handler = new LogMessageHandler();
      TaskHandlerRegistry.register('test', handler);

      expect(TaskHandlerRegistry.hasHandler('test')).toBe(true);
      expect(TaskHandlerRegistry.getRegisteredTypes()).toContain('test');
    });

    it('should allow overwriting existing handlers', () => {
      const handler1 = new LogMessageHandler();
      const handler2 = new LogMessageHandler();
      
      TaskHandlerRegistry.register('test', handler1);
      TaskHandlerRegistry.register('test', handler2);

      expect(TaskHandlerRegistry.hasHandler('test')).toBe(true);
      expect(TaskHandlerRegistry.getRegisteredTypes()).toEqual(['test']);
    });

    it('should unregister handlers', () => {
      const handler = new LogMessageHandler();
      TaskHandlerRegistry.register('test', handler);
      
      expect(TaskHandlerRegistry.hasHandler('test')).toBe(true);
      
      const wasRemoved = TaskHandlerRegistry.unregister('test');
      expect(wasRemoved).toBe(true);
      expect(TaskHandlerRegistry.hasHandler('test')).toBe(false);
    });
  });

  describe('execution', () => {
    it('should execute registered handler successfully', async () => {
      const handler = new LogMessageHandler();
      TaskHandlerRegistry.register('custom', handler);

      const result = await TaskHandlerRegistry.execute('custom', {
        message: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Message logged successfully');
    });

    it('should return error for unregistered task type', async () => {
      const result = await TaskHandlerRegistry.execute('nonexistent', {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('No handler registered for task type');
      expect(result.error).toContain('Available task types');
    });

    it('should handle handler execution errors', async () => {
      // Create a handler that throws an error
      const errorHandler = {
        getName: () => 'ErrorHandler',
        execute: async () => {
          throw new Error('Test error');
        }
      };
      
      TaskHandlerRegistry.register('error', errorHandler);

      const result = await TaskHandlerRegistry.execute('error', {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Handler execution failed');
      expect(result.error).toBe('Test error');
    });
  });

  describe('stats', () => {
    it('should return correct statistics', () => {
      const handler1 = new LogMessageHandler();
      const handler2 = new LogMessageHandler();
      
      TaskHandlerRegistry.register('type1', handler1);
      TaskHandlerRegistry.register('type2', handler2);

      const stats = TaskHandlerRegistry.getStats();
      
      expect(stats.totalHandlers).toBe(2);
      expect(stats.registeredTypes).toEqual(['type1', 'type2']);
    });
  });
});

describe('LogMessageHandler', () => {
  let handler: LogMessageHandler;

  beforeEach(() => {
    handler = new LogMessageHandler();
  });

  describe('execute', () => {
    it('should log message successfully', async () => {
      const result = await handler.execute({
        message: 'Test log message'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Message logged successfully: \"Test log message\"');
      expect(result.metadata).toEqual({
        loggedAt: expect.any(String),
        level: 'info',
        messageLength: 16
      });
    });

    it('should handle different log levels', async () => {
      const result = await handler.execute({
        message: 'Warning message',
        level: 'warn'
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.level).toBe('warn');
    });

    it('should handle custom timestamp', async () => {
      const customTimestamp = '2024-01-01T00:00:00.000Z';
      const result = await handler.execute({
        message: 'Timestamped message',
        timestamp: customTimestamp
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.loggedAt).toBe(customTimestamp);
    });

    it('should reject invalid data', async () => {
      const result = await handler.execute('not an object');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid data: expected object with message field');
      expect(result.error).toBe('Data must be an object');
    });

    it('should reject missing message', async () => {
      const result = await handler.execute({
        level: 'info'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid data: message field is required and must be a string');
      expect(result.error).toBe('Missing or invalid message field');
    });

    it('should reject non-string message', async () => {
      const result = await handler.execute({
        message: 123
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid data: message field is required and must be a string');
      expect(result.error).toBe('Missing or invalid message field');
    });
  });

  describe('getName', () => {
    it('should return handler name', () => {
      expect(handler.getName()).toBe('LogMessageHandler');
    });
  });
});

describe('EmailHandler', () => {
  let handler: EmailHandler;
  let mockEmailService: any;

  beforeEach(() => {
    // Create a mock EmailService to avoid API key issues in tests
    mockEmailService = {
      send: jest.fn()
    };
    handler = new EmailHandler(mockEmailService);
  });

  describe('execute', () => {
    it('should validate required fields', async () => {
      const result = await handler.execute({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('missing required fields');
      expect(result.error).toContain('Missing fields');
    });

    it('should reject invalid data', async () => {
      const result = await handler.execute('not an object');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email data: expected EmailServiceInputs object');
      expect(result.error).toBe('Data must be a valid EmailServiceInputs object');
    });

    it('should require recipients', async () => {
      const validEmailData = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date()
      };

      const result = await handler.execute(validEmailData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email data: must specify either to_address or recipient_source');
      expect(result.error).toBe('No recipients specified');
    });

    it('should handle EmailService errors gracefully', async () => {
      // Configure mock to return an error
      mockEmailService.send.mockResolvedValue({
        success: false,
        message: 'SendGrid API error',
        error: 'Invalid API key'
      });

      const validEmailData = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        to_address: ['test@example.com']
      };

      const result = await handler.execute(validEmailData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('SendGrid API error');
      expect(result.error).toBe('Invalid API key');
      expect(mockEmailService.send).toHaveBeenCalledWith(validEmailData);
    });

    it('should handle EmailService success', async () => {
      // Configure mock to return success
      mockEmailService.send.mockResolvedValue({
        success: true,
        message: 'Email sent successfully',
        emailId: 'test-email-id-123'
      });

      const validEmailData = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        to_address: ['test@example.com']
      };

      const result = await handler.execute(validEmailData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email sent successfully');
      expect(result.metadata).toEqual({
        emailId: 'test-email-id-123',
        workflowId: undefined,
        template: 'test_template',
        email_type: 'test',
        processedAt: expect.any(String)
      });
      expect(mockEmailService.send).toHaveBeenCalledWith(validEmailData);
    });

    it('should handle scheduled email success', async () => {
      // Configure mock to return success with workflowId (scheduled email)
      mockEmailService.send.mockResolvedValue({
        success: true,
        message: 'Email scheduled successfully',
        workflowId: 'workflow-123'
      });

      const validEmailData = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(Date.now() + 60000), // 1 minute in future
        to_address: ['test@example.com']
      };

      const result = await handler.execute(validEmailData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email scheduled successfully');
      expect(result.metadata).toEqual({
        emailId: undefined,
        workflowId: 'workflow-123',
        template: 'test_template',
        email_type: 'test',
        processedAt: expect.any(String)
      });
    });

    it('should handle unexpected errors', async () => {
      // Configure mock to throw an error
      mockEmailService.send.mockRejectedValue(new Error('Network connection failed'));

      const validEmailData = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        to_address: ['test@example.com']
      };

      const result = await handler.execute(validEmailData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email handler execution failed');
      expect(result.error).toBe('Network connection failed');
    });
  });

  describe('getName', () => {
    it('should return handler name', () => {
      expect(handler.getName()).toBe('EmailHandler');
    });
  });
});

describe('OrchestrationHandler', () => {
  let handler: OrchestrationHandler;
  let mockOrchestrator: any;

  beforeEach(() => {
    // Create a mock NotificationOrchestrator to avoid service instantiation issues
    mockOrchestrator = {
      send: jest.fn()
    };
    handler = new OrchestrationHandler(mockOrchestrator);
  });

  describe('execute', () => {
    it('should validate required fields', async () => {
      const result = await handler.execute({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('missing required fields');
      expect(result.error).toContain('Missing fields');
    });

    it('should reject invalid data', async () => {
      const result = await handler.execute('not an object');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid orchestration data: expected OrchestrationInputs object');
      expect(result.error).toBe('Data must be a valid OrchestrationInputs object');
    });

    it('should validate mode field', async () => {
      const invalidModeData = {
        mode: 'invalid_mode',
        send_date: new Date()
      };

      const result = await handler.execute(invalidModeData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid orchestration data: mode must be "push_preferred" or "both"');
      expect(result.error).toBe('Invalid mode: invalid_mode');
    });

    it('should require recipients', async () => {
      const validOrchestrationData = {
        mode: 'push_preferred',
        send_date: new Date(),
        title: 'Test Title',
        content: 'Test Content'
      };

      const result = await handler.execute(validOrchestrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid orchestration data: must specify either users, recipient_source, or send_individual_messages');
      expect(result.error).toBe('No recipients specified');
    });

    it('should require content', async () => {
      const validOrchestrationData = {
        mode: 'push_preferred',
        send_date: new Date(),
        users: ['user1', 'user2']
      };

      const result = await handler.execute(validOrchestrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid orchestration data: must specify content (title/content, content_key, or content_source)');
      expect(result.error).toBe('No content specified');
    });

    it('should handle NotificationOrchestrator errors gracefully', async () => {
      // Configure mock to return an error
      mockOrchestrator.send.mockResolvedValue({
        success: false,
        message: 'Push service unavailable',
        error: 'Network timeout'
      });

      const validOrchestrationData = {
        mode: 'push_preferred',
        send_date: new Date(),
        users: ['user1', 'user2'],
        title: 'Test Title',
        content: 'Test Content'
      };

      const result = await handler.execute(validOrchestrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Push service unavailable');
      expect(result.error).toBe('Network timeout');
      expect(mockOrchestrator.send).toHaveBeenCalledWith(validOrchestrationData);
    });

    it('should handle NotificationOrchestrator success', async () => {
      // Configure mock to return success
      mockOrchestrator.send.mockResolvedValue({
        success: true,
        message: 'Orchestration completed successfully',
        workflowId: 'workflow-123',
        push_results: {
          attempted: true,
          success: true,
          sent_count: 2,
          failed_count: 0,
          failed_users: []
        },
        email_results: {
          attempted: false,
          success: false,
          sent_count: 0,
          failed_count: 0
        }
      });

      const validOrchestrationData = {
        mode: 'push_preferred',
        send_date: new Date(),
        users: ['user1', 'user2'],
        title: 'Test Title',
        content: 'Test Content'
      };

      const result = await handler.execute(validOrchestrationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Orchestration completed successfully');
      expect(result.metadata).toEqual({
        workflowId: 'workflow-123',
        mode: 'push_preferred',
        pushResults: {
          attempted: true,
          success: true,
          sent_count: 2,
          failed_count: 0,
          failed_users: []
        },
        emailResults: {
          attempted: false,
          success: false,
          sent_count: 0,
          failed_count: 0
        },
        processedAt: expect.any(String)
      });
      expect(mockOrchestrator.send).toHaveBeenCalledWith(validOrchestrationData);
    });

    it('should handle both mode orchestration success', async () => {
      // Configure mock to return success with both push and email results
      mockOrchestrator.send.mockResolvedValue({
        success: true,
        message: 'Both push and email sent successfully',
        push_results: {
          attempted: true,
          success: true,
          sent_count: 2,
          failed_count: 0,
          failed_users: [],
          ticketIds: ['ticket1', 'ticket2']
        },
        email_results: {
          attempted: true,
          success: true,
          sent_count: 2,
          failed_count: 0,
          emailId: 'email-123'
        }
      });

      const validOrchestrationData = {
        mode: 'both',
        send_date: new Date(),
        users: ['user1', 'user2'],
        title: 'Test Title',
        content: 'Test Content',
        secondary_content: 'Additional email content'
      };

      const result = await handler.execute(validOrchestrationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Both push and email sent successfully');
      expect(result.metadata?.pushResults?.ticketIds).toEqual(['ticket1', 'ticket2']);
      expect(result.metadata?.emailResults?.emailId).toBe('email-123');
    });

    it('should handle dynamic recipients and content', async () => {
      // Configure mock to return success
      mockOrchestrator.send.mockResolvedValue({
        success: true,
        message: 'Dynamic orchestration completed',
        workflowId: 'dynamic-workflow-456'
      });

      const dynamicOrchestrationData = {
        mode: 'both',
        send_date: new Date(),
        recipient_source: {
          type: 'rsvp_list',
          gathering_id: 'gathering-123',
          rsvp_status: 'yes'
        },
        content_source: {
          template_key: 'gathering_invite',
          dynamic_data_sources: {
            gathering_id: 'gathering-123',
            user_id: 'user-456'
          }
        }
      };

      const result = await handler.execute(dynamicOrchestrationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Dynamic orchestration completed');
      expect(result.metadata?.workflowId).toBe('dynamic-workflow-456');
      expect(mockOrchestrator.send).toHaveBeenCalledWith(dynamicOrchestrationData);
    });

    it('should handle unexpected errors', async () => {
      // Configure mock to throw an error
      mockOrchestrator.send.mockRejectedValue(new Error('Database connection failed'));

      const validOrchestrationData = {
        mode: 'push_preferred',
        send_date: new Date(),
        users: ['user1', 'user2'],
        title: 'Test Title',
        content: 'Test Content'
      };

      const result = await handler.execute(validOrchestrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Orchestration handler execution failed');
      expect(result.error).toBe('Database connection failed');
    });

    // Individual Messaging Tests
    it('should route to IndividualEmailHandler when send_individual_messages is true', async () => {
      // Mock the TaskHandlerRegistry.get method to return a mock IndividualEmailHandler
      const mockIndividualHandler = {
        execute: jest.fn().mockResolvedValue({
          success: true,
          message: 'Individual emails processed: 2 sent, 0 failed out of 2 total',
          metadata: {
            template: 'test_template',
            successCount: 2,
            failureCount: 0
          }
        })
      };

      const { TaskHandlerRegistry } = require('../taskHandlers');
      const originalGet = TaskHandlerRegistry.get;
      TaskHandlerRegistry.get = jest.fn().mockReturnValue(mockIndividualHandler);

      const individualOrchestrationData = {
        mode: 'both',
        send_date: new Date(),
        content_key: 'test_template',
        gathering_title: 'Team Meeting',
        host_name: 'Alice',
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } },
          { user_id: 'user2', variables: { firstName: 'Jane' } }
        ]
      };

      const result = await handler.execute(individualOrchestrationData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Individual emails processed');
      expect(result.metadata?.routedToIndividualHandler).toBe(true);
      expect(result.metadata?.orchestrationMode).toBe('both');
      expect(mockIndividualHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          send_individual_messages: true,
          per_user_variables: individualOrchestrationData.per_user_variables,
          template_name: 'test_template',
          gathering_title: 'Team Meeting',
          host_name: 'Alice'
        })
      );
      expect(mockOrchestrator.send).not.toHaveBeenCalled(); // Should not call regular orchestrator

      // Restore original method
      TaskHandlerRegistry.get = originalGet;
    });

    it('should validate per_user_variables when send_individual_messages is true', async () => {
      const invalidData = {
        mode: 'both',
        send_date: new Date(),
        content_key: 'test_template',
        send_individual_messages: true,
        per_user_variables: [] // Empty array - invalid
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('per_user_variables array is required for individual messaging');
      expect(mockOrchestrator.send).not.toHaveBeenCalled();
    });

    it('should validate per_user_variables structure for individual messaging', async () => {
      const invalidData = {
        mode: 'both',
        send_date: new Date(),
        content_key: 'test_template',
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } },
          { user_id: '', variables: { firstName: 'Jane' } } // Invalid user_id
        ]
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('per_user_variables[1].user_id must be a non-empty string');
      expect(mockOrchestrator.send).not.toHaveBeenCalled();
    });

    it('should reject push_preferred mode for individual messaging', async () => {
      const invalidData = {
        mode: 'push_preferred', // Invalid for individual messaging
        send_date: new Date(),
        content_key: 'test_template',
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } }
        ]
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('individual messaging currently only supports email mode');
      expect(mockOrchestrator.send).not.toHaveBeenCalled();
    });

    it('should handle IndividualEmailHandler errors gracefully', async () => {
      // Mock the TaskHandlerRegistry.get method to return a mock IndividualEmailHandler that fails
      const mockIndividualHandler = {
        execute: jest.fn().mockResolvedValue({
          success: false,
          message: 'All individual emails failed to send',
          error: 'SMTP connection failed'
        })
      };

      const { TaskHandlerRegistry } = require('../taskHandlers');
      const originalGet = TaskHandlerRegistry.get;
      TaskHandlerRegistry.get = jest.fn().mockReturnValue(mockIndividualHandler);

      const individualOrchestrationData = {
        mode: 'both',
        send_date: new Date(),
        content_key: 'test_template',
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } }
        ]
      };

      const result = await handler.execute(individualOrchestrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('All individual emails failed to send');
      expect(result.error).toBe('SMTP connection failed');
      expect(mockIndividualHandler.execute).toHaveBeenCalled();
      expect(mockOrchestrator.send).not.toHaveBeenCalled();

      // Restore original method
      TaskHandlerRegistry.get = originalGet;
    });

    it('should handle missing IndividualEmailHandler gracefully', async () => {
      // Mock the TaskHandlerRegistry.get method to return null (handler not found)
      const { TaskHandlerRegistry } = require('../taskHandlers');
      const originalGet = TaskHandlerRegistry.get;
      TaskHandlerRegistry.get = jest.fn().mockReturnValue(null);

      const individualOrchestrationData = {
        mode: 'both',
        send_date: new Date(),
        content_key: 'test_template',
        send_individual_messages: true,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John' } }
        ]
      };

      const result = await handler.execute(individualOrchestrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('IndividualEmailHandler not available');
      expect(result.error).toBe('Individual email handler is not registered');
      expect(mockOrchestrator.send).not.toHaveBeenCalled();

      // Restore original method
      TaskHandlerRegistry.get = originalGet;
    });
  });

  describe('getName', () => {
    it('should return handler name', () => {
      expect(handler.getName()).toBe('OrchestrationHandler');
    });
  });
});

describe('IndividualEmailHandler', () => {
  let handler: any;
  let mockEmailService: any;

  beforeEach(() => {
    // Import the IndividualEmailHandler
    const { IndividualEmailHandler } = require('../taskHandlers');
    
    // Create mock EmailService
    mockEmailService = {
      send: jest.fn()
    };

    // Create handler with mock EmailService
    handler = new IndividualEmailHandler(mockEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validIndividualEmailData = {
      template_name: 'test_template',
      email_type: 'notification',
      sender_fullname: 'Test Sender',
      subject: 'Test Subject',
      body1: 'Test Body',
      send_date: new Date(),
      initiated_by: 'user-123',
      send_individual_messages: true,
      per_user_variables: [
        { user_id: 'user1', variables: { firstName: 'John', customUrl: 'app://rsvp/john' } },
        { user_id: 'user2', variables: { firstName: 'Jane', customUrl: 'app://rsvp/jane' } }
      ]
    };

    it('should process individual emails successfully', async () => {
      // Mock the fetchUserEmails method directly on the handler
      handler.fetchUserEmails = jest.fn().mockResolvedValue(['john@example.com', 'jane@example.com']);

      // Mock the template processing functions by replacing them in the module
      const contentTemplateService = require('../contentTemplateService');
      const originalPreparePersonalizedData = contentTemplateService.preparePersonalizedData;
      const originalProcessPersonalizedContentTemplate = contentTemplateService.processPersonalizedContentTemplate;

      contentTemplateService.preparePersonalizedData = jest.fn().mockReturnValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          first_name: 'John',
          global_variables: {},
          user_variables: { firstName: 'John' },
          merged_variables: { firstName: 'John' }
        },
        {
          user_id: 'user2',
          email: 'jane@example.com',
          first_name: 'Jane',
          global_variables: {},
          user_variables: { firstName: 'Jane' },
          merged_variables: { firstName: 'Jane' }
        }
      ]);

      contentTemplateService.processPersonalizedContentTemplate = jest.fn().mockResolvedValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello John',
            processed_secondary_text: 'Test body for John',
            processed_tertiary_text: null
          }
        },
        {
          user_id: 'user2',
          email: 'jane@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello Jane',
            processed_secondary_text: 'Test body for Jane',
            processed_tertiary_text: null
          }
        }
      ]);

      // Mock successful email sending
      mockEmailService.send.mockResolvedValue({
        success: true,
        message: 'Email sent successfully',
        emailId: 'email-123'
      });

      const result = await handler.execute(validIndividualEmailData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Individual emails processed');
      expect(result.metadata?.successCount).toBe(2);
      expect(result.metadata?.failureCount).toBe(0);
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);

      // Restore original functions
      contentTemplateService.preparePersonalizedData = originalPreparePersonalizedData;
      contentTemplateService.processPersonalizedContentTemplate = originalProcessPersonalizedContentTemplate;
    });

    it('should handle validation errors for missing send_individual_messages flag', async () => {
      const invalidData = {
        ...validIndividualEmailData,
        send_individual_messages: false // Invalid
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('IndividualEmailHandler requires send_individual_messages=true');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should handle validation errors for missing per_user_variables', async () => {
      const invalidData = {
        ...validIndividualEmailData,
        per_user_variables: undefined // Invalid
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('per_user_variables array is required');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should handle validation errors for empty per_user_variables', async () => {
      const invalidData = {
        ...validIndividualEmailData,
        per_user_variables: [] // Empty array
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('per_user_variables array is required');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should handle validation errors for missing required fields', async () => {
      const invalidData = {
        ...validIndividualEmailData,
        template_name: undefined // Missing required field
      };

      const result = await handler.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('missing required fields');
      expect(result.message).toContain('template_name');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching user emails fails', async () => {
      // Mock fetchUserEmails to throw an error
      handler.fetchUserEmails = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const result = await handler.execute(validIndividualEmailData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Individual email handler execution failed');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should handle partial failures when some emails fail to send', async () => {
      // Mock the fetchUserEmails method
      handler.fetchUserEmails = jest.fn().mockResolvedValue(['john@example.com', 'jane@example.com']);

      // Mock template processing functions
      const contentTemplateService = require('../contentTemplateService');
      const originalPreparePersonalizedData = contentTemplateService.preparePersonalizedData;
      const originalProcessPersonalizedContentTemplate = contentTemplateService.processPersonalizedContentTemplate;

      contentTemplateService.preparePersonalizedData = jest.fn().mockReturnValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          first_name: 'John',
          global_variables: {},
          user_variables: { firstName: 'John' },
          merged_variables: { firstName: 'John' }
        },
        {
          user_id: 'user2',
          email: 'jane@example.com',
          first_name: 'Jane',
          global_variables: {},
          user_variables: { firstName: 'Jane' },
          merged_variables: { firstName: 'Jane' }
        }
      ]);

      contentTemplateService.processPersonalizedContentTemplate = jest.fn().mockResolvedValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello John',
            processed_secondary_text: 'Test body for John',
            processed_tertiary_text: null
          }
        },
        {
          user_id: 'user2',
          email: 'jane@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello Jane',
            processed_secondary_text: 'Test body for Jane',
            processed_tertiary_text: null
          }
        }
      ]);

      // Mock mixed success/failure for email sending
      mockEmailService.send
        .mockResolvedValueOnce({
          success: true,
          message: 'Email sent successfully',
          emailId: 'email-123'
        })
        .mockResolvedValueOnce({
          success: false,
          message: 'Email sending failed',
          error: 'SMTP connection failed'
        });

      const result = await handler.execute(validIndividualEmailData);

      expect(result.success).toBe(true); // Should succeed if at least one email sent
      expect(result.metadata?.successCount).toBe(1);
      expect(result.metadata?.failureCount).toBe(1);
      expect(result.metadata?.results).toHaveLength(2);
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);

      // Restore original functions
      contentTemplateService.preparePersonalizedData = originalPreparePersonalizedData;
      contentTemplateService.processPersonalizedContentTemplate = originalProcessPersonalizedContentTemplate;
    });

    it('should fail when all emails fail to send', async () => {
      // Mock the fetchUserEmails method
      handler.fetchUserEmails = jest.fn().mockResolvedValue(['john@example.com', 'jane@example.com']);

      // Mock template processing functions
      const contentTemplateService = require('../contentTemplateService');
      const originalPreparePersonalizedData = contentTemplateService.preparePersonalizedData;
      const originalProcessPersonalizedContentTemplate = contentTemplateService.processPersonalizedContentTemplate;

      contentTemplateService.preparePersonalizedData = jest.fn().mockReturnValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          first_name: 'John',
          global_variables: {},
          user_variables: { firstName: 'John' },
          merged_variables: { firstName: 'John' }
        },
        {
          user_id: 'user2',
          email: 'jane@example.com',
          first_name: 'Jane',
          global_variables: {},
          user_variables: { firstName: 'Jane' },
          merged_variables: { firstName: 'Jane' }
        }
      ]);

      contentTemplateService.processPersonalizedContentTemplate = jest.fn().mockResolvedValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello John',
            processed_secondary_text: 'Test body for John',
            processed_tertiary_text: null
          }
        },
        {
          user_id: 'user2',
          email: 'jane@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello Jane',
            processed_secondary_text: 'Test body for Jane',
            processed_tertiary_text: null
          }
        }
      ]);

      // Mock all emails failing
      mockEmailService.send.mockResolvedValue({
        success: false,
        message: 'Email sending failed',
        error: 'SMTP connection failed'
      });

      const result = await handler.execute(validIndividualEmailData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('All individual emails failed to send');
      expect(result.metadata?.successCount).toBe(0);
      expect(result.metadata?.failureCount).toBe(2);
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);

      // Restore original functions
      contentTemplateService.preparePersonalizedData = originalPreparePersonalizedData;
      contentTemplateService.processPersonalizedContentTemplate = originalProcessPersonalizedContentTemplate;
    });

    it('should handle invalid data types', async () => {
      const result = await handler.execute(null);

      expect(result.success).toBe(false);
      expect(result.message).toContain('expected EmailServiceInputs object');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during processing', async () => {
      // Mock fetchUserEmails to succeed
      handler.fetchUserEmails = jest.fn().mockResolvedValue(['john@example.com']);

      // Mock template processing to succeed
      const contentTemplateService = require('../contentTemplateService');
      const originalPreparePersonalizedData = contentTemplateService.preparePersonalizedData;
      const originalProcessPersonalizedContentTemplate = contentTemplateService.processPersonalizedContentTemplate;

      contentTemplateService.preparePersonalizedData = jest.fn().mockReturnValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          first_name: 'John',
          global_variables: {},
          user_variables: { firstName: 'John' },
          merged_variables: { firstName: 'John' }
        }
      ]);

      contentTemplateService.processPersonalizedContentTemplate = jest.fn().mockResolvedValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello John',
            processed_secondary_text: 'Test body for John',
            processed_tertiary_text: null
          }
        }
      ]);

      // Mock EmailService to throw an error
      mockEmailService.send.mockRejectedValue(new Error('Unexpected email service error'));

      const singleUserData = {
        ...validIndividualEmailData,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John', customUrl: 'app://rsvp/john' } }
        ]
      };

      const result = await handler.execute(singleUserData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('All individual emails failed to send');
      expect(result.metadata?.failureCount).toBe(1);

      // Restore original functions
      contentTemplateService.preparePersonalizedData = originalPreparePersonalizedData;
      contentTemplateService.processPersonalizedContentTemplate = originalProcessPersonalizedContentTemplate;
    });

    it('should process template variables correctly', async () => {
      // Mock the fetchUserEmails method
      handler.fetchUserEmails = jest.fn().mockResolvedValue(['john@example.com']);

      // Mock template processing functions
      const contentTemplateService = require('../contentTemplateService');
      const originalPreparePersonalizedData = contentTemplateService.preparePersonalizedData;
      const originalProcessPersonalizedContentTemplate = contentTemplateService.processPersonalizedContentTemplate;

      contentTemplateService.preparePersonalizedData = jest.fn().mockReturnValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          first_name: 'John',
          global_variables: { gathering_title: 'Team Meeting' },
          user_variables: { firstName: 'John' },
          merged_variables: { gathering_title: 'Team Meeting', firstName: 'John' }
        }
      ]);

      contentTemplateService.processPersonalizedContentTemplate = jest.fn().mockResolvedValue([
        {
          user_id: 'user1',
          email: 'john@example.com',
          success: true,
          processed_template: {
            processed_primary_text: 'Hello John',
            processed_secondary_text: 'Join us for Team Meeting',
            processed_tertiary_text: null
          }
        }
      ]);

      // Mock successful email sending
      mockEmailService.send.mockResolvedValue({
        success: true,
        message: 'Email sent successfully',
        emailId: 'email-123'
      });

      const dataWithTemplateVars = {
        ...validIndividualEmailData,
        gathering_title: 'Team Meeting',
        host_name: 'Alice Smith',
        gathering_date: '2024-02-01',
        gathering_location: 'Conference Room A',
        attendee_count: 5,
        per_user_variables: [
          { user_id: 'user1', variables: { firstName: 'John', customUrl: 'app://rsvp/john' } }
        ]
      };

      const result = await handler.execute(dataWithTemplateVars);

      expect(result.success).toBe(true);
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to_address: ['john@example.com'],
          send_individual_messages: undefined, // Should be removed
          per_user_variables: undefined // Should be removed
        })
      );

      // Restore original functions
      contentTemplateService.preparePersonalizedData = originalPreparePersonalizedData;
      contentTemplateService.processPersonalizedContentTemplate = originalProcessPersonalizedContentTemplate;
    });

    it('should handle mismatched user count and email count', async () => {
      // Mock fetchUserEmails to return fewer emails than expected
      handler.fetchUserEmails = jest.fn().mockResolvedValue(['john@example.com']); // Only 1 email for 2 users

      const result = await handler.execute(validIndividualEmailData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch all user emails');
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });
  });

  describe('getName', () => {
    it('should return handler name', () => {
      expect(handler.getName()).toBe('IndividualEmailHandler');
    });
  });
});