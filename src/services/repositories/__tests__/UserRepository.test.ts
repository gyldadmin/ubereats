/**
 * Unit Tests for UserRepository
 * 
 * Tests all user data access methods including:
 * - Email fetching
 * - Phone number fetching
 * - Contact information compilation
 * - User preferences
 * - Active user checks
 */

import type { UserEmailInfo, UserPhoneInfo, UserPreferences } from '../UserRepository';
import { UserRepository } from '../UserRepository';

// Mock the supabase module
jest.mock('../../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          not: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          })),
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        eq: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockSupabase: any;

  beforeEach(() => {
    userRepository = new UserRepository();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get reference to mocked supabase
    const { supabase } = require('../../supabase');
    mockSupabase = supabase;
  });

  describe('getUserEmails', () => {
    it('should fetch user emails successfully', async () => {
      const mockUsers: UserEmailInfo[] = [
        { user_id: 'user1', email: 'user1@example.com', first_name: 'John' },
        { user_id: 'user2', email: 'user2@example.com', first_name: 'Jane' }
      ];

      // Mock the chain of supabase calls
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null
            })
          })
        })
      });

      const result = await userRepository.getUserEmails(['user1', 'user2']);

      expect(result).toEqual(mockUsers);
      expect(mockSupabase.from).toHaveBeenCalledWith('users_public');
    });

    it('should filter out users without emails', async () => {
      const mockUsers = [
        { user_id: 'user1', email: 'user1@example.com', first_name: 'John' },
        { user_id: 'user2', email: null, first_name: 'Jane' },
        { user_id: 'user3', email: '', first_name: 'Bob' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null
            })
          })
        })
      });

      const result = await userRepository.getUserEmails(['user1', 'user2', 'user3']);

      // Should only return user1 (has valid email)
      expect(result).toEqual([
        { user_id: 'user1', email: 'user1@example.com', first_name: 'John' }
      ]);
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      await expect(userRepository.getUserEmails(['user1']))
        .rejects
        .toThrow('Failed to fetch user emails: Database connection failed');
    });

    it('should handle empty user list', async () => {
      const result = await userRepository.getUserEmails([]);
      expect(result).toEqual([]);
    });
  });

  describe('getUserPhones', () => {
    it('should fetch user phone numbers successfully', async () => {
      const mockUsers: UserPhoneInfo[] = [
        { user_id: 'user1', phone_number: '+1234567890', first_name: 'John' },
        { user_id: 'user2', phone_number: '+0987654321', first_name: 'Jane' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null
            })
          })
        })
      });

      const result = await userRepository.getUserPhones(['user1', 'user2']);

      expect(result).toEqual(mockUsers);
      expect(mockSupabase.from).toHaveBeenCalledWith('users_internal');
    });

    it('should filter out users without valid phone numbers', async () => {
      const mockUsers = [
        { user_id: 'user1', phone_number: '+1234567890', first_name: 'John' },
        { user_id: 'user2', phone_number: null, first_name: 'Jane' },
        { user_id: 'user3', phone_number: '', first_name: 'Bob' },
        { user_id: 'user4', phone_number: '   ', first_name: 'Alice' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null
            })
          })
        })
      });

      const result = await userRepository.getUserPhones(['user1', 'user2', 'user3', 'user4']);

      // Should only return user1 (has valid phone number)
      expect(result).toEqual([
        { user_id: 'user1', phone_number: '+1234567890', first_name: 'John' }
      ]);
    });
  });

  describe('getUserContactInfo', () => {
    it('should combine email and phone data successfully', async () => {
      const mockEmailData = [
        { user_id: 'user1', email: 'user1@example.com', first_name: 'John' },
        { user_id: 'user2', email: 'user2@example.com', first_name: 'Jane' }
      ];

      const mockPhoneData = [
        { user_id: 'user1', phone_number: '+1234567890' },
        { user_id: 'user3', phone_number: '+1111111111' }
      ];

      // Mock Promise.all results
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockEmailData,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockPhoneData,
              error: null
            })
          })
        });

      const result = await userRepository.getUserContactInfo(['user1', 'user2', 'user3']);

      expect(result).toEqual([
        {
          user_id: 'user1',
          email: 'user1@example.com',
          phone_number: '+1234567890',
          first_name: 'John'
        },
        {
          user_id: 'user2',
          email: 'user2@example.com',
          phone_number: undefined,
          first_name: 'Jane'
        },
        {
          user_id: 'user3',
          email: undefined,
          phone_number: '+1111111111',
          first_name: undefined
        }
      ]);
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(userRepository.getUserContactInfo(['user1']))
        .rejects
        .toThrow('Failed to fetch user contact info: Database error');
    });
  });

  describe('getUserPreferences', () => {
    it('should fetch user preferences successfully', async () => {
      const mockPreferences: UserPreferences[] = [
        {
          user_id: 'user1',
          email_notifications: true,
          push_notifications: false,
          sms_notifications: true
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      });

      const result = await userRepository.getUserPreferences(['user1']);

      expect(result).toEqual(mockPreferences);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_preferences');
    });

    it('should return empty array when no preferences found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await userRepository.getUserPreferences(['user1']);
      expect(result).toEqual([]);
    });
  });

  describe('getActiveUsers', () => {
    it('should return only active user IDs', async () => {
      const mockActiveUsers = [
        { user_id: 'user1' },
        { user_id: 'user3' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockActiveUsers,
              error: null
            })
          })
        })
      });

      const result = await userRepository.getActiveUsers(['user1', 'user2', 'user3']);

      expect(result).toEqual(['user1', 'user3']);
      expect(mockSupabase.from).toHaveBeenCalledWith('users_public');
    });

    it('should return empty array when no active users found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const result = await userRepository.getActiveUsers(['user1', 'user2']);
      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    it('should return user contact info for valid user', async () => {
      const mockEmailData = [
        { user_id: 'user1', email: 'user1@example.com', first_name: 'John' }
      ];
      const mockPhoneData = [
        { user_id: 'user1', phone_number: '+1234567890' }
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockEmailData,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockPhoneData,
              error: null
            })
          })
        });

      const result = await userRepository.getUserById('user1');

      expect(result).toEqual({
        user_id: 'user1',
        email: 'user1@example.com',
        phone_number: '+1234567890',
        first_name: 'John'
      });
    });

    it('should return null for non-existent user', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await userRepository.getUserById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('isUserActive', () => {
    it('should return true for active user', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ user_id: 'user1' }],
              error: null
            })
          })
        })
      });

      const result = await userRepository.isUserActive('user1');
      expect(result).toBe(true);
    });

    it('should return false for inactive user', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const result = await userRepository.isUserActive('user1');
      expect(result).toBe(false);
    });
  });
});