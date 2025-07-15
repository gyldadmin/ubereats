import { create } from 'zustand';

interface CurrentGatheringState {
  // Current gathering being worked on across host screens
  currentGatheringId: string | null;
  isNewGathering: boolean;
  
  // Actions
  setCurrentGathering: (id: string, isNew?: boolean) => void;
  clearCurrentGathering: () => void;
  
  // Helper to get gathering ID from store or route params
  getGatheringId: (routeParams?: any) => string | null;
}

export const useCurrentGatheringStore = create<CurrentGatheringState>((set, get) => ({
  // Initial state
  currentGatheringId: null,
  isNewGathering: false,
  
  // Set current gathering (used when navigating between host screens)
  setCurrentGathering: (id: string, isNew = false) => {
    set({ currentGatheringId: id, isNewGathering: isNew });
  },
  
  // Clear current gathering (used when leaving host screens)
  clearCurrentGathering: () => {
    set({ currentGatheringId: null, isNewGathering: false });
  },
  
  // Helper function to get gathering ID (store priority, then route params)
  getGatheringId: (routeParams?: any) => {
    const { currentGatheringId } = get();
    
    // If we have a gathering in store, use it
    if (currentGatheringId) {
      return currentGatheringId;
    }
    
    // Fall back to route params
    return routeParams?.gatheringId || null;
  },
})); 