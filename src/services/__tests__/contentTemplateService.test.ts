import {
    mergeTemplateVariables,
    preparePersonalizedData,
    processTemplateVariables
} from '../contentTemplateService';
// Tests for ContentTemplateService personalized messaging functions

describe('ContentTemplateService - Personalized Template Processing', () => {
  describe('mergeTemplateVariables', () => {
    it('should merge global and user variables', () => {
      const globalVars = {
        eventTitle: 'Team Meeting',
        eventDate: '2024-02-01',
        location: 'Conference Room A'
      };

      const userVars = {
        firstName: 'John',
        customUrl: 'app://rsvp/john-123'
      };

      const result = mergeTemplateVariables(globalVars, userVars);

      expect(result).toEqual({
        eventTitle: 'Team Meeting',
        eventDate: '2024-02-01',
        location: 'Conference Room A',
        firstName: 'John',
        customUrl: 'app://rsvp/john-123'
      });
    });

    it('should handle variable conflicts correctly (user wins)', () => {
      const globalVars = {
        title: 'Default Title',
        priority: 'normal'
      };

      const userVars = {
        title: 'Personalized Title',
        firstName: 'Jane'
      };

      const result = mergeTemplateVariables(globalVars, userVars);

      expect(result).toEqual({
        title: 'Personalized Title', // User variable should override global
        priority: 'normal',
        firstName: 'Jane'
      });
    });

    it('should preserve all unique variables', () => {
      const globalVars = { a: 1, b: 2 };
      const userVars = { c: 3, d: 4 };

      const result = mergeTemplateVariables(globalVars, userVars);

      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should handle empty variable objects', () => {
      expect(mergeTemplateVariables({}, { name: 'John' })).toEqual({ name: 'John' });
      expect(mergeTemplateVariables({ title: 'Test' }, {})).toEqual({ title: 'Test' });
      expect(mergeTemplateVariables({}, {})).toEqual({});
    });

    it('should handle null/undefined values', () => {
      const globalVars = { title: 'Test', value: null };
      const userVars = { name: 'John', age: undefined };

      const result = mergeTemplateVariables(globalVars, userVars);

      expect(result.title).toBe('Test');
      expect(result.value).toBeNull();
      expect(result.name).toBe('John');
      expect(result.age).toBeUndefined();
    });
  });

  describe('preparePersonalizedData', () => {
    it('should create PersonalizedMessageData for each user', () => {
      const userIds = ['user1', 'user2'];
      const emails = ['john@example.com', 'jane@example.com'];
      const perUserVariables = [
        { user_id: 'user1', variables: { firstName: 'John', role: 'admin' } },
        { user_id: 'user2', variables: { firstName: 'Jane', role: 'user' } }
      ];
      const globalVariables = { eventTitle: 'Workshop', location: 'Room A' };

      const result = preparePersonalizedData(userIds, emails, perUserVariables, globalVariables);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        user_id: 'user1',
        email: 'john@example.com',
        first_name: 'John',
        global_variables: { eventTitle: 'Workshop', location: 'Room A' },
        user_variables: { firstName: 'John', role: 'admin' },
        merged_variables: { 
          eventTitle: 'Workshop', 
          location: 'Room A', 
          firstName: 'John', 
          role: 'admin' 
        }
      });
    });

    it('should match user_ids with emails correctly', () => {
      const userIds = ['user-a', 'user-b'];
      const emails = ['a@test.com', 'b@test.com'];
      const perUserVariables = [
        { user_id: 'user-a', variables: { firstName: 'Alice' } },
        { user_id: 'user-b', variables: { firstName: 'Bob' } }
      ];
      const globalVariables = {};

      const result = preparePersonalizedData(userIds, emails, perUserVariables, globalVariables);

      expect(result[0]?.user_id).toBe('user-a');
      expect(result[0]?.email).toBe('a@test.com');
      expect(result[0]?.first_name).toBe('Alice');
      expect(result[1]?.user_id).toBe('user-b');
      expect(result[1]?.email).toBe('b@test.com');
      expect(result[1]?.first_name).toBe('Bob');
    });

    it('should merge global and per-user variables', () => {
      const userIds = ['user1'];
      const emails = ['test@example.com'];
      const perUserVariables = [
        { user_id: 'user1', variables: { firstName: 'Test', priority: 'high' } }
      ];
      const globalVariables = { eventTitle: 'Meeting', priority: 'normal' };

      const result = preparePersonalizedData(userIds, emails, perUserVariables, globalVariables);

      expect(result[0]?.merged_variables).toEqual({
        eventTitle: 'Meeting',
        priority: 'high', // User variable should override global
        firstName: 'Test'
      });
    });

    it('should handle mismatched array lengths', () => {
      const userIds = ['user1', 'user2'];
      const emails = ['test@example.com']; // Missing second email
      const perUserVariables = [
        { user_id: 'user1', variables: { firstName: 'Test' } }
      ];

      expect(() => {
        preparePersonalizedData(userIds, emails, perUserVariables, {});
      }).toThrow('userIds and emails arrays must have the same length');
    });

    it('should validate input parameters', () => {
      const userIds = ['user1'];
      const emails = ['test@example.com'];
      const perUserVariables: Array<{ user_id: string; variables: Record<string, any> }> = []; // Empty array

      expect(() => {
        preparePersonalizedData(userIds, emails, perUserVariables, {});
      }).toThrow('perUserVariables must have the same length as userIds');
    });

    it('should handle missing user variables gracefully', () => {
      const userIds = ['user1'];
      const emails = ['test@example.com'];
      const perUserVariables = [
        { user_id: 'different-user', variables: { firstName: 'Other' } } // Wrong user_id
      ];
      const globalVariables = { eventTitle: 'Test' };

      const result = preparePersonalizedData(userIds, emails, perUserVariables, globalVariables);

      expect(result[0]?.user_variables).toEqual({});
      expect(result[0]?.first_name).toBe('');
      expect(result[0]?.merged_variables).toEqual({ eventTitle: 'Test' });
    });

    it('should extract first name from different variable names', () => {
      const userIds = ['user1', 'user2', 'user3'];
      const emails = ['a@test.com', 'b@test.com', 'c@test.com'];
      const perUserVariables = [
        { user_id: 'user1', variables: { firstName: 'Alice' } },
        { user_id: 'user2', variables: { first_name: 'Bob' } },
        { user_id: 'user3', variables: { name: 'Charlie' } } // Different field name
      ];

      const result = preparePersonalizedData(userIds, emails, perUserVariables, {});

      expect(result[0]?.first_name).toBe('Alice');
      expect(result[1]?.first_name).toBe('Bob');
      expect(result[2]?.first_name).toBe(''); // name field not recognized
    });
  });

  describe('template variable processing integration', () => {
    it('should process templates with merged variables correctly', () => {
      const globalVars = { eventTitle: 'Team Meeting', eventDate: '2024-02-01' };
      const userVars = { firstName: 'John', customUrl: 'app://rsvp/john-123' };
      
      const merged = mergeTemplateVariables(globalVars, userVars);
      
      const template = 'Hello {{firstName}}, join us for {{eventTitle}} on {{eventDate}}. RSVP: {{customUrl}}';
      const processed = processTemplateVariables(template, merged);
      
      expect(processed).toBe('Hello John, join us for Team Meeting on 2024-02-01. RSVP: app://rsvp/john-123');
    });

    it('should handle variable conflicts in template processing', () => {
      const globalVars = { name: 'Default', priority: 'normal' };
      const userVars = { name: 'Personalized', role: 'admin' };
      
      const merged = mergeTemplateVariables(globalVars, userVars);
      
      const template = 'Welcome {{name}}, your priority is {{priority}} and role is {{role}}';
      const processed = processTemplateVariables(template, merged);
      
      expect(processed).toBe('Welcome Personalized, your priority is normal and role is admin');
    });

    it('should handle missing variables gracefully in template processing', () => {
      const variables = { firstName: 'John' };
      
      const template = 'Hello {{firstName}}, your {{missingVar}} is ready!';
      const processed = processTemplateVariables(template, variables);
      
      // Missing variables are left as-is (not replaced)
      expect(processed).toBe('Hello John, your {{missingVar}} is ready!');
    });
  });

  describe('backward compatibility', () => {
    it('should not break existing template processing', () => {
      // Test that existing processTemplateVariables still works
      const text = 'Hello {{name}}, your order {{orderId}} is ready!';
      const variables = { name: 'John', orderId: '12345' };

      const result = processTemplateVariables(text, variables);

      expect(result).toBe('Hello John, your order 12345 is ready!');
    });

    it('should work alongside existing functions', async () => {
      // This test ensures new functions don't interfere with existing ones
      const globalVars = { eventTitle: 'Test Event' };
      const userVars = { firstName: 'John' };

      const merged = mergeTemplateVariables(globalVars, userVars);
      expect(merged).toEqual({ eventTitle: 'Test Event', firstName: 'John' });

      // Test that processTemplateVariables works with merged variables
      const processed = processTemplateVariables('Hello {{firstName}} for {{eventTitle}}', merged);
      expect(processed).toBe('Hello John for Test Event');
    });
  });
});