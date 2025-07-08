import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

// Interface for gyld member data (combining users_public and users_internal)
export interface GyldMember {
  // From users_public
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
  user_status?: string;
  
  // From users_internal
  neighborhood?: string;
  start_field?: string;
  proflink?: string;
  activity_type?: string[];
  knowledge_domain?: string[];
  role_interest?: string[];
  notification_preferences?: any;
  
  // From user_status join
  user_status_label?: string;
}

/**
 * Hook for fetching gyld members
 * Query: "Search for users where users_public.gyld = current_user.users_public.gyld 
 * AND users_public.user_status = 'member'"
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
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query users_public with joins to users_internal and user_status
      const { data, error: supabaseError } = await supabase
        .from('users_public')
        .select(`
          *,
          users_internal (
            neighborhood,
            start_field,
            proflink,
            activity_type,
            knowledge_domain,
            role_interest,
            notification_preferences
          ),
          user_status!inner(
            label
          )
        `)
        .eq('gyld', userGyld)                        // users_public.gyld = current_user.gyld
        .eq('user_status.label', 'member')           // user_status = 'member' (join + filter)
        .order('full_name', { ascending: true });    // Order by full name

      if (supabaseError) {
        throw supabaseError;
      }

      // Transform data to flatten the joined objects
      const transformedData: GyldMember[] = (data || []).map(user => ({
        // Users_public fields
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
        user_status: user.user_status,
        
        // Users_internal fields (flattened)
        neighborhood: user.users_internal?.neighborhood,
        start_field: user.users_internal?.start_field,
        proflink: user.users_internal?.proflink,
        activity_type: user.users_internal?.activity_type,
        knowledge_domain: user.users_internal?.knowledge_domain,
        role_interest: user.users_internal?.role_interest,
        notification_preferences: user.users_internal?.notification_preferences,
        
        // User_status label
        user_status_label: user.user_status?.label,
      }));

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