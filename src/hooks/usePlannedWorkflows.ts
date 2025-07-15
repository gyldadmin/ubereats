import { useState, useEffect, useCallback } from 'react';
import { fetchPlannedWorkflows } from '../services/hostDataService';
import type { PlannedWorkflow } from '../types/hostData';

/**
 * Hook for fetching planned workflows for a specific gathering
 * Includes all workflows associated with the gathering ID
 */
export const usePlannedWorkflows = (gatheringId: string | null) => {
  const [workflows, setWorkflows] = useState<PlannedWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    // Don't fetch if no gathering ID is provided
    if (!gatheringId) {
      setWorkflows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch planned workflows from service
      const { data, error: serviceError } = await fetchPlannedWorkflows(gatheringId);

      if (serviceError) {
        throw serviceError;
      }

      setWorkflows(data || []);

    } catch (err) {
      console.error('Error fetching planned workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch planned workflows');
    } finally {
      setLoading(false);
    }
  }, [gatheringId]);

  // Fetch workflows when gatheringId changes
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    refresh,
  };
}; 