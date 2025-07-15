import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

// Interface for gyld member data (simplified - only users_public data)
export interface GyldMember {
  // From users_public - all we need for host selection
  user_id: string;
  candidate?: string;
  employer?: string;
  gyld?: string;
  nomination?: string;
  first?: string;
  last?: string;
  full_name?: string;
  title?: string;
  profpic?: string;
  list?: string;
  
  // Users_internal fields - kept for backwards compatibility but not used
  neighborhood?: string;
  start_field?: string;
  proflink?: string;
  activity_type?: string[];
  knowledge_domain?: string[];
  role_interest?: string[];
  notification_preferences?: any;
  user_status?: string;
}

/**
 * Hook for fetching gyld members
 * Simplified: Only uses users_public data since that's all we need for host selection
 */
export const useGyldMembers = () => {
  const [members, setMembers] = useState<GyldMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user's gyld from global state
  const { userGyld } = useAuthStore();

  const fetchMembers = useCallback(async () => {
    // Don't fetch if user doesn't have a gyld
    if (!userGyld) {
      console.log('❌ No userGyld found, returning empty members array');
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simple query: just get all users in the same gyld from users_public
      // No need to join with users_internal for host selection
      console.log('🔍 Querying users_public with gyld:', userGyld);
      const { data: publicUsers, error: publicError } = await supabase
        .from('users_public')
        .select('*')
        .eq('gyld', userGyld)
        .order('full_name', { ascending: true });

      console.log('📊 users_public query result:');
      console.log('- publicUsers count:', publicUsers?.length || 0);
      console.log('- publicError:', publicError);

      if (publicError) {
        throw publicError;
      }

      if (!publicUsers || publicUsers.length === 0) {
        console.log('❌ No public users found in gyld, returning empty array');
        setMembers([]);
        return;
      }

      // Transform data - no need for complex joins, just use public data
      const transformedData: GyldMember[] = publicUsers.map(user => ({
        // Users_public fields - all we need for host selection
        user_id: user.user_id,
        candidate: user.candidate,
        employer: user.employer,
        gyld: user.gyld,
        nomination: user.nomination,
        first: user.first,
        last: user.last,
        full_name: user.full_name,
        title: user.title,
        profpic: user.profpic,
        list: user.list,
        
        // Users_internal fields - not needed for host selection, set to undefined
        neighborhood: undefined,
        start_field: undefined,
        proflink: undefined,
        activity_type: undefined,
        knowledge_domain: undefined,
        role_interest: undefined,
        notification_preferences: undefined,
        user_status: undefined, // Not needed for host selection
      }));

      console.log('🎯 Final transformedData:');
      console.log('- transformedData count:', transformedData.length);
      console.log('- transformedData sample:', transformedData.slice(0, 2));
      console.log('✅ Setting members in useGyldMembers');

      setMembers(transformedData);

    } catch (err) {
      console.error('Error fetching gyld members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch gyld members');
    } finally {
      setLoading(false);
    }
  }, [userGyld]);

  // Fetch members when userGyld changes
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refresh,
  };
}; 