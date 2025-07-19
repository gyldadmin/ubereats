import { supabase } from './supabase';
import type { 
  ActiveMentor, 
  PlannedWorkflow, 
  GyldGathering 
} from '../types/hostData';

/**
 * Creates a new gathering with "unsaved" status for draft editing
 * Sets reasonable defaults and handles optional experience_type
 * If mentoring=true, automatically sets experience_type to "Mentoring"
 */
export async function createUnsavedGathering(
  userGyld: string,
  userId: string,
  experienceType?: string,
  mentoring?: boolean
): Promise<{ data: any | null; error: any }> {
  try {
    // Get the "unsaved" status ID
    const { data: statusData, error: statusError } = await supabase
      .from('gathering_status')
      .select('id')
      .eq('label', 'unsaved')
      .single();

    if (statusError) {
      console.error('Error fetching unsaved status:', statusError);
      return { data: null, error: statusError };
    }

    // If mentoring mode is requested, look up the Mentoring experience type ID
    let mentoringExperienceTypeId = null;
    if (mentoring) {
      const { data: mentoringData, error: mentoringError } = await supabase
        .from('experience_type')
        .select('id')
        .eq('label', 'Mentoring')
        .single();

      if (mentoringError) {
        console.error('Error fetching Mentoring experience type:', mentoringError);
        return { data: null, error: mentoringError };
      }

      mentoringExperienceTypeId = mentoringData.id;
    }

    // Prepare gathering data with defaults
    const gatheringData: any = {
      title: null, // User will set this
      gathering_status: statusData.id,
      gyld: [userGyld], // Array with current user's gyld
      host: [userId], // Array with current user as host
      start_time: null, // User will set this
      end_time: null, // User will set this
    };

    // Add experience_type - prioritize mentoring mode, then provided experienceType
    if (mentoringExperienceTypeId) {
      gatheringData.experience_type = mentoringExperienceTypeId;
    } else if (experienceType) {
      gatheringData.experience_type = experienceType;
    }

    // Create the gathering record
    const { data: gatheringResult, error: gatheringError } = await supabase
      .from('gatherings')
      .insert(gatheringData)
      .select('id')
      .single();

    if (gatheringError) {
      console.error('Error creating unsaved gathering:', gatheringError);
      return { data: null, error: gatheringError };
    }

    const gatheringId = gatheringResult.id;

    // Create gathering_displays satellite record
    const { error: displayError } = await supabase
      .from('gathering_displays')
      .insert({
        gathering_id: gatheringId  // gathering_displays uses 'gathering_id'
      });

    if (displayError) {
      console.error('Error creating gathering_displays record:', displayError);
      // Clean up the gathering record if satellite creation fails
      await supabase.from('gatherings').delete().eq('id', gatheringId);
      return { data: null, error: displayError };
    }

    // Create gathering_other satellite record
    const { error: otherError } = await supabase
      .from('gathering_other')
      .insert({
        gathering: gatheringId  // gathering_other uses 'gathering' (not 'gathering_id')
      });

    if (otherError) {
      console.error('Error creating gathering_other record:', otherError);
      // Clean up both gathering and gathering_displays if this fails
      await supabase.from('gathering_displays').delete().eq('gathering_id', gatheringId);
      await supabase.from('gatherings').delete().eq('id', gatheringId);
      return { data: null, error: otherError };
    }

    console.log('✅ Created unsaved gathering with satellites:', gatheringId);
    return { data: { gathering_id: gatheringId }, error: null };

  } catch (error) {
    console.error('Error in createUnsavedGathering:', error);
    return { data: null, error };
  }
}

/**
 * Creates satellite records (gathering_displays and gathering_other) for a gathering
 * Called lazily when user first saves data that requires these tables
 */
