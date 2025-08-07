/**
 * StatusRepository - Handles all status-related database operations
 * 
 * This repository centralizes status data access, including:
 * - Looking up status options
 * - Managing gathering statuses
 * - Creating and updating status records
 */

import { supabase } from '../supabase';

export interface StatusOptionLookup {
  id: string;
  label: string;
}

export interface GatheringStatus {
  id: string;
  gathering_id: string;
  status_id: string;
  status_label?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusOption {
  id: string;
  label: string;
  description?: string;
  is_active: boolean;
  sort_order?: number;
}

export class StatusRepository {
  
  /**
   * Lookup status option by label
   * Throws error if not found
   */
  async lookupStatusOption(label: string): Promise<StatusOptionLookup> {
    console.log('StatusRepository: Looking up status option', { label });

    const { data, error } = await supabase
      .from('status_options')
      .select('id, label')
      .eq('label', label)
      .single();

    if (error || !data) {
      console.error('StatusRepository: Status option not found', { label, error });
      throw new Error(`Status option '${label}' not found: ${error?.message}`);
    }

    console.log('StatusRepository: Status option found', {
      label,
      id: data.id
    });

    return data as StatusOptionLookup;
  }

  /**
   * Get status option by ID
   */
  async getStatusOptionById(id: string): Promise<StatusOption | null> {
    console.log('StatusRepository: Fetching status option by ID', { id });

    const { data, error } = await supabase
      .from('status_options')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('StatusRepository: Status option not found', { id });
        return null;
      }
      console.error('StatusRepository: Error fetching status option', error);
      throw new Error(`Failed to fetch status option ${id}: ${error.message}`);
    }

    console.log('StatusRepository: Status option found', {
      id,
      label: data.label
    });

    return data as StatusOption;
  }

  /**
   * Get all active status options
   */
  async getAllActiveStatusOptions(): Promise<StatusOption[]> {
    console.log('StatusRepository: Fetching all active status options');

    const { data, error } = await supabase
      .from('status_options')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('StatusRepository: Error fetching active status options', error);
      throw new Error(`Failed to fetch active status options: ${error.message}`);
    }

    console.log('StatusRepository: Active status options found', {
      count: data?.length || 0
    });

    return (data || []) as StatusOption[];
  }

  /**
   * Create or update status option
   */
  async upsertStatusOption(statusOption: Omit<StatusOption, 'id'>): Promise<string> {
    console.log('StatusRepository: Upserting status option', {
      label: statusOption.label
    });

    // Try to find existing status option first
    const { data: existing } = await supabase
      .from('status_options')
      .select('id')
      .eq('label', statusOption.label)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('status_options')
        .update({
          description: statusOption.description,
          is_active: statusOption.is_active,
          sort_order: statusOption.sort_order
        })
        .eq('id', existing.id);

      if (error) {
        console.error('StatusRepository: Error updating status option', error);
        throw new Error(`Failed to update status option: ${error.message}`);
      }

      console.log('StatusRepository: Status option updated', {
        id: existing.id,
        label: statusOption.label
      });

      return existing.id;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('status_options')
        .insert(statusOption)
        .select('id')
        .single();

      if (error || !data) {
        console.error('StatusRepository: Error creating status option', error);
        throw new Error(`Failed to create status option: ${error?.message}`);
      }

      console.log('StatusRepository: Status option created', {
        id: data.id,
        label: statusOption.label
      });

      return data.id;
    }
  }

  /**
   * Get gathering status by gathering ID
   */
  async getGatheringStatus(gatheringId: string): Promise<GatheringStatus | null> {
    console.log('StatusRepository: Fetching gathering status', { gatheringId });

    const { data, error } = await supabase
      .from('gathering_status')
      .select(`
        id,
        gathering_id,
        status_id,
        created_at,
        updated_at,
        status_options!inner(label)
      `)
      .eq('gathering_id', gatheringId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('StatusRepository: Gathering status not found', { gatheringId });
        return null;
      }
      console.error('StatusRepository: Error fetching gathering status', error);
      throw new Error(`Failed to fetch gathering status for ${gatheringId}: ${error.message}`);
    }

    console.log('StatusRepository: Gathering status found', {
      gatheringId,
      statusId: data.status_id,
      statusLabel: (data as any).status_options?.label
    });

    return {
      id: data.id,
      gathering_id: data.gathering_id,
      status_id: data.status_id,
      status_label: (data as any).status_options?.label,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as GatheringStatus;
  }

  /**
   * Update gathering status
   */
  async updateGatheringStatus(gatheringId: string, statusId: string): Promise<void> {
    console.log('StatusRepository: Updating gathering status', {
      gatheringId,
      statusId
    });

    // Check if gathering status record exists
    const existing = await this.getGatheringStatus(gatheringId);

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('gathering_status')
        .update({
          status_id: statusId,
          updated_at: new Date().toISOString()
        })
        .eq('gathering_id', gatheringId);

      if (error) {
        console.error('StatusRepository: Error updating gathering status', error);
        throw new Error(`Failed to update gathering status: ${error.message}`);
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('gathering_status')
        .insert({
          gathering_id: gatheringId,
          status_id: statusId
        });

      if (error) {
        console.error('StatusRepository: Error creating gathering status', error);
        throw new Error(`Failed to create gathering status: ${error.message}`);
      }
    }

    console.log('StatusRepository: Gathering status updated successfully', {
      gatheringId,
      statusId
    });
  }

  /**
   * Get gatherings by status
   */
  async getGatheringsByStatus(statusLabel: string): Promise<string[]> {
    console.log('StatusRepository: Fetching gatherings by status', { statusLabel });

    const { data, error } = await supabase
      .from('gathering_status')
      .select(`
        gathering_id,
        status_options!inner(label)
      `)
      .eq('status_options.label', statusLabel);

    if (error) {
      console.error('StatusRepository: Error fetching gatherings by status', error);
      throw new Error(`Failed to fetch gatherings by status ${statusLabel}: ${error.message}`);
    }

    const gatheringIds = (data || []).map(item => item.gathering_id);

    console.log('StatusRepository: Gatherings found by status', {
      statusLabel,
      count: gatheringIds.length
    });

    return gatheringIds;
  }

  /**
   * Lookup multiple status options by labels
   */
  async lookupStatusOptions(labels: string[]): Promise<StatusOptionLookup[]> {
    console.log('StatusRepository: Looking up multiple status options', {
      labels,
      count: labels.length
    });

    // Handle empty input early
    if (labels.length === 0) {
      console.log('StatusRepository: Empty labels list provided, returning empty result');
      return [];
    }

    const { data, error } = await supabase
      .from('status_options')
      .select('id, label')
      .in('label', labels);

    if (error) {
      console.error('StatusRepository: Error looking up status options', error);
      throw new Error(`Failed to lookup status options: ${error.message}`);
    }

    const foundOptions = (data || []) as StatusOptionLookup[];
    const foundLabels = foundOptions.map(option => option.label);
    const missingLabels = labels.filter(label => !foundLabels.includes(label));

    if (missingLabels.length > 0) {
      console.warn('StatusRepository: Some status options not found', {
        missing: missingLabels
      });
    }

    console.log('StatusRepository: Status options lookup completed', {
      requested: labels.length,
      found: foundOptions.length,
      missing: missingLabels.length
    });

    return foundOptions;
  }
}

// Export singleton instance for convenience
export const statusRepository = new StatusRepository();