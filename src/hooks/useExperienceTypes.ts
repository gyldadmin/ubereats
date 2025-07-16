import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface ExperienceType {
  id: string;
  label: string;
  image_square: string;
  social: boolean;
  priority: boolean;
  created_at: string;
}

/**
 * Hook for fetching social experience types
 * Returns priority types first, then additional types when expanded
 */
export const useExperienceTypes = () => {
  const [experienceTypes, setExperienceTypes] = useState<ExperienceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExperienceTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all social experience types, ordered by priority first
      const { data, error: fetchError } = await supabase
        .from('experience_type')
        .select('id, label, image_square, social, priority, created_at')
        .eq('social', true)
        .order('priority', { ascending: false })
        .order('label', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setExperienceTypes(data || []);
    } catch (err) {
      console.error('Error fetching experience types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch experience types');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchExperienceTypes();
  }, [fetchExperienceTypes]);

  // Split into priority and additional types
  const priorityTypes = experienceTypes.filter(type => type.priority);
  const additionalTypes = experienceTypes.filter(type => !type.priority);

  return {
    experienceTypes,
    priorityTypes,
    additionalTypes,
    loading,
    error,
    refresh: fetchExperienceTypes,
  };
};
