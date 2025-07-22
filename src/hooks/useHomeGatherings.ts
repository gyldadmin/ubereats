import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

// Enhanced interfaces for comprehensive gathering data
export interface GatheringDisplay {
  id: string;
  gathering_id: string;
  address?: string;
  image?: string;
  description?: string;
  scribe?: string;
  meeting_link?: string;
  location_instructions?: string;
  mentor?: string[];
  learning_topic?: {
    label: string;
  };
}

export interface GatheringOther {
  id: string;
  gathering: string;
  cap?: number | null;
  payment_amount?: number | null;
  payment_for?: string | null;
  payment_to_member?: boolean;
  payment_venmo?: string | null;
  potluck?: boolean;
  recruitment?: boolean;
  signup_question?: string;
  remote?: boolean;
  location_tbd?: boolean;
  description_tbd?: boolean;
  host_message?: string;
  host_subject?: string;
  hold_autoreminders?: boolean;
  plus_guests?: number;
}

export interface MentorInfo {
  id: string;
  user_id: string;
  employer?: string;
  mentor_satellite?: {
    full_name: string;
    profpic?: string;
    title?: string;
    bio?: string;
  };
  employer_info?: {
    name?: string;
  };
}

export interface UserParticipation {
  id: string;
  user_id: string;
  gathering_id: string;
  part_gath_status?: {
    label: string;
  };
}

export interface GatheringWithJoins {
  id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  gathering_status?: {
    label: string;
  };
  experience_type?: {
    label: string;
    image_square?: string;
  };
  gyld?: string[];
  host?: string[];
  experience?: string[];
}

// Comprehensive data structure for each gathering card
export interface GatheringCardData {
  // Core gathering data
  gathering: GatheringWithJoins;
  gatheringDisplay: Partial<GatheringDisplay>;
  gatheringOther: Partial<GatheringOther>;
  
  // Mentor information (for mentoring gatherings)
  mentorInfo?: MentorInfo;
  
  // User's participation and role information
  userParticipation?: UserParticipation;
  userRole: {
    isHost: boolean;
    isScribe: boolean;
    rsvpStatus: 'yes' | 'no' | 'pending';
  };
  
  // Pre-computed display values
  displayImage: string;
  formattedDate: string;
  experienceTypeLabel: string;
  hostNames: string[];
}

/**
 * Enhanced hook for fetching comprehensive home page gathering data
 * Includes all satellite tables, mentor info, participation status, and user roles
 */
