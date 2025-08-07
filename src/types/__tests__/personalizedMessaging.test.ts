import type { PersonalizedMessageData, PersonalizedTemplateResult, ProcessedContentTemplate } from '../content';
import type { EmailServiceInputs } from '../email';
import type { OrchestrationInputs } from '../orchestration';

describe('Personalized Messaging Types', () => {
  describe('EmailServiceInputs enhancements', () => {
    it('should accept send_individual_messages flag', () => {
      const emailInput: EmailServiceInputs = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        initiated_by: 'user-123',
        send_individual_messages: true
      };

      expect(emailInput.send_individual_messages).toBe(true);
    });

    it('should accept per_user_variables array', () => {
      const perUserVars = [
        { user_id: 'user1', variables: { firstName: 'John', customUrl: 'app://rsvp/john' } },
        { user_id: 'user2', variables: { firstName: 'Jane', customUrl: 'app://rsvp/jane' } }
      ];

      const emailInput: EmailServiceInputs = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        initiated_by: 'user-123',
        send_individual_messages: true,
        per_user_variables: perUserVars
      };

      expect(emailInput.per_user_variables).toEqual(perUserVars);
      expect(emailInput.per_user_variables).toHaveLength(2);
    });

    it('should validate per_user_variables structure', () => {
      const perUserVars = [
        { user_id: 'user1', variables: { firstName: 'John' } }
      ];

      const emailInput: EmailServiceInputs = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        initiated_by: 'user-123',
        per_user_variables: perUserVars
      };

      expect(emailInput.per_user_variables![0].user_id).toBe('user1');
      expect(emailInput.per_user_variables![0].variables.firstName).toBe('John');
    });

    it('should be backward compatible with existing fields', () => {
      const emailInput: EmailServiceInputs = {
        template_name: 'test_template',
        email_type: 'test',
        sender_fullname: 'Test Sender',
        subject: 'Test Subject',
        body1: 'Test Body',
        send_date: new Date(),
        initiated_by: 'user-123',
        to_address: ['test@example.com'],
        cc_address: ['cc@example.com'],
        first: 'John'
      };

      expect(emailInput.to_address).toEqual(['test@example.com']);
      expect(emailInput.cc_address).toEqual(['cc@example.com']);
      expect(emailInput.first).toBe('John');
      expect(emailInput.send_individual_messages).toBeUndefined();
      expect(emailInput.per_user_variables).toBeUndefined();
    });
  });

  describe('OrchestrationInputs enhancements', () => {
    it('should accept send_individual_messages flag', () => {
      const orchestrationInput: OrchestrationInputs = {
        mode: 'push_preferred',
        send_date: new Date(),
        initiated_by: 'user-123',
        send_individual_messages: true
      };

      expect(orchestrationInput.send_individual_messages).toBe(true);
    });

    it('should accept per_user_variables array', () => {
      const perUserVars = [
        { user_id: 'user1', variables: { firstName: 'Alice', deepLink: 'app://event/alice' } },
        { user_id: 'user2', variables: { firstName: 'Bob', deepLink: 'app://event/bob' } }
      ];

      const orchestrationInput: OrchestrationInputs = {
        mode: 'both',
        send_date: new Date(),
        initiated_by: 'user-123',
        send_individual_messages: true,
        per_user_variables: perUserVars
      };

      expect(orchestrationInput.per_user_variables).toEqual(perUserVars);
      expect(orchestrationInput.per_user_variables).toHaveLength(2);
    });

    it('should maintain existing orchestration modes', () => {
      const pushPreferredInput: OrchestrationInputs = {
        mode: 'push_preferred',
        send_date: new Date(),
        initiated_by: 'user-123'
      };

      const bothModeInput: OrchestrationInputs = {
        mode: 'both',
        send_date: new Date(),
        initiated_by: 'user-123'
      };

      expect(pushPreferredInput.mode).toBe('push_preferred');
      expect(bothModeInput.mode).toBe('both');
    });
  });

  describe('PersonalizedMessageData interface', () => {
    it('should contain required user fields', () => {
      const personalizedData: PersonalizedMessageData = {
        user_id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        global_variables: { eventTitle: 'Team Meeting', eventDate: '2024-02-01' },
        user_variables: { firstName: 'John', customUrl: 'app://rsvp/john-123' },
        merged_variables: { 
          eventTitle: 'Team Meeting', 
          eventDate: '2024-02-01', 
          firstName: 'John', 
          customUrl: 'app://rsvp/john-123' 
        }
      };

      expect(personalizedData.user_id).toBe('user-123');
      expect(personalizedData.email).toBe('test@example.com');
      expect(personalizedData.first_name).toBe('John');
      expect(personalizedData.global_variables.eventTitle).toBe('Team Meeting');
      expect(personalizedData.user_variables.firstName).toBe('John');
    });

    it('should separate global and user variables', () => {
      const personalizedData: PersonalizedMessageData = {
        user_id: 'user-456',
        email: 'jane@example.com',
        first_name: 'Jane',
        global_variables: { eventTitle: 'Workshop', location: 'Conference Room A' },
        user_variables: { firstName: 'Jane', role: 'facilitator' },
        merged_variables: {}
      };

      expect(personalizedData.global_variables).toEqual({ 
        eventTitle: 'Workshop', 
        location: 'Conference Room A' 
      });
      expect(personalizedData.user_variables).toEqual({ 
        firstName: 'Jane', 
        role: 'facilitator' 
      });
    });

    it('should support merged variables', () => {
      const personalizedData: PersonalizedMessageData = {
        user_id: 'user-789',
        email: 'bob@example.com',
        first_name: 'Bob',
        global_variables: { eventTitle: 'Lunch & Learn' },
        user_variables: { firstName: 'Bob' },
        merged_variables: { eventTitle: 'Lunch & Learn', firstName: 'Bob' }
      };

      expect(personalizedData.merged_variables).toEqual({ 
        eventTitle: 'Lunch & Learn', 
        firstName: 'Bob' 
      });
    });

    it('should validate data structure', () => {
      const personalizedData: PersonalizedMessageData = {
        user_id: 'user-test',
        email: 'test@test.com',
        first_name: 'Test',
        global_variables: {},
        user_variables: {},
        merged_variables: {}
      };

      expect(typeof personalizedData.user_id).toBe('string');
      expect(typeof personalizedData.email).toBe('string');
      expect(typeof personalizedData.first_name).toBe('string');
      expect(typeof personalizedData.global_variables).toBe('object');
      expect(typeof personalizedData.user_variables).toBe('object');
      expect(typeof personalizedData.merged_variables).toBe('object');
    });
  });

  describe('PersonalizedTemplateResult interface', () => {
    it('should contain processing results', () => {
      const processedTemplate: ProcessedContentTemplate = {
        content_key: 'test_template',
        content_type: 'email',
        usage_context: 'notification',
        primary_text: 'Hello {{firstName}}',
        secondary_text: null,
        tertiary_text: null,
        dynamic_variables: [{ variable: 'firstName', description: 'User first name' }],
        processed_primary_text: 'Hello John',
        processed_secondary_text: null,
        processed_tertiary_text: null
      };

      const templateResult: PersonalizedTemplateResult = {
        user_id: 'user-123',
        email: 'john@example.com',
        processed_template: processedTemplate,
        success: true
      };

      expect(templateResult.user_id).toBe('user-123');
      expect(templateResult.email).toBe('john@example.com');
      expect(templateResult.processed_template).toEqual(processedTemplate);
      expect(templateResult.success).toBe(true);
      expect(templateResult.error).toBeUndefined();
    });

    it('should track success/failure per user', () => {
      const successResult: PersonalizedTemplateResult = {
        user_id: 'user-success',
        email: 'success@example.com',
        processed_template: {} as ProcessedContentTemplate,
        success: true
      };

      const failureResult: PersonalizedTemplateResult = {
        user_id: 'user-failure',
        email: 'failure@example.com',
        processed_template: {} as ProcessedContentTemplate,
        success: false,
        error: 'Template processing failed'
      };

      expect(successResult.success).toBe(true);
      expect(successResult.error).toBeUndefined();
      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBe('Template processing failed');
    });

    it('should include error details for failures', () => {
      const errorResult: PersonalizedTemplateResult = {
        user_id: 'user-error',
        email: 'error@example.com',
        processed_template: {} as ProcessedContentTemplate,
        success: false,
        error: 'Missing required variable: firstName'
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Missing required variable: firstName');
    });
  });
});