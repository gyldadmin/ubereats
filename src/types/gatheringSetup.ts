// Setup item status enum
export enum SetupItemStatus {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete', 
  COMPLETE_TBD = 'complete_tbd'
}

// Setup item state interface
export interface SetupItemState {
  status: SetupItemStatus;
  data?: any; // The actual saved data for this setup item
}

// Individual setup item data types
export interface GatheringTypeData {
  experienceType: string;
  category: string;
}

export interface TitleHostsData {
  title: string;
  hosts: string[]; // Array of user IDs
}

export interface DateTimeData {
  startTime: string;
  endTime: string;
  timezone: string;
  isTBD?: boolean;
}

export interface LocationData {
  address: string;
  locationInstructions?: string;
  isRemote: boolean;
  isTBD?: boolean;
}

export interface MentorData {
  mentors: string[]; // Array of mentor IDs
}

export interface DescriptionData {
  description: string;
  image?: string;
}

// Main gathering setup state
export interface GatheringSetupState {
  gatheringType: SetupItemState;
  titleAndHosts: SetupItemState;
  dateTime: SetupItemState;
  location: SetupItemState;
  mentor: SetupItemState;
  description: SetupItemState;
}

// Setup item keys for type safety
export type SetupItemKey = keyof GatheringSetupState; 