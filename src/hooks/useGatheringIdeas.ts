import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface GatheringIdea {
  id: string;
  created_at: string;
  updated_at: string;
  label: string;
  overview?: string;
  why?: string;
  description_text?: string;
  signup_text?: string;
  tag?: string;
  experience_type?: string[]; // Array of UUID strings - multiple experience types supported
  gathering_idea_category?: string[]; // Array of UUID strings - multiple categories supported
}

/**
 * Hook for fetching gathering ideas filtered by experience type
 * Loads ideas when experience_type is set to provide contextual suggestions
 */
export const useGatheringIdeas = (experienceTypeId?: string) => {
  const [gatheringIdeas, setGatheringIdeas] = useState<GatheringIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGatheringIdeas = useCallback(async () => {
    if (!experienceTypeId) {
      setGatheringIdeas([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching gathering ideas for experience_type:', experienceTypeId);
      
      // Query gathering_ideas where experience_type array contains the specified experienceTypeId
      const { data: ideasData, error: ideasError } = await supabase
        .from('gathering_ideas')
        .select('*')
        .contains('experience_type', [experienceTypeId]) // Array contains experienceTypeId
        .order('label', { ascending: true });

      if (ideasError) {
        throw ideasError;
      }

      console.log(' Gathering ideas result:', ideasData?.length || 0, 'ideas found');
      setGatheringIdeas(ideasData || []);

    } catch (err) {
      console.error('Error fetching gathering ideas:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch gathering ideas');
    } finally {
      setLoading(false);
    }
  }, [experienceTypeId]);

  useEffect(() => {
    fetchGatheringIdeas();
  }, [fetchGatheringIdeas]);

  const refresh = useCallback(() => {
    fetchGatheringIdeas();
  }, [fetchGatheringIdeas]);

  return {
    gatheringIdeas,
    loading,
    error,
    refresh,
    hasIdeas: gatheringIdeas.length > 0,
  };
};
