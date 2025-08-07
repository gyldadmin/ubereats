/**
 * Unit Tests for WorkflowRepository
 * 
 * Tests all workflow data access methods including:
 * - Creating workflows
 * - Updating workflows
 * - Fetching workflows
 * - Managing workflow types
 */

import type { WorkflowRecord, WorkflowTypeLookup, WorkflowUpdateData } from '../WorkflowRepository';
import { WorkflowRepository } from '../WorkflowRepository';

// Mock the supabase module
jest.mock('../../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'workflow-123' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            })),
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: null
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
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

describe('WorkflowRepository', () => {
  let workflowRepository: WorkflowRepository;
  let mockSupabase: any;

  beforeEach(() => {
    workflowRepository = new WorkflowRepository();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get reference to mocked supabase
    const { supabase } = require('../../supabase');
    mockSupabase = supabase;
  });

  describe('createWorkflow', () => {
    it('should create workflow successfully', async () => {
      const mockWorkflow: Omit<WorkflowRecord, 'id' | 'created_at' | 'updated_at'> = {
        status: 'pending',
        gathering_id: 'gathering-123',
        candidate_id: null,
        workflow_id: 'workflow-456',
        workflow_type: 'orchestration',
        workflow_data: { mode: 'both' },
        description: 'Test workflow'
      };

      const mockResponse = { id: 'db-record-123' };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockResponse,
              error: null
            })
          })
        })
      });

      const result = await workflowRepository.createWorkflow(mockWorkflow);

      expect(result).toBe('db-record-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('planned_workflows');
    });

    it('should throw error on creation failure', async () => {
      const mockWorkflow: Omit<WorkflowRecord, 'id' | 'created_at' | 'updated_at'> = {
        status: 'pending',
        gathering_id: 'gathering-123',
        candidate_id: null,
        workflow_id: 'workflow-456',
        workflow_type: 'orchestration',
        workflow_data: { mode: 'both' },
        description: 'Test workflow'
      };

      const mockError = new Error('Database constraint violation');

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      await expect(workflowRepository.createWorkflow(mockWorkflow))
        .rejects
        .toThrow('Failed to create planned workflow: Database constraint violation');
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow successfully', async () => {
      const updates: WorkflowUpdateData = {
        status: 'completed',
        workflow_data: { result: 'success' }
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      await workflowRepository.updateWorkflow('workflow-123', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('planned_workflows');
    });

    it('should throw error on update failure', async () => {
      const updates: WorkflowUpdateData = {
        status: 'completed'
      };

      const mockError = new Error('Workflow not found');

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(workflowRepository.updateWorkflow('workflow-123', updates))
        .rejects
        .toThrow('Failed to update workflow workflow-123: Workflow not found');
    });
  });

  describe('getWorkflowById', () => {
    it('should return workflow when found', async () => {
      const mockWorkflow: WorkflowRecord = {
        id: 'db-record-123',
        status: 'pending',
        gathering_id: 'gathering-123',
        candidate_id: null,
        workflow_id: 'workflow-456',
        workflow_type: 'orchestration',
        workflow_data: { mode: 'both' },
        description: 'Test workflow',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockWorkflow,
              error: null
            })
          })
        })
      });

      const result = await workflowRepository.getWorkflowById('workflow-456');

      expect(result).toEqual(mockWorkflow);
      expect(mockSupabase.from).toHaveBeenCalledWith('planned_workflows');
    });

    it('should return null when workflow not found', async () => {
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

      const result = await workflowRepository.getWorkflowById('nonexistent');

      expect(result).toBeNull();
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

      await expect(workflowRepository.getWorkflowById('workflow-123'))
        .rejects
        .toThrow('Failed to fetch workflow workflow-123: Database connection failed');
    });
  });

  describe('getWorkflowsByStatus', () => {
    it('should return workflows by status', async () => {
      const mockWorkflows: WorkflowRecord[] = [
        {
          id: 'db-record-1',
          status: 'pending',
          gathering_id: 'gathering-123',
          candidate_id: null,
          workflow_id: 'workflow-1',
          workflow_type: 'orchestration',
          workflow_data: { mode: 'both' },
          description: 'Test workflow 1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'db-record-2',
          status: 'pending',
          gathering_id: 'gathering-456',
          candidate_id: null,
          workflow_id: 'workflow-2',
          workflow_type: 'orchestration',
          workflow_data: { mode: 'email' },
          description: 'Test workflow 2',
          created_at: '2024-01-01T01:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockWorkflows,
              error: null
            })
          })
        })
      });

      const result = await workflowRepository.getWorkflowsByStatus('pending');

      expect(result).toEqual(mockWorkflows);
      expect(mockSupabase.from).toHaveBeenCalledWith('planned_workflows');
    });

    it('should apply limit when provided', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: mockLimit
            })
          })
        })
      });

      await workflowRepository.getWorkflowsByStatus('pending', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      await workflowRepository.deleteWorkflow('workflow-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('planned_workflows');
    });

    it('should throw error on deletion failure', async () => {
      const mockError = new Error('Foreign key constraint violation');

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(workflowRepository.deleteWorkflow('workflow-123'))
        .rejects
        .toThrow('Failed to delete workflow workflow-123: Foreign key constraint violation');
    });
  });

  describe('lookupOrCreateWorkflowType', () => {
    it('should return existing workflow type', async () => {
      const mockWorkflowType: WorkflowTypeLookup = {
        id: 'type-123',
        label: 'orchestration'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockWorkflowType,
              error: null
            })
          })
        })
      });

      const result = await workflowRepository.lookupOrCreateWorkflowType('orchestration');

      expect(result).toEqual(mockWorkflowType);
      expect(mockSupabase.from).toHaveBeenCalledWith('workflow_type');
    });

    it('should create new workflow type when not found', async () => {
      const newWorkflowType: WorkflowTypeLookup = {
        id: 'type-456',
        label: 'new_type'
      };

      // First call returns null (not found)
      // Second call returns the created type
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
                data: newWorkflowType,
                error: null
              })
            })
          })
        });

      const result = await workflowRepository.lookupOrCreateWorkflowType('new_type');

      expect(result).toEqual(newWorkflowType);
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Unique constraint violation');

      // First call returns null (not found)
      // Second call fails to create
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
                data: null,
                error: mockError
              })
            })
          })
        });

      await expect(workflowRepository.lookupOrCreateWorkflowType('new_type'))
        .rejects
        .toThrow('Failed to create workflow type \'new_type\': Unique constraint violation');
    });
  });

  describe('getAllWorkflowTypes', () => {
    it('should return all workflow types', async () => {
      const mockWorkflowTypes: WorkflowTypeLookup[] = [
        { id: 'type-1', label: 'orchestration' },
        { id: 'type-2', label: 'notification' },
        { id: 'type-3', label: 'reminder' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockWorkflowTypes,
            error: null
          })
        })
      });

      const result = await workflowRepository.getAllWorkflowTypes();

      expect(result).toEqual(mockWorkflowTypes);
      expect(mockSupabase.from).toHaveBeenCalledWith('workflow_type');
    });

    it('should handle empty result', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await workflowRepository.getAllWorkflowTypes();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(workflowRepository.getAllWorkflowTypes())
        .rejects
        .toThrow('Failed to fetch workflow types: Database connection failed');
    });
  });
});