import { useEffect, useState, useCallback } from 'react';
import { useCurrentGatheringStore } from '../stores/currentGatheringStore';
import { useGatheringDetail } from './useGatheringDetail';
import { useGyldMembers } from './useGyldMembers';
import { useActiveMentors } from './useActiveMentors';
import { useGyldGatherings } from './useGyldGatherings';
import { usePlannedWorkflows } from './usePlannedWorkflows';
import { useAuthStore } from '../stores/authStore';
import { createUnsavedGathering } from '../services/hostDataService';
import type { HostData } from '../types/hostData';

/**
 * Convenience hook that combines all host data for the 6 host screens
 * Handles both existing gatherings and creates new unsaved gatherings
 * Two scenarios:
 * 1. routeParams.gatheringId exists → load existing gathering
 * 2. routeParams.gatheringId is null → create new unsaved gathering
 */
export const useHostData = (routeParams?: any) => {
  const { getGatheringId, setCurrentGathering } = useCurrentGatheringStore();
  const { user, userGyld } = useAuthStore();
  
  // Local state for gathering initialization
  const [gatheringId, setGatheringId] = useState<string | null>(null);
  const [initializationLoading, setInitializationLoading] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Initialize gathering based on route params
  const initializeGathering = useCallback(async () => {
    // Skip if we already have a gathering ID
    if (gatheringId) return;
    
    // Skip if we don't have required auth data
    if (!user?.id || !userGyld) return;

    setInitializationLoading(true);
    setInitializationError(null);

    try {
      if (routeParams?.gatheringId) {
        // Scenario 1: Existing gathering passed from route
        console.log('📥 Loading existing gathering:', routeParams.gatheringId);
        setGatheringId(routeParams.gatheringId);
        setCurrentGathering(routeParams.gatheringId, false);
      } else {
        // Scenario 2: Create new unsaved gathering
        console.log('✨ Creating new unsaved gathering');
        const { data, error } = await createUnsavedGathering(
          userGyld,
          user.id,
          routeParams?.experienceType, // Optional experience_type from route
          routeParams?.mentoring // Optional mentoring mode flag
        );

        if (error) {
          throw error;
        }

        if (data?.gathering_id) {
          console.log('✅ Created new gathering:', data.gathering_id);
          setGatheringId(data.gathering_id);
          setCurrentGathering(data.gathering_id, true);
        }
      }
    } catch (error) {
      console.error('❌ Error initializing gathering:', error);
      setInitializationError(error instanceof Error ? error.message : 'Failed to initialize gathering');
    } finally {
      setInitializationLoading(false);
    }
  }, [routeParams, user?.id, userGyld, gatheringId, setCurrentGathering]);

  // Run initialization on mount and when dependencies change
  useEffect(() => {
    initializeGathering();
  }, [initializeGathering]);

  // Fetch all host data using existing and new hooks
  const gatheringDetail = useGatheringDetail(gatheringId || '');
  const gyldMembers = useGyldMembers();
  const activeMentors = useActiveMentors();
  const gyldGatherings = useGyldGatherings();
  const plannedWorkflows = usePlannedWorkflows(gatheringId);

  // Combined loading state (includes initialization)
  const loading = 
    initializationLoading ||
    gatheringDetail.loading || 
    gyldMembers.loading || 
    activeMentors.loading || 
    gyldGatherings.loading || 
    plannedWorkflows.loading;

  // Combined error state (includes initialization)
  const error = 
    initializationError ||
    gatheringDetail.error || 
    gyldMembers.error || 
    activeMentors.error || 
    gyldGatherings.error || 
    plannedWorkflows.error;

  // Combined refresh function
  const refresh = () => {
    if (gatheringId) {
      gatheringDetail.refresh();
    }
    gyldMembers.refresh();
    activeMentors.refresh();
    gyldGatherings.refresh();
    plannedWorkflows.refresh();
  };

  // Convenience function for setup screens to save data
  // Handles satellite creation and status promotion automatically
  const saveGatheringData = useCallback(async (
    saveFunction: () => Promise<any>,
    requiresSatellites: boolean = false
  ) => {
    if (!gatheringId) {
      throw new Error('No gathering ID available for saving');
    }

    try {
      // Create satellites if needed and not already created
      if (requiresSatellites) {
        const { createGatheringSatellites } = await import('../services/hostDataService');
        await createGatheringSatellites(gatheringId);
      }

      // Execute the actual save function
      const result = await saveFunction();

      // Promote from unsaved status (only happens once)
      const { promoteGatheringFromUnsaved } = await import('../services/hostDataService');
      await promoteGatheringFromUnsaved(gatheringId);

      // Refresh gathering data to reflect changes
      if (gatheringDetail.refresh) {
        gatheringDetail.refresh();
      }

      return result;
    } catch (error) {
      console.error('Error in saveGatheringData:', error);
      throw error;
    }
  }, [gatheringId, gatheringDetail.refresh]);

  // Return combined host data
  const hostData: HostData = {
    gatheringDetail: gatheringDetail.gatheringDetail,
    gyldMembers: gyldMembers.members,
    activeMentors: activeMentors.mentors,
    gyldGatherings: gyldGatherings.gatherings,
    plannedWorkflows: plannedWorkflows.workflows,
  };

  // Mentoring mode is driven by route params
  const mentoring = routeParams?.mentoring || false;

  return {
    // Individual data sets
    gatheringDetail: gatheringDetail.gatheringDetail,
    gyldMembers: gyldMembers.members,
    activeMentors: activeMentors.mentors,
    gyldGatherings: gyldGatherings.gatherings,
    plannedWorkflows: plannedWorkflows.workflows,
    
    // Combined data
    hostData,
    
    // States
    loading,
    error,
    gatheringId,
    initializationLoading,
    initializationError,
    
    // Actions
    refresh,
    saveGatheringData, // Convenience function for setup screens
    
    // Mentoring mode flag
    mentoring, // Boolean indicating if this is a mentoring gathering without a start_time
  };
}; 