export const useHomeGatherings = () => {
  const [gatherings, setGatherings] = useState<GatheringCardData[]>([]);
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

  // Resolve display image with fallback logic based on gathering type
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
        console.log('⚠️ Mentor profpic failed validation, falling back to gathering image');
      }
      
      // 2. gathering_display.image (first backup)
      if (gatheringDisplay?.image) {
        const isValid = await validateImageUrl(gatheringDisplay.image);
        if (isValid) {
          return gatheringDisplay.image;
        }
        console.log('⚠️ Gathering image failed validation, falling back to experience type image');
      }
      
      // 3. experience_type.image (second backup)
      if (experienceTypeImage) {
        const isValid = await validateImageUrl(experienceTypeImage);
        if (isValid) {
          return experienceTypeImage;
        }
        console.log('⚠️ Experience type image failed validation, using default');
      }
    } else {
      // 1. For non-mentoring: gathering_display.image (highest priority)
      if (gatheringDisplay?.image) {
        const isValid = await validateImageUrl(gatheringDisplay.image);
        if (isValid) {
          return gatheringDisplay.image;
        }
        console.log('⚠️ Gathering image failed validation, falling back to experience type image');
      }
      
      // 2. experience_type.image (backup)
      if (experienceTypeImage) {
        const isValid = await validateImageUrl(experienceTypeImage);
        if (isValid) {
          return experienceTypeImage;
        }
        console.log('⚠️ Experience type image failed validation, using default');
      }
    }
    
    // Final fallback for both types
    const defaultImage = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop';
    return defaultImage;
  };

  // Get host names from user IDs
  const getHostNames = async (hostIds: string[]): Promise<string[]> => {
    if (!hostIds || hostIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('users_public')
        .select('full_name')
        .in('user_id', hostIds);
      
      if (error) throw error;
      return data?.map(user => user.full_name).filter(Boolean) || [];
    } catch (err) {
      console.error('Error fetching host names:', err);
      return [];
    }
  };

  const fetchGatherings = useCallback(async () => {
    // Don't fetch if user doesn't have a gyld
    if (!userGyld || !user) {
      setGatherings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Main query: Get gatherings with joins to status, experience_type, displays, and other
      const { data: gatheringsData, error: gatheringsError } = await supabase
        .from('gatherings')
        .select(`
          *,
          gathering_status!inner(label),
          experience_type(label, image_square),
          gathering_displays!inner(*),
          gathering_other!inner(*)
        `)
        .contains('gyld', [userGyld])
        .eq('gathering_status.label', 'launched')
        .gt('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });



      if (gatheringsError) throw gatheringsError;

      if (!gatheringsData || gatheringsData.length === 0) {
        setGatherings([]);
        return;
      }

      // Process each gathering to build comprehensive data
      const processedGatherings: GatheringCardData[] = await Promise.all(
        gatheringsData.map(async (gathering) => {
          const gatheringDisplay = gathering.gathering_displays || {};
          const gatheringOther = gathering.gathering_other || {};
          
          let mentorInfo: MentorInfo | undefined;

          // Get mentor info for mentoring gatherings
          if (gathering.experience_type?.label?.toLowerCase() === 'mentoring' && 
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
                employer_info: mentorData.employers // This should be the employers object: { name: "Company Name" }
              };
            } else if (mentorError) {
              console.error('❌ Error fetching mentor data:', mentorError);
            }
          }

          // Get user's participation status
          let userParticipation: UserParticipation | undefined;
          if (user) {
            const { data: participationData, error: participationError } = await supabase
              .from('participation_gatherings')
              .select(`
                *,
                part_gath_status(label)
              `)
              .eq('user_id', user.id)
              .eq('gathering_id', gathering.id)
              .maybeSingle();

            if (!participationError && participationData) {
              userParticipation = participationData;
            }
          }

          // Determine user role
          const isHost = gathering.host?.includes(user?.id) || false;
          const isScribe = gatheringDisplay?.scribe === user?.id;
          
          let rsvpStatus: 'yes' | 'no' | 'pending' = 'pending';
          if (userParticipation?.part_gath_status?.label === 'yes') {
            rsvpStatus = 'yes';
          } else if (userParticipation?.part_gath_status?.label === 'no') {
            rsvpStatus = 'no';
          }

          // Get host names
          const hostNames = await getHostNames(gathering.host || []);

          // Resolve display image with validation
          const displayImage = await resolveDisplayImage(
            gatheringDisplay || {},
            mentorInfo,
            gathering.experience_type?.image_square,
            gathering.experience_type?.label
          );

          // Build comprehensive data object
          const cardData: GatheringCardData = {
            gathering: {
              id: gathering.id,
              created_at: gathering.created_at,
              updated_at: gathering.updated_at,
              title: gathering.title,
              start_time: gathering.start_time,
              end_time: gathering.end_time,
              gathering_status: gathering.gathering_status,
              experience_type: gathering.experience_type,
              gyld: gathering.gyld,
              host: gathering.host,
              experience: gathering.experience
            },
            gatheringDisplay: gatheringDisplay || {},
            gatheringOther: gatheringOther || {},
            mentorInfo,
            userParticipation,
            userRole: {
              isHost,
              isScribe,
              rsvpStatus
            },
            displayImage,
            formattedDate: gathering.start_time ? formatDate(gathering.start_time) : '',
            experienceTypeLabel: gathering.experience_type?.label || '',
            hostNames
          };

          return cardData;
        })
      );

      setGatherings(processedGatherings);

    } catch (err) {
      console.error('Error fetching home gatherings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch gatherings');
    } finally {
      setLoading(false);
    }
  }, [userGyld, user]);

  // Fetch gatherings when userGyld or user changes
  useEffect(() => {
    fetchGatherings();
  }, [fetchGatherings]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchGatherings();
  }, [fetchGatherings]);

  // Comprehensive RSVP update function with proper upsert logic
  const updateRSVP = useCallback(async (gatheringId: string, status: 'yes' | 'no') => {
    console.log('🚀 updateRSVP called with:', { gatheringId, status, userId: user?.id });
    
    if (!user) {
      console.error('❌ No user found, cannot update RSVP');
      return;
    }

    // Optimistically update UI
    setGatherings(prev => prev.map(gathering => 
      gathering.gathering.id === gatheringId 
        ? { ...gathering, userRole: { ...gathering.userRole, rsvpStatus: status } }
        : gathering
    ));

    try {
      console.log('🔍 Step 1: Getting status ID for:', status);
      
      // Get the status ID from part_gath_status table
      const { data: statusData, error: statusError } = await supabase
        .from('part_gath_status')
        .select('id')
        .eq('label', status)
        .single();

      if (statusError) {
        console.error('❌ Error getting status ID:', statusError);
        throw statusError;
      }

      console.log('✅ Status ID found:', statusData.id);
      console.log('🔍 Step 2: Checking for existing participation record');

      // Check if participation record already exists
      const { data: existingRecord, error: existingError } = await supabase
        .from('participation_gatherings')
        .select('id, part_gath_status')
        .eq('user_id', user.id)
        .eq('gathering_id', gatheringId)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Error checking existing record:', existingError);
        throw existingError;
      }

      console.log('📋 Existing record:', existingRecord);

      if (existingRecord) {
        console.log('🔍 Step 3: Updating existing record');
        
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('participation_gatherings')
          .update({ part_gath_status: statusData.id })
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          fetchGatherings(); // Revert UI changes
          throw updateError;
        }

        console.log('✅ Record updated successfully:', updateData);
      } else {
        console.log('🔍 Step 3: Creating new record');
        
        // Create new record
        const { data: insertData, error: insertError } = await supabase
          .from('participation_gatherings')
          .insert({
            user_id: user.id,
            gathering_id: gatheringId,
            part_gath_status: statusData.id
          });

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          fetchGatherings(); // Revert UI changes
          throw insertError;
        }

        console.log('✅ Record created successfully:', insertData);
      }
      
    } catch (err) {
      console.error('❌ Error updating RSVP:', err);
      // Revert UI changes on error
      fetchGatherings();
    }
  }, [user, fetchGatherings]);

  return {
    gatherings,
    loading,
    error,
    refresh,
    updateRSVP
  };
}; 