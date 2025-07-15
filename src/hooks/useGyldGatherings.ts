import { useState, useEffect, useCallback } from 'react';
import { fetchGyldGatherings } from '../services/hostDataService';
import { useAuthStore } from '../stores/authStore';
import type { GyldGathering } from '../types/hostData';

/**
 * Hook for fetching gatherings for the current user's gyld
 * Includes gatherings from 6 months ago to future, ordered by start_time
 */
export const useGyldGatherings = () => {
  const [gatherings, setGatherings] = useState<GyldGathering[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user's gyld from global state
  const { userGyld } = useAuthStore();

  const fetchGatherings = useCallback(async () => {
    // Don't fetch if user doesn't have a gyld
    if (!userGyld) {
      setGatherings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch gyld gatherings from service
      const { data, error: serviceError } = await fetchGyldGatherings(userGyld);

      if (serviceError) {
        throw serviceError;
      }

      setGatherings(data || []);

    } catch (err) {
      console.error('Error fetching gyld gatherings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch gyld gatherings');
    } finally {
      setLoading(false);
    }
  }, [userGyld]);

  // Fetch gatherings when userGyld changes
  useEffect(() => {
    fetchGatherings();
  }, [fetchGatherings]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchGatherings();
  }, [fetchGatherings]);

  return {
    gatherings,
    loading,
    error,
    refresh,
  };
}; 