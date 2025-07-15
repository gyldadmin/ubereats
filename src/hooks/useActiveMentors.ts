import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { fetchActiveMentors } from '../services/hostDataService';
import { useAuthStore } from '../stores/authStore';
import type { ActiveMentor } from '../types/hostData';

/**
 * Hook for fetching active mentors for the current user's gyld
 * Includes mentors with status='Mentor', approval='Accepted', not expired,
 * and either same gyld or matching metro/gyld_type
 */
export const useActiveMentors = () => {
  const [mentors, setMentors] = useState<ActiveMentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user's gyld info from global state
  const { userGyld } = useAuthStore();

  const fetchMentors = useCallback(async () => {
    // Don't fetch if user doesn't have a gyld
    if (!userGyld) {
      setMentors([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, get the user's gyld details to get metro and gyld_type
      const { data: gyldData, error: gyldError } = await supabase
        .from('gyld')
        .select('metro, gyld_type')
        .eq('id', userGyld)
        .single();

      if (gyldError) {
        throw new Error('Failed to fetch gyld details');
      }

      // Now fetch active mentors with the gyld details
      const { data, error: mentorError } = await fetchActiveMentors(
        userGyld,
        gyldData.metro,
        gyldData.gyld_type
      );

      if (mentorError) {
        throw mentorError;
      }

      setMentors(data || []);

    } catch (err) {
      console.error('Error fetching active mentors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch active mentors');
    } finally {
      setLoading(false);
    }
  }, [userGyld]);

  // Fetch mentors when userGyld changes
  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchMentors();
  }, [fetchMentors]);

  return {
    mentors,
    loading,
    error,
    refresh,
  };
}; 