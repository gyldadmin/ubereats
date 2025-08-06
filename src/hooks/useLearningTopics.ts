import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

export interface LearningTopic {
  id: string;
  created_at: string;
  updated_at: string;
  label: string;
  knowledge_domain: string[];
  gyld_type: string[];
  color?: string;
}

/**
 * Hook for fetching learning topics filtered by current user's gyld_type
 * Uses array overlap to find learning topics that match at least one of the user's gyld types
 */
export const useLearningTopics = () => {
  const [learningTopics, setLearningTopics] = useState<LearningTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user's gyld from global state
  const { userGyld } = useAuthStore();

  const fetchLearningTopics = useCallback(async () => {
    // Don't fetch if user doesn't have a gyld
    if (!userGyld) {
      setLearningTopics([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching gyld details for learning topics, userGyld:', userGyld);
      
      // First, get the user's gyld details to get gyld_type array
      const { data: gyldData, error: gyldError } = await supabase
        .from('gyld')
        .select('gyld_type')
        .eq('id', userGyld)
        .single();

      if (gyldError) {
        throw new Error('Failed to fetch gyld details');
      }

      console.log('📊 Gyld data:', gyldData);

      if (!gyldData?.gyld_type || gyldData.gyld_type.length === 0) {
        console.log('❌ No gyld_type found, returning empty array');
        setLearningTopics([]);
        return;
      }

      // Now fetch learning topics where gyld_type array overlaps with user's gyld_type array
      console.log('🔍 Querying learning topics with gyld_type overlap:', gyldData.gyld_type);
      
      const { data: learningTopicsData, error: learningTopicsError } = await supabase
        .from('learning_topic')
        .select('*')
        .overlaps('gyld_type', Array.isArray(gyldData.gyld_type) ? gyldData.gyld_type : [gyldData.gyld_type])
        .order('label', { ascending: true });

      if (learningTopicsError) {
        throw learningTopicsError;
      }

      console.log('📊 Learning topics result:');
      console.log('- learningTopicsData count:', learningTopicsData?.length || 0);
      console.log('- learningTopicsData sample:', learningTopicsData?.slice(0, 2));

      setLearningTopics(learningTopicsData || []);

    } catch (err) {
      console.error('Error fetching learning topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch learning topics');
    } finally {
      setLoading(false);
    }
  }, [userGyld]);

  // Fetch learning topics when userGyld changes
  useEffect(() => {
    fetchLearningTopics();
  }, [fetchLearningTopics]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchLearningTopics();
  }, [fetchLearningTopics]);

  return {
    learningTopics,
    loading,
    error,
    refresh,
  };
}; 