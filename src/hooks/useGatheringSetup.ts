import { useState, useMemo } from 'react';
import { 
  GatheringSetupState, 
  SetupItemState, 
  SetupItemStatus, 
  SetupItemKey 
} from '../types/gatheringSetup';

/**
 * Main hook for managing gathering setup state across all setup items
 * Handles individual setup item states and determines launch readiness
 */
export const useGatheringSetup = (gatheringId?: string) => {
  const [setupState, setSetupState] = useState<GatheringSetupState>({
    gatheringType: { status: SetupItemStatus.COMPLETE }, // Example: already completed
    titleAndHosts: { status: SetupItemStatus.COMPLETE }, // Example: already completed
    dateTime: { status: SetupItemStatus.INCOMPLETE },
    location: { status: SetupItemStatus.COMPLETE }, // Example: already completed
    mentor: { status: SetupItemStatus.INCOMPLETE },
    description: { status: SetupItemStatus.INCOMPLETE },
  });
  
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