export async function createGatheringSatellites(
  gatheringId: string
): Promise<{ data: any | null; error: any }> {
  try {
    // Check if gathering_displays already exists
    const { data: existingDisplay } = await supabase
      .from('gathering_displays')
      .select('id')
      .eq('gathering_id', gatheringId)
      .maybeSingle();

    // Check if gathering_other already exists
    const { data: existingOther } = await supabase
      .from('gathering_other')
      .select('id')
      .eq('gathering_id', gatheringId)
      .maybeSingle();

    const promises = [];

    // Create gathering_displays if it doesn't exist
    if (!existingDisplay) {
      promises.push(
        supabase
          .from('gathering_displays')
          .insert({ gathering_id: gatheringId })
      );
    }

    // Create gathering_other if it doesn't exist
    if (!existingOther) {
      promises.push(
        supabase
          .from('gathering_other')
          .insert({ gathering_id: gatheringId })
      );
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      
      // Check for errors in any of the satellite creations
      for (const result of results) {
        if (result.error) {
          console.error('Error creating gathering satellites:', result.error);
          return { data: null, error: result.error };
        }
      }
      
      console.log('✅ Created gathering satellites for:', gatheringId);
    }

    return { data: { satellites_created: promises.length }, error: null };

  } catch (error) {
    console.error('Error in createGatheringSatellites:', error);
    return { data: null, error };
  }
}

/**
 * Updates gathering status from "unsaved" to "pre-launch" on first save
 * Called when user saves any meaningful data
 */
export async function promoteGatheringFromUnsaved(
  gatheringId: string
): Promise<{ data: any | null; error: any }> {
  try {
    // Get current gathering status
    const { data: currentGathering, error: currentError } = await supabase
      .from('gatherings')
      .select(`
        id,
        gathering_status!inner(label)
      `)
      .eq('id', gatheringId)
      .single();

    if (currentError) {
      console.error('Error fetching current gathering status:', currentError);
      return { data: null, error: currentError };
    }

    // Only update if currently "unsaved"
    if (currentGathering.gathering_status.label === 'unsaved') {
      // Get "pre-launch" status ID
      const { data: preLaunchStatus, error: statusError } = await supabase
        .from('gathering_status')
        .select('id')
        .eq('label', 'pre-launch')
        .single();

      if (statusError) {
        console.error('Error fetching pre-launch status:', statusError);
        return { data: null, error: statusError };
      }

      // Update gathering status
      const { data: updateResult, error: updateError } = await supabase
        .from('gatherings')
        .update({ gathering_status: preLaunchStatus.id })
        .eq('id', gatheringId)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error promoting gathering from unsaved:', updateError);
        return { data: null, error: updateError };
      }

      console.log('✅ Promoted gathering from unsaved to pre-launch:', gatheringId);
      return { data: { status_updated: true }, error: null };
    }

    // Already promoted or different status
    return { data: { status_updated: false }, error: null };

  } catch (error) {
    console.error('Error in promoteGatheringFromUnsaved:', error);
    return { data: null, error };
  }
}

/**
 * Fetches active mentors for the current user's gyld
 * Query: Mentors with status='Mentor', approval='Accepted', not expired,
 * and either same gyld or matching metro/gyld_type
 */
export async function fetchActiveMentors(
  userGyld: string,
  gyldMetro: string[] | null,
  gyldType: string[] | null
): Promise<{ data: ActiveMentor[] | null; error: any }> {
  try {
    // Build the filter conditions step by step for better debugging
    let query = supabase
      .from('mentors')
      .select(`
        *,
        mentor_status(label),
        mentor_approval(label),
        mentor_satellites(
          full_name,
          profpic,
          bio,
          title
        )
      `)
      .eq('mentor_status.label', 'Mentor')
      .eq('mentor_approval.label', 'Accepted')
      .or(`approval_expires_at.is.null,approval_expires_at.gt.${new Date().toISOString()}`);

    // Add gyld matching conditions
    // Condition 1: Same gyld (array contains the userGyld)
    // Condition 2: Overlapping metro AND overlapping gyld_type (array comparisons)
    const conditions = [`gyld.cs.{${userGyld}}`];
    
    // Only add array overlap conditions if we have the arrays
    if (gyldMetro && gyldMetro.length > 0 && gyldType && gyldType.length > 0) {
      // For array overlap, we need to check if mentor's arrays overlap with gyld's arrays
      const metroOverlap = `metro.ov.{${gyldMetro.join(',')}}`;
      const typeOverlap = `gyld_type.ov.{${gyldType.join(',')}}`;
      conditions.push(`and(${metroOverlap},${typeOverlap})`);
    }
    
    query = query.or(conditions.join(','));

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching active mentors:', error);
      return { data: null, error };
    }

    // Transform data to match ActiveMentor interface
    const transformedData: ActiveMentor[] = (data || []).map(mentor => ({
      id: mentor.id,
      user_id: mentor.user_id,
      mentor_status_label: mentor.mentor_status?.label,
      mentor_approval_label: mentor.mentor_approval?.label,
      approval_expires_at: mentor.approval_expires_at,
      gyld: mentor.gyld,
      metro: mentor.metro,
      gyld_type: mentor.gyld_type,
      // Mentor display data (from mentor_satellites only)
      full_name: mentor.mentor_satellites?.full_name,
      profpic: mentor.mentor_satellites?.profpic,
      title: mentor.mentor_satellites?.title,
      bio: mentor.mentor_satellites?.bio,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error in fetchActiveMentors:', error);
    return { data: null, error };
  }
}

/**
 * Fetches gatherings for the current user's gyld from 6 months ago to future
 */
export async function fetchGyldGatherings(
  userGyld: string
): Promise<{ data: GyldGathering[] | null; error: any }> {
  try {
    // Calculate 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Query gatherings with all necessary joins
    const { data, error } = await supabase
      .from('gatherings')
      .select(`
        *,
        gathering_status:gathering_status(label),
        experience_type:experience_type(label, image_square),
        gathering_displays(*),
        gathering_other(*)
      `)
      .contains('gyld', [userGyld])
      .gte('start_time', sixMonthsAgo.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching gyld gatherings:', error);
      return { data: null, error };
    }

    // Transform data to match GyldGathering interface
    const transformedData: GyldGathering[] = (data || []).map(gathering => ({
      id: gathering.id,
      created_at: gathering.created_at,
      updated_at: gathering.updated_at,
      title: gathering.title,
      start_time: gathering.start_time,
      end_time: gathering.end_time,
      gyld: gathering.gyld,
      host: gathering.host,
      // Status and type
      gathering_status_label: gathering.gathering_status?.label,
      experience_type_label: gathering.experience_type?.label,
      experience_type_image: gathering.experience_type?.image_square,
      // Display data
      gatheringDisplay: gathering.gathering_displays?.[0] || null,
      gatheringOther: gathering.gathering_other?.[0] || null,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error in fetchGyldGatherings:', error);
    return { data: null, error };
  }
}

/**
 * Fetches planned workflows for a specific gathering
 */
export async function fetchPlannedWorkflows(
  gatheringId: string
): Promise<{ data: PlannedWorkflow[] | null; error: any }> {
  try {
    // Query planned workflows with type information
    const { data, error } = await supabase
      .from('planned_workflows')
      .select(`
        *,
        planned_workflow_type:planned_workflow_types(label)
      `)
      .eq('gathering_id', gatheringId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching planned workflows:', error);
      return { data: null, error };
    }

    // Transform data to match PlannedWorkflow interface
    const transformedData: PlannedWorkflow[] = (data || []).map(workflow => ({
      id: workflow.id,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      user_id: workflow.user_id,
      workflow_id: workflow.workflow_id,
      planned_workflow_type: workflow.planned_workflow_type,
      gathering_id: workflow.gathering_id,
      workflow_type_label: workflow.planned_workflow_type?.label,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error in fetchPlannedWorkflows:', error);
    return { data: null, error };
  }
}

/**
 * Creates a new gathering with minimum required fields
 */
export async function createNewGathering(
  userId: string,
  userGyld: string
): Promise<{ data: any | null; error: any }> {
  try {
    // Create new gathering with minimum required fields
    const { data, error } = await supabase
      .from('gatherings')
      .insert({
        gyld: [userGyld],
        host: [userId],
        title: 'New Gathering',
        // Add other required fields as needed
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating new gathering:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createNewGathering:', error);
    return { data: null, error };
  }
} 