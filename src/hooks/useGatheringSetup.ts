import { useState, useMemo } from 'react';
import { 
  GatheringSetupState, 
  SetupItemState, 
  SetupItemStatus, 
  SetupItemKey 
} from '../types/gatheringSetup';

// Import the GatheringDetailData type
import { GatheringDetailData } from './useGatheringDetail';

/**
 * Main hook for managing gathering setup state across all setup items
 * Handles individual setup item states and determines launch readiness
 */
export const useGatheringSetup = (gatheringId?: string, gatheringDetail?: GatheringDetailData) => {
  
  // Calculate gathering type status based on experience_type data
  const calculateGatheringTypeStatus = (): SetupItemStatus => {
    // Check if experience_type exists and is not empty
    if (gatheringDetail?.gathering?.experience_type) {
      return SetupItemStatus.COMPLETE;
    } else {
      return SetupItemStatus.INCOMPLETE;
    }
  };

  // Calculate title and hosts status based on title and host data
  const calculateTitleAndHostsStatus = (): SetupItemStatus => {
    const title = gatheringDetail?.gathering?.title;
    const hosts = gatheringDetail?.gathering?.host;
    
    // Check if title exists and is not empty, and hosts array has at least one item
    if (title && title.trim() !== '' && hosts && hosts.length > 0 && hosts[0]) {
      return SetupItemStatus.COMPLETE;
    } else {
      return SetupItemStatus.INCOMPLETE;
    }
  };

  // Calculate dateTime status based on gathering data
  const calculateDateTimeStatus = (): SetupItemStatus => {
    if (!gatheringDetail?.gathering?.start_time) {
      return SetupItemStatus.INCOMPLETE;
    }
    return SetupItemStatus.COMPLETE;
  };

  // Calculate location status based on complex business rules
  const calculateLocationStatus = (): SetupItemStatus => {
    const remote = gatheringDetail?.gatheringOther?.remote;
    const address = gatheringDetail?.gatheringDisplay?.address;
    const meetingLink = gatheringDetail?.gatheringDisplay?.meeting_link;
    const locationTbd = gatheringDetail?.gatheringOther?.location_tbd;

    if (remote === false) {
      // In-person gathering logic
      if (address && address.trim() !== '') {
        return SetupItemStatus.COMPLETE;
      } else if (locationTbd === true) {
        return SetupItemStatus.COMPLETE_TBD;
      } else {
        return SetupItemStatus.INCOMPLETE;
      }
    } else if (remote === true) {
      // Remote gathering logic
      if (meetingLink && meetingLink.trim() !== '') {
        return SetupItemStatus.COMPLETE;
      } else {
        return SetupItemStatus.INCOMPLETE;
      }
    }

    // Default case (if remote is undefined/null)
    return SetupItemStatus.INCOMPLETE;
  };

  // Calculate mentor status based on experience type and mentor data
  const calculateMentorStatus = (): SetupItemStatus => {
    // Return INCOMPLETE during loading to prevent flickering
    if (!gatheringDetail) {
      return SetupItemStatus.INCOMPLETE;
    }
    
    // Only calculate mentor status for Mentoring experience types
    if (gatheringDetail.gathering?.experience_type?.label !== 'Mentoring') {
      // For non-mentoring gatherings, mentor is not applicable (considered complete)
      return SetupItemStatus.COMPLETE;
    }

    // For Mentoring gatherings, check if mentor array exists and is not empty
    const mentors = gatheringDetail.gatheringDisplay?.mentor;
    if (mentors && mentors.length > 0) {
      return SetupItemStatus.COMPLETE;
    } else {
      return SetupItemStatus.INCOMPLETE;
    }
  };

  // Calculate description status based on description data
  const calculateDescriptionStatus = (): SetupItemStatus => {
    // Check if description exists and is not empty
    const description = gatheringDetail?.gatheringDisplay?.description;
    if (description && description.trim() !== '') {
      return SetupItemStatus.COMPLETE;
    } else {
      return SetupItemStatus.INCOMPLETE;
    }
  };

  const [setupState, setSetupState] = useState<GatheringSetupState>({
    gatheringType: { status: calculateGatheringTypeStatus() }, // Dynamic calculation
    titleAndHosts: { status: calculateTitleAndHostsStatus() }, // Dynamic calculation
    dateTime: { status: calculateDateTimeStatus() }, // Dynamic calculation
    location: { status: calculateLocationStatus() }, // Dynamic calculation
    mentor: { status: calculateMentorStatus() }, // Dynamic calculation
    description: { status: calculateDescriptionStatus() }, // Dynamic calculation
  });
  
  // Update gathering type status whenever gatheringDetail changes
  const currentGatheringTypeStatus = useMemo(() => {
    return calculateGatheringTypeStatus();
  }, [gatheringDetail?.gathering?.experience_type]);

  // Update title and hosts status whenever relevant gathering data changes
  const currentTitleAndHostsStatus = useMemo(() => {
    return calculateTitleAndHostsStatus();
  }, [gatheringDetail?.gathering?.title, gatheringDetail?.gathering?.host]);

  // Update dateTime status whenever gatheringDetail changes
  const currentDateTimeStatus = useMemo(() => {
    return calculateDateTimeStatus();
  }, [gatheringDetail?.gathering?.start_time]);

  // Update location status whenever relevant gathering data changes
  const currentLocationStatus = useMemo(() => {
    return calculateLocationStatus();
  }, [
    gatheringDetail?.gatheringOther?.remote,
    gatheringDetail?.gatheringDisplay?.address,
    gatheringDetail?.gatheringDisplay?.meeting_link,
    gatheringDetail?.gatheringOther?.location_tbd
  ]);
  
  // Update mentor status whenever relevant gathering data changes
  const currentMentorStatus = useMemo(() => {
    return calculateMentorStatus();
  }, [
    gatheringDetail?.gathering?.experience_type?.label,
    gatheringDetail?.gatheringDisplay?.mentor
  ]);
  
  // Update description status whenever relevant gathering data changes
  const currentDescriptionStatus = useMemo(() => {
    return calculateDescriptionStatus();
  }, [gatheringDetail?.gatheringDisplay?.description]);
  
  // Update setupState when gathering type status changes
  useMemo(() => {
    setSetupState(prev => ({
      ...prev,
      gatheringType: { status: currentGatheringTypeStatus }
    }));
  }, [currentGatheringTypeStatus]);

  // Update setupState when title and hosts status changes
  useMemo(() => {
    setSetupState(prev => ({
      ...prev,
      titleAndHosts: { status: currentTitleAndHostsStatus }
    }));
  }, [currentTitleAndHostsStatus]);

  // Update setupState when dateTime status changes
  useMemo(() => {
    setSetupState(prev => ({
      ...prev,
      dateTime: { status: currentDateTimeStatus }
    }));
  }, [currentDateTimeStatus]);

  // Update setupState when location status changes
  useMemo(() => {
    setSetupState(prev => ({
      ...prev,
      location: { status: currentLocationStatus }
    }));
  }, [currentLocationStatus]);

  // Update setupState when mentor status changes
  useMemo(() => {
    setSetupState(prev => ({
      ...prev,
      mentor: { status: currentMentorStatus }
    }));
  }, [currentMentorStatus]);

  // Update setupState when description status changes
  useMemo(() => {
    setSetupState(prev => ({
      ...prev,
      description: { status: currentDescriptionStatus }
    }));
  }, [currentDescriptionStatus]);
  
  // Update individual setup item status and data
  const updateSetupItem = (
    itemKey: SetupItemKey, 
    status: SetupItemStatus, 
    data?: any
  ) => {
    setSetupState(prev => ({
      ...prev,
      [itemKey]: { status, data }
    }));
  };
  
  // Mark a setup item as complete with data
  const completeSetupItem = (itemKey: SetupItemKey, data: any) => {
    updateSetupItem(itemKey, SetupItemStatus.COMPLETE, data);
  };
  
  // Mark a setup item as complete but TBD
  const completeSetupItemTBD = (itemKey: SetupItemKey, data: any) => {
    updateSetupItem(itemKey, SetupItemStatus.COMPLETE_TBD, data);
  };
  
  // Mark a setup item as incomplete
  const markIncomplete = (itemKey: SetupItemKey) => {
    updateSetupItem(itemKey, SetupItemStatus.INCOMPLETE);
  };
  
  // Get the state of a specific setup item
  const getSetupItemState = (itemKey: SetupItemKey): SetupItemState => {
    return setupState[itemKey];
  };
  
  // Check if a specific setup item is complete (either COMPLETE or COMPLETE_TBD)
  const isSetupItemComplete = (itemKey: SetupItemKey): boolean => {
    const status = setupState[itemKey].status;
    return status === SetupItemStatus.COMPLETE || status === SetupItemStatus.COMPLETE_TBD;
  };
  
  // Check if gathering is ready to launch (all setup items complete)
  const isReadyToLaunch = useMemo(() => {
    return Object.values(setupState).every(item => 
      item.status === SetupItemStatus.COMPLETE || 
      item.status === SetupItemStatus.COMPLETE_TBD
    );
  }, [setupState]);
  
  // Get count of completed setup items
  const completedCount = useMemo(() => {
    return Object.values(setupState).filter(item => 
      item.status === SetupItemStatus.COMPLETE || 
      item.status === SetupItemStatus.COMPLETE_TBD
    ).length;
  }, [setupState]);
  
  // Get total number of setup items
  const totalCount = Object.keys(setupState).length;
  
  // Calculate completion percentage
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  
  return {
    setupState,
    updateSetupItem,
    completeSetupItem,
    completeSetupItemTBD,
    markIncomplete,
    getSetupItemState,
    isSetupItemComplete,
    isReadyToLaunch,
    completedCount,
    totalCount,
    completionPercentage,
    gatheringId
  };
}; 