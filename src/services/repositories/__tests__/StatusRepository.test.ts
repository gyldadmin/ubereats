/**
 * Unit Tests for StatusRepository
 * 
 * Tests all status-related data access methods including:
 * - Looking up status options
 * - Managing gathering statuses
 * - Creating and updating status records
 */

import type { GatheringStatus, StatusOption, StatusOptionLookup } from '../StatusRepository';
import { StatusRepository } from '../StatusRepository';

// Mock the supabase module
jest.mock('../../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: null
              }))
            }))
          }))
        })),
        order: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        })),
        in: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'status-123' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('StatusRepository', () => {
  let statusRepository: StatusRepository;
  let mockSupabase: any;

  beforeEach(() => {
    statusRepository = new StatusRepository();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get reference to mocked supabase
    const { supabase } = require('../../supabase');
    mockSupabase = supabase;
  });

  describe('lookupStatusOption', () => {
    it('should return status option when found', async () => {
      const mockStatusOption: StatusOptionLookup = {
        id: 'status-123',
        label: 'pending'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStatusOption,
              error: null
            })
          })
        })
      });

      const result = await statusRepository.lookupStatusOption('pending');

      expect(result).toEqual(mockStatusOption);
      expect(mockSupabase.from).toHaveBeenCalledWith('status_options');
    });

    it('should throw error when status option not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      await expect(statusRepository.lookupStatusOption('nonexistent'))
        .rejects
        .toThrow('Status option \'nonexistent\' not found');
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      await expect(statusRepository.lookupStatusOption('pending'))
        .rejects
        .toThrow('Status option \'pending\' not found: Database connection failed');
    });
  });

  describe('getStatusOptionById', () => {
    it('should return status option when found', async () => {
      const mockStatusOption: StatusOption = {
        id: 'status-123',
        label: 'pending',
        description: 'Pending status',
        is_active: true,
        sort_order: 1
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStatusOption,
              error: null
            })
          })
        })
      });

      const result = await statusRepository.getStatusOptionById('status-123');

      expect(result).toEqual(mockStatusOption);
    });

    it('should return null when status option not found', async () => {
      const mockError = { code: 'PGRST116' }; // No rows returned

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      const result = await statusRepository.getStatusOptionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllActiveStatusOptions', () => {
    it('should return all active status options', async () => {
      const mockStatusOptions: StatusOption[] = [
        {
          id: 'status-1',
          label: 'pending',
          description: 'Pending status',
          is_active: true,
          sort_order: 1
        },
        {
          id: 'status-2',
          label: 'completed',
          description: 'Completed status',
          is_active: true,
          sort_order: 2
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockStatusOptions,
              error: null
            })
          })
        })
      });

      const result = await statusRepository.getAllActiveStatusOptions();

      expect(result).toEqual(mockStatusOptions);
      expect(mockSupabase.from).toHaveBeenCalledWith('status_options');
    });

    it('should handle empty result', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const result = await statusRepository.getAllActiveStatusOptions();

      expect(result).toEqual([]);
    });
  });

  describe('upsertStatusOption', () => {
    it('should update existing status option', async () => {
      const statusOption: Omit<StatusOption, 'id'> = {
        label: 'pending',
        description: 'Updated description',
        is_active: true,
        sort_order: 1
      };

      // First call finds existing status option
      // Second call updates it
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'existing-123' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        });

      const result = await statusRepository.upsertStatusOption(statusOption);

      expect(result).toBe('existing-123');
    });

    it('should create new status option when not found', async () => {
      const statusOption: Omit<StatusOption, 'id'> = {
        label: 'new_status',
        description: 'New status',
        is_active: true,
        sort_order: 1
      };

      // First call doesn't find existing status option
      // Second call creates new one
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-123' },
                error: null
              })
            })
          })
        });

      const result = await statusRepository.upsertStatusOption(statusOption);

      expect(result).toBe('new-123');
    });
  });

  describe('getGatheringStatus', () => {
    it('should return gathering status when found', async () => {
      const mockGatheringStatus = {
        id: 'gs-123',
        gathering_id: 'gathering-456',
        status_id: 'status-789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        status_options: { label: 'pending' }
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockGatheringStatus,
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await statusRepository.getGatheringStatus('gathering-456');

      expect(result).toEqual({
        id: 'gs-123',
        gathering_id: 'gathering-456',
        status_id: 'status-789',
        status_label: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });
    });

    it('should return null when gathering status not found', async () => {
      const mockError = { code: 'PGRST116' }; // No rows returned

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: mockError
                })
              })
            })
          })
        })
      });

      const result = await statusRepository.getGatheringStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateGatheringStatus', () => {
    it('should update existing gathering status', async () => {
      const mockExistingStatus: GatheringStatus = {
        id: 'gs-123',
        gathering_id: 'gathering-456',
        status_id: 'old-status',
        status_label: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock getGatheringStatus call (finds existing)
      jest.spyOn(statusRepository, 'getGatheringStatus')
        .mockResolvedValueOnce(mockExistingStatus);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      await statusRepository.updateGatheringStatus('gathering-456', 'new-status');

      expect(mockSupabase.from).toHaveBeenCalledWith('gathering_status');
    });

    it('should create new gathering status when not found', async () => {
      // Mock getGatheringStatus call (doesn't find existing)
      jest.spyOn(statusRepository, 'getGatheringStatus')
        .mockResolvedValueOnce(null);

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      await statusRepository.updateGatheringStatus('gathering-456', 'new-status');

      expect(mockSupabase.from).toHaveBeenCalledWith('gathering_status');
    });
  });

  describe('getGatheringsByStatus', () => {
    it('should return gathering IDs by status', async () => {
      const mockData = [
        { gathering_id: 'gathering-1' },
        { gathering_id: 'gathering-2' },
        { gathering_id: 'gathering-3' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      });

      const result = await statusRepository.getGatheringsByStatus('pending');

      expect(result).toEqual(['gathering-1', 'gathering-2', 'gathering-3']);
      expect(mockSupabase.from).toHaveBeenCalledWith('gathering_status');
    });

    it('should handle empty result', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await statusRepository.getGatheringsByStatus('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('lookupStatusOptions', () => {
    it('should return found status options', async () => {
      const mockStatusOptions: StatusOptionLookup[] = [
        { id: 'status-1', label: 'pending' },
        { id: 'status-2', label: 'completed' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockStatusOptions,
            error: null
          })
        })
      });

      const result = await statusRepository.lookupStatusOptions(['pending', 'completed', 'nonexistent']);

      expect(result).toEqual(mockStatusOptions);
      expect(mockSupabase.from).toHaveBeenCalledWith('status_options');
    });

    it('should handle empty input', async () => {
      const result = await statusRepository.lookupStatusOptions([]);

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(statusRepository.lookupStatusOptions(['pending']))
        .rejects
        .toThrow('Failed to lookup status options: Database connection failed');
    });
  });
});