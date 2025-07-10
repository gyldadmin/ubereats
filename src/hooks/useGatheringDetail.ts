import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import type { GatheringCardData, GatheringDisplay, GatheringOther, MentorInfo, UserParticipation } from './useHomeGatherings';

// Extended interface for attendee information
export interface AttendeeInfo {
  id: string;
  user_id: string;
  gathering_id: string;
  part_gath_status?: {
    label: string;
  };
  // User profile information
  user_profile?: {
    full_name: string;
    first: string;
    profpic?: string;
  };
  created_at: string;
}

// Comprehensive gathering detail data structure
export interface GatheringDetailData extends Omit<GatheringCardData, 'userParticipation'> {
  // All attendees for this gathering
  attendees: AttendeeInfo[];
  // Current user's participation (enhanced)
  userParticipation?: AttendeeInfo;
  // Attendee counts by status
  attendeeCounts: {
    yes: number;
    no: number;
    pending: number;
    total: number;
  };
  // Host data (names and photos)
  hostData: Array<{full_name: string, profpic?: string}>;
}

/**
 * Enhanced hook for fetching comprehensive gathering detail data
 * Includes all satellite data, mentor info, complete attendee list, and real-time updates
 */
export const useGatheringDetail = (gatheringId: string) => {
  const [gatheringDetail, setGatheringDetail] = useState<GatheringDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user info from global state
  const { user, userGyld } = useAuthStore();

  // Format date as "FEB 3"
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Validate if an image URL is accessible
  const validateImageUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.log('🚫 Image validation failed for URL:', url);
      return false;
    }
  };

  // Resolve display image with fallback logic
  const resolveDisplayImage = async (
    gatheringDisplay: Partial<GatheringDisplay> | undefined,
    mentorInfo?: MentorInfo,
    experienceTypeImage?: string,
    experienceTypeLabel?: string
  ): Promise<string> => {
    
    const isMentoringGathering = experienceTypeLabel?.toLowerCase() === 'mentoring';
    
    if (isMentoringGathering) {
      // 1. For mentoring: mentor's profpic (highest priority)
      if (mentorInfo?.mentor_satellite?.profpic) {
        const isValid = await validateImageUrl(mentorInfo.mentor_satellite.profpic);
        if (isValid) {
          return mentorInfo.mentor_satellite.profpic;
        }
      }
      
      // 2. gathering_display.image (first backup)
      if (gatheringDisplay?.image) {
        const isValid = await validateImageUrl(gatheringDisplay.image);
        if (isValid) {
          return gatheringDisplay.image;
        }
      }
      
      // 3. experience_type.image (second backup)
      if (experienceTypeImage) {
        const isValid = await validateImageUrl(experienceTypeImage);
        if (isValid) {
          return experienceTypeImage;
        }
      }
    } else {
      // 1. For non-mentoring: gathering_display.image (highest priority)
      if (gatheringDisplay?.image) {
        const isValid = await validateImageUrl(gatheringDisplay.image);
        if (isValid) {
          return gatheringDisplay.image;
        }
      }
      
      // 2. experience_type.image (backup)
      if (experienceTypeImage) {
        const isValid = await validateImageUrl(experienceTypeImage);
        if (isValid) {
          return experienceTypeImage;
        }
      }
    }
    
    // Final fallback
    const defaultImage = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop';
    return defaultImage;
  };

  // Get host data (names and photos) from user IDs
  const getHostData = async (hostIds: string[]): Promise<Array<{full_name: string, profpic?: string}>> => {
    if (!hostIds || hostIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('users_public')
        .select('full_name, profpic')
        .in('user_id', hostIds);
      
      if (error) throw error;
      return data?.filter(user => user.full_name) || [];
    } catch (err) {
      console.error('Error fetching host data:', err);
      return [];
    }
  };

  // Fetch comprehensive gathering detail data
  const fetchGatheringDetail = useCallback(async () => {
    if (!gatheringId || !user) {
      setGatheringDetail(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Main query: Get gathering with all satellite data
      const { data: gatheringData, error: gatheringError } = await supabase
        .from('gatherings')
        .select(`
          *,
          gathering_status!inner(label),
          experience_type(label, image_horizontal),
          gathering_displays!inner(*, learning_topic(label)),
          gathering_other!inner(*)
        `)
        .eq('id', gatheringId)
        .single();

      if (gatheringError) throw gatheringError;
      if (!gatheringData) throw new Error('Gathering not found');

      const gatheringDisplay = gatheringData.gathering_displays || {};
      const gatheringOther = gatheringData.gathering_other || {};
      
      let mentorInfo: MentorInfo | undefined;

      // Get mentor info for mentoring gatherings
      if (gatheringData.experience_type?.label?.toLowerCase() === 'mentoring' && 
          gatheringDisplay?.mentor && gatheringDisplay.mentor.length > 0) {
        
        const mentorId = gatheringDisplay.mentor[0]; // Use first mentor
        const { data: mentorData, error: mentorError } = await supabase
          .from('mentors')
          .select(`
            *,
            mentor_satellites(*),
            employers(name)
          `)
          .eq('id', mentorId)
          .single();

        if (!mentorError && mentorData) {
          mentorInfo = {
            id: mentorData.id,
            user_id: mentorData.user_id,
            employer: mentorData.employer,
            mentor_satellite: mentorData.mentor_satellites,
            employer_info: mentorData.employers
          };
        }
      }

      // Get ALL attendees for this gathering
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('participation_gatherings')
        .select(`
          *,
          part_gath_status(label)
        `)
        .eq('gathering_id', gatheringId)
        .order('created_at', { ascending: true });

      if (attendeesError) throw attendeesError;

      // Get user profile data for all attendees
      let attendees: AttendeeInfo[] = [];
      if (attendeesData && attendeesData.length > 0) {
        const userIds = attendeesData.map(attendee => attendee.user_id);
        
        const { data: userProfiles, error: profilesError } = await supabase
          .from('users_public')
          .select('user_id, full_name, first, profpic')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError);
        }

        // Combine attendee data with user profiles
        attendees = attendeesData.map(attendee => {
          const userProfile = userProfiles?.find(profile => profile.user_id === attendee.user_id);
          return {
            id: attendee.id,
            user_id: attendee.user_id,
            gathering_id: attendee.gathering_id,
            part_gath_status: attendee.part_gath_status,
            user_profile: userProfile ? {
              full_name: userProfile.full_name,
              first: userProfile.first,
              profpic: userProfile.profpic
            } : undefined,
            created_at: attendee.created_at
          };
        });
      }

      // Find current user's participation
      const userParticipation = attendees.find(attendee => attendee.user_id === user.id);

      // Calculate attendee counts
      const attendeeCounts = {
        yes: attendees.filter(a => a.part_gath_status?.label === 'yes').length,
        no: attendees.filter(a => a.part_gath_status?.label === 'no').length,
        pending: attendees.filter(a => a.part_gath_status?.label === 'pending' || !a.part_gath_status).length,
        total: attendees.length
      };

      // Determine user role
      const isHost = gatheringData.host?.includes(user?.id) || false;
      const isScribe = gatheringDisplay?.scribe === user?.id;
      
      let rsvpStatus: 'yes' | 'no' | 'pending' = 'pending';
      if (userParticipation?.part_gath_status?.label === 'yes') {
        rsvpStatus = 'yes';
      } else if (userParticipation?.part_gath_status?.label === 'no') {
        rsvpStatus = 'no';
      }

      // Get host data (names and photos)
      const hostData = await getHostData(gatheringData.host || []);
      const hostNames = hostData.map(host => host.full_name);

      // Use horizontal image from experience type (no fallback logic per plan)
      const displayImage = gatheringData.experience_type?.image_horizontal || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop';

      // Build comprehensive detail data object
      const detailData: GatheringDetailData = {
        gathering: {
          id: gatheringData.id,
          created_at: gatheringData.created_at,
          updated_at: gatheringData.updated_at,
          title: gatheringData.title,
          start_time: gatheringData.start_time,
          end_time: gatheringData.end_time,
          gathering_status: gatheringData.gathering_status,
          experience_type: gatheringData.experience_type,
          gyld: gatheringData.gyld,
          host: gatheringData.host,
          experience: gatheringData.experience
        },
        gatheringDisplay: gatheringDisplay || {},
        gatheringOther: gatheringOther || {},
        mentorInfo,
        attendees,
        userParticipation,
        userRole: {
          isHost,
          isScribe,
          rsvpStatus
        },
        attendeeCounts,
        displayImage,
        formattedDate: gatheringData.start_time ? formatDate(gatheringData.start_time) : '',
        experienceTypeLabel: gatheringData.experience_type?.label || '',
        hostNames,
        hostData
      };

      setGatheringDetail(detailData);

    } catch (err) {
      console.error('Error fetching gathering detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch gathering detail');
    } finally {
      setLoading(false);
    }
  }, [gatheringId, user]);

  // RSVP update function
  const updateRSVP = useCallback(async (status: 'yes' | 'no') => {
    console.log('🚀 updateRSVP called with:', { gatheringId, status, userId: user?.id });
    
    if (!user || !gatheringDetail) {
      console.error('❌ No user or gathering detail found, cannot update RSVP');
      return;
    }

    // Optimistically update UI
    setGatheringDetail(prev => {
      if (!prev) return prev;
      
      const newAttendees = [...prev.attendees];
      const userIndex = newAttendees.findIndex(a => a.user_id === user.id);
      
      if (userIndex !== -1) {
        newAttendees[userIndex] = {
          ...newAttendees[userIndex],
          part_gath_status: { label: status }
        };
      }
      
      // Recalculate counts
      const newCounts = {
        yes: newAttendees.filter(a => a.part_gath_status?.label === 'yes').length,
        no: newAttendees.filter(a => a.part_gath_status?.label === 'no').length,
        pending: newAttendees.filter(a => a.part_gath_status?.label === 'pending' || !a.part_gath_status).length,
        total: newAttendees.length
      };
      
      return {
        ...prev,
        attendees: newAttendees,
        attendeeCounts: newCounts,
        userRole: { ...prev.userRole, rsvpStatus: status },
        userParticipation: userIndex !== -1 ? newAttendees[userIndex] : prev.userParticipation
      };
    });

    try {
      // Get the status ID from part_gath_status table
      const { data: statusData, error: statusError } = await supabase
        .from('part_gath_status')
        .select('id')
        .eq('label', status)
        .single();

      if (statusError) throw statusError;

      // Upsert the participation record
      const { error: upsertError } = await supabase
        .from('participation_gatherings')
        .upsert({
          user_id: user.id,
          gathering_id: gatheringId,
          part_gath_status: statusData.id
        }, {
          onConflict: 'user_id,gathering_id'
        });

      if (upsertError) throw upsertError;

      console.log('✅ RSVP updated successfully');
      
      // Refresh data to ensure consistency
      await fetchGatheringDetail();

    } catch (err) {
      console.error('❌ Error updating RSVP:', err);
      
      // Revert optimistic update on error
      await fetchGatheringDetail();
      
      throw err;
    }
  }, [gatheringId, user, gatheringDetail, fetchGatheringDetail]);

  // Fetch data when gatheringId or user changes
  useEffect(() => {
    fetchGatheringDetail();
  }, [fetchGatheringDetail]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchGatheringDetail();
  }, [fetchGatheringDetail]);

  return {
    gatheringDetail,
    loading,
    error,
    updateRSVP,
    refresh,
    // Convenience getters
    attendees: gatheringDetail?.attendees || [],
    attendeeCounts: gatheringDetail?.attendeeCounts || { yes: 0, no: 0, pending: 0, total: 0 },
    isHost: gatheringDetail?.userRole.isHost || false,
    isScribe: gatheringDetail?.userRole.isScribe || false,
    rsvpStatus: gatheringDetail?.userRole.rsvpStatus || 'pending'
  };
}; 