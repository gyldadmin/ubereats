/**
 * WorkflowRepository - Handles all workflow-related database operations
 * 
 * This repository centralizes workflow data access, including:
 * - Creating planned workflow records
 * - Updating workflow status
 * - Fetching workflow data
 * - Managing workflow types
 */

import { supabase } from '../supabase';

export interface WorkflowRecord {
  id?: string;
  status: string;
  gathering_id?: string | null;
  candidate_id?: string | null;
  workflow_id: string;
  workflow_type: string;
  workflow_data: any;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowTypeLookup {
  id: string;
  label: string;
}

export interface WorkflowUpdateData {
  status?: string;
  workflow_data?: any;
  description?: string;
  updated_at?: string;
}

export class WorkflowRepository {
  
  /**
   * Create a new planned workflow record
   */
  async createWorkflow(workflow: Omit<WorkflowRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    console.log('WorkflowRepository: Creating planned workflow', {
      workflowId: workflow.workflow_id,
      type: workflow.workflow_type,
      status: workflow.status
    });

    const { data, error } = await supabase
      .from('planned_workflows')
      .insert({
        status: workflow.status,
        gathering_id: workflow.gathering_id,
        candidate_id: workflow.candidate_id,
        workflow_id: workflow.workflow_id,
        workflow_type: workflow.workflow_type,
        workflow_data: workflow.workflow_data,
        description: workflow.description
      })
      .select('id')
      .single();

    if (error) {
      console.error('WorkflowRepository: Error creating planned workflow', error);
      throw new Error(`Failed to create planned workflow: ${error.message}`);
    }

    console.log('WorkflowRepository: Planned workflow created successfully', {
      id: data.id,
      workflowId: workflow.workflow_id
    });

    return data.id;
  }

  /**
   * Update an existing workflow record
   */
  async updateWorkflow(workflowId: string, updates: WorkflowUpdateData): Promise<void> {
    console.log('WorkflowRepository: Updating workflow', {
      workflowId,
      updates: Object.keys(updates)
    });

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('planned_workflows')
      .update(updateData)
      .eq('workflow_id', workflowId);

    if (error) {
      console.error('WorkflowRepository: Error updating workflow', error);
      throw new Error(`Failed to update workflow ${workflowId}: ${error.message}`);
    }

    console.log('WorkflowRepository: Workflow updated successfully', { workflowId });
  }

  /**
   * Get workflow by workflow_id
   */
  async getWorkflowById(workflowId: string): Promise<WorkflowRecord | null> {
    console.log('WorkflowRepository: Fetching workflow by ID', { workflowId });

    const { data, error } = await supabase
      .from('planned_workflows')
      .select('*')
      .eq('workflow_id', workflowId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('WorkflowRepository: Workflow not found', { workflowId });
        return null;
      }
      console.error('WorkflowRepository: Error fetching workflow', error);
      throw new Error(`Failed to fetch workflow ${workflowId}: ${error.message}`);
    }

    console.log('WorkflowRepository: Workflow found', {
      workflowId,
      status: data.status,
      type: data.workflow_type
    });

    return data as WorkflowRecord;
  }

  /**
   * Get workflows by status
   */
  async getWorkflowsByStatus(status: string, limit?: number): Promise<WorkflowRecord[]> {
    console.log('WorkflowRepository: Fetching workflows by status', { status, limit });

    let query = supabase
      .from('planned_workflows')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('WorkflowRepository: Error fetching workflows by status', error);
      throw new Error(`Failed to fetch workflows with status ${status}: ${error.message}`);
    }

    console.log('WorkflowRepository: Workflows found by status', {
      status,
      count: data?.length || 0
    });

    return (data || []) as WorkflowRecord[];
  }

  /**
   * Delete a workflow record
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    console.log('WorkflowRepository: Deleting workflow', { workflowId });

    const { error } = await supabase
      .from('planned_workflows')
      .delete()
      .eq('workflow_id', workflowId);

    if (error) {
      console.error('WorkflowRepository: Error deleting workflow', error);
      throw new Error(`Failed to delete workflow ${workflowId}: ${error.message}`);
    }

    console.log('WorkflowRepository: Workflow deleted successfully', { workflowId });
  }

  /**
   * Get workflows by gathering ID
   */
  async getWorkflowsByGathering(gatheringId: string): Promise<WorkflowRecord[]> {
    console.log('WorkflowRepository: Fetching workflows by gathering', { gatheringId });

    const { data, error } = await supabase
      .from('planned_workflows')
      .select('*')
      .eq('gathering_id', gatheringId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('WorkflowRepository: Error fetching workflows by gathering', error);
      throw new Error(`Failed to fetch workflows for gathering ${gatheringId}: ${error.message}`);
    }

    console.log('WorkflowRepository: Workflows found by gathering', {
      gatheringId,
      count: data?.length || 0
    });

    return (data || []) as WorkflowRecord[];
  }

  /**
   * Lookup or create workflow type
   */
  async lookupOrCreateWorkflowType(label: string): Promise<WorkflowTypeLookup> {
    console.log('WorkflowRepository: Looking up workflow type', { label });

    // First try to find existing workflow type
    const { data, error } = await supabase
      .from('workflow_type')
      .select('id, label')
      .eq('label', label)
      .single();

    if (data) {
      console.log('WorkflowRepository: Workflow type found', { label, id: data.id });
      return data as WorkflowTypeLookup;
    }

    // If not found, create it
    console.log('WorkflowRepository: Creating new workflow type', { label });
    const { data: newData, error: createError } = await supabase
      .from('workflow_type')
      .insert({ label })
      .select('id, label')
      .single();

    if (createError || !newData) {
      console.error('WorkflowRepository: Error creating workflow type', createError);
      throw new Error(`Failed to create workflow type '${label}': ${createError?.message}`);
    }

    console.log('WorkflowRepository: Workflow type created successfully', {
      label,
      id: newData.id
    });

    return newData as WorkflowTypeLookup;
  }

  /**
   * Get all workflow types
   */
  async getAllWorkflowTypes(): Promise<WorkflowTypeLookup[]> {
    console.log('WorkflowRepository: Fetching all workflow types');

    const { data, error } = await supabase
      .from('workflow_type')
      .select('id, label')
      .order('label');

    if (error) {
      console.error('WorkflowRepository: Error fetching workflow types', error);
      throw new Error(`Failed to fetch workflow types: ${error.message}`);
    }

    console.log('WorkflowRepository: Workflow types found', {
      count: data?.length || 0
    });

    return (data || []) as WorkflowTypeLookup[];
  }
}

// Export singleton instance for convenience
export const workflowRepository = new WorkflowRepository();