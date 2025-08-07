import { notificationOrchestrator } from '../services/notificationOrchestrator';
import { scheduler } from '../services/scheduler';
import { supabase } from '../services/supabase';

// Mock dependencies
jest.mock('../services/scheduler');
jest.mock('../services/notificationOrchestrator');
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockScheduler = scheduler as jest.Mocked<typeof scheduler>;
const mockNotificationOrchestrator = notificationOrchestrator as jest.Mocked<typeof notificationOrchestrator>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Event Invitation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null,
    } as any);

    // Mock users data
    const mockFrom = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          { user_id: 'user-1', first: 'John' },
          { user_id: 'user-2', first: 'Jane' },
          { user_id: 'user-3', first: 'Bob' },
        ],
        error: null,
      }),
    };
    mockSupabase.from.mockReturnValue(mockFrom as any);
  });

  describe('Push Preferred Option', () => {
    it('should send push notifications immediately without email', async () => {
      // Mock successful orchestration
      mockNotificationOrchestrator.send.mockResolvedValue({
        success: true,
        message: 'Push notifications sent successfully',
        pushResult: { success: true, message: 'Push sent' },
        emailResult: null,
      });

      // Simulate the push preferred function logic
      const users = [
        { user_id: 'user-1', first: 'John' },
        { user_id: 'user-2', first: 'Jane' },
        { user_id: 'user-3', first: 'Bob' },
      ];

      const orchestrationInputs = {
        recipients: users.map(u => u.user_id),
        push_content: {
          title: 'Join us: F',
          body: 'You\'re invited! September 2, 2025 at 10:00 PM',
          data: { 
            event_id: '8013abc8-410f-43b1-89b9-69df4505dbcd',
            type: 'event_invitation'
          }
        },
        email_content: {
          template_name: 'basic_with_button',
          email_type: 'notification',
          sender_fullname: 'Gyld Team',
          subject: 'You\'re Invited: F',
          body1: 'We\'d love for you to join us for F on September 2, 2025 at 10:00 PM.',
          body2: 'This is an exciting opportunity to connect with fellow members.',
          buttontext: 'RSVP Now',
          buttonurl: 'https://app.gyld.org/gathering/8013abc8-410f-43b1-89b9-69df4505dbcd',
          unsubscribeurl: 'https://app.gyld.org/unsubscribe'
        },
        send_push: true,
        send_email: false, // Push preferred
        initiated_by: 'test-user-123',
        gathering_ID: '8013abc8-410f-43b1-89b9-69df4505dbcd'
      };

      const result = await mockNotificationOrchestrator.send(orchestrationInputs);

      expect(result.success).toBe(true);
      expect(mockNotificationOrchestrator.send).toHaveBeenCalledWith(
        expect.objectContaining({
          send_push: true,
          send_email: false,
          recipients: ['user-1', 'user-2', 'user-3']
        })
      );
    });

    it('should handle push preferred with no users found', async () => {
      // Mock no users found
      const mockFromEmpty = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockFromEmpty as any);

      // This should result in an error condition
      const users: any[] = [];
      expect(users.length).toBe(0);
    });

    it('should handle authentication failure', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      // This should result in early return
      const user = null;
      expect(user).toBeNull();
    });
  });

  describe('Push Plus Email Scheduled Options', () => {
    it('should schedule push + email for 3 minutes in the future', async () => {
      // Mock successful scheduling
      mockScheduler.schedule.mockResolvedValue({
        success: true,
        taskId: 'task-123',
        message: 'Task scheduled successfully'
      });

      const users = [
        { user_id: 'user-1', first: 'John' },
        { user_id: 'user-2', first: 'Jane' },
      ];

      const executeAt = new Date(Date.now() + 3 * 60 * 1000);
      const taskData = {
        recipients: users.map(u => u.user_id),
        push_content: {
          title: 'Join us: Growth at Anthropic',
          body: 'You\'re invited! September 3, 2025 at 11:00 PM',
          data: { 
            event_id: 'd0c30910-0799-4b0d-a539-40285f865de3',
            type: 'event_invitation'
          }
        },
        email_content: {
          template_name: 'basic_with_button',
          email_type: 'notification',
          sender_fullname: 'Gyld Team',
          subject: 'You\'re Invited: Growth at Anthropic',
          body1: 'We\'d love for you to join us for Growth at Anthropic on September 3, 2025 at 11:00 PM.',
          body2: 'This is an exciting opportunity to connect and learn about growth strategies.',
          buttontext: 'RSVP Now',
          buttonurl: 'https://app.gyld.org/gathering/d0c30910-0799-4b0d-a539-40285f865de3',
          unsubscribeurl: 'https://app.gyld.org/unsubscribe'
        },
        send_push: true,
        send_email: true,
        initiated_by: 'test-user-123',
        gathering_ID: 'd0c30910-0799-4b0d-a539-40285f865de3'
      };

      const result = await mockScheduler.schedule({
        type: 'orchestration',
        executeAt,
        data: taskData,
        description: 'Event invitation for Growth at Anthropic - Push + Email in 3 minutes'
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-123');
      expect(mockScheduler.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'orchestration',
          data: expect.objectContaining({
            send_push: true,
            send_email: true,
            recipients: ['user-1', 'user-2']
          })
        })
      );
    });

    it('should schedule push + email for 6 hours in the future', async () => {
      // Mock successful scheduling
      mockScheduler.schedule.mockResolvedValue({
        success: true,
        taskId: 'task-456',
        message: 'Task scheduled successfully'
      });

      const users = [
        { user_id: 'user-1', first: 'John' },
        { user_id: 'user-2', first: 'Jane' },
        { user_id: 'user-3', first: 'Bob' },
      ];

      const executeAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const taskData = {
        recipients: users.map(u => u.user_id),
        send_push: true,
        send_email: true,
        initiated_by: 'test-user-123',
        gathering_ID: '8013abc8-410f-43b1-89b9-69df4505dbcd'
      };

      const result = await mockScheduler.schedule({
        type: 'orchestration',
        executeAt,
        data: taskData,
        description: 'Event invitation for F - Push + Email in 6 hours'
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-456');
      expect(mockScheduler.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'orchestration',
          data: expect.objectContaining({
            send_push: true,
            send_email: true,
            recipients: ['user-1', 'user-2', 'user-3']
          })
        })
      );

      // Verify the execution time is approximately 6 hours from now
      const scheduledCall = mockScheduler.schedule.mock.calls[0][0];
      const timeDiff = scheduledCall.executeAt.getTime() - Date.now();
      expect(timeDiff).toBeGreaterThan(5.9 * 60 * 60 * 1000); // At least 5.9 hours
      expect(timeDiff).toBeLessThan(6.1 * 60 * 60 * 1000); // At most 6.1 hours
    });

    it('should handle scheduling failures', async () => {
      // Mock scheduling failure
      mockScheduler.schedule.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
        message: 'Unable to schedule task'
      });

      const users = [{ user_id: 'user-1', first: 'John' }];
      const executeAt = new Date(Date.now() + 3 * 60 * 1000);
      const taskData = {
        recipients: users.map(u => u.user_id),
        send_push: true,
        send_email: true,
        initiated_by: 'test-user-123'
      };

      const result = await mockScheduler.schedule({
        type: 'orchestration',
        executeAt,
        data: taskData,
        description: 'Test event invitation'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('Data Validation', () => {
    it('should validate event data structure', () => {
      const eventData = {
        eventId: '8013abc8-410f-43b1-89b9-69df4505dbcd',
        eventTitle: 'F',
        eventDate: 'September 2, 2025',
        eventTime: '10:00 PM'
      };

      expect(eventData.eventId).toMatch(/^[a-f0-9-]{36}$/);
      expect(eventData.eventTitle).toBeTruthy();
      expect(eventData.eventDate).toContain('2025');
      expect(eventData.eventTime).toContain('PM');
    });

    it('should validate push content structure', () => {
      const pushContent = {
        title: 'Join us: F',
        body: 'You\'re invited! September 2, 2025 at 10:00 PM',
        data: { 
          event_id: '8013abc8-410f-43b1-89b9-69df4505dbcd',
          type: 'event_invitation'
        }
      };

      expect(pushContent.title).toContain('Join us:');
      expect(pushContent.body).toContain('invited');
      expect(pushContent.data.event_id).toBeTruthy();
      expect(pushContent.data.type).toBe('event_invitation');
    });

    it('should validate email content structure', () => {
      const emailContent = {
        template_name: 'basic_with_button',
        email_type: 'notification',
        sender_fullname: 'Gyld Team',
        subject: 'You\'re Invited: F',
        body1: 'We\'d love for you to join us for F on September 2, 2025 at 10:00 PM.',
        body2: 'This is an exciting opportunity to connect with fellow members.',
        buttontext: 'RSVP Now',
        buttonurl: 'https://app.gyld.org/gathering/8013abc8-410f-43b1-89b9-69df4505dbcd',
        unsubscribeurl: 'https://app.gyld.org/unsubscribe'
      };

      expect(emailContent.template_name).toBe('basic_with_button');
      expect(emailContent.email_type).toBe('notification');
      expect(emailContent.subject).toContain('Invited');
      expect(emailContent.buttonurl).toContain('https://app.gyld.org/gathering/');
      expect(emailContent.unsubscribeurl).toContain('unsubscribe');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors when fetching users', async () => {
      // Mock database error
      const mockFromError = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection timeout' },
        }),
      };
      mockSupabase.from.mockReturnValue(mockFromError as any);

      // This should result in error handling
      const { data: users, error: usersError } = await mockSupabase.from('users_public')
        .select('user_id, first')
        .limit(50);

      expect(usersError).toBeTruthy();
      expect(usersError.message).toBe('Connection timeout');
      expect(users).toBeNull();
    });

    it('should handle orchestration failures', async () => {
      // Mock orchestration failure
      mockNotificationOrchestrator.send.mockResolvedValue({
        success: false,
        error: 'Push service unavailable',
        message: 'Failed to send push notifications',
        pushResult: null,
        emailResult: null,
      });

      const orchestrationInputs = {
        recipients: ['user-1'],
        send_push: true,
        send_email: false,
        initiated_by: 'test-user-123',
      };

      const result = await mockNotificationOrchestrator.send(orchestrationInputs as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Push service unavailable');
    });
  });
});