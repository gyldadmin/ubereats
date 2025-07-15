// Enhanced mentor interface with status and approval information
export interface ActiveMentor {
  id: string;
  user_id?: string; // Optional - some mentors might not be associated with users
  mentor_status_label?: string;
  mentor_approval_label?: string;
  approval_expires_at?: string;
  gyld?: string;
  metro?: string;
  gyld_type?: string;
  
  // Mentor display data (from mentor_satellites only, not users_public)
  full_name?: string;
  profpic?: string;
  title?: string;
  bio?: string;
}

// Planned workflow interface based on the new table
export interface PlannedWorkflow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  workflow_id: string;
  planned_workflow_type: string;
  gathering_id?: string;
  workflow_type_label?: string;
}

// Enhanced gathering interface for host screens
export interface GyldGathering {
  id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  gyld?: string[];
  host?: string[];
  
  // Status and type information
  gathering_status_label?: string;
  experience_type_label?: string;
  experience_type_image?: string;
  
  // Satellite data
  gatheringDisplay?: {
    id: string;
    gathering_id: string;
    address?: string;
    image?: string;
    description?: string;
    meeting_link?: string;
    location_instructions?: string;
    mentor?: string[];
  } | null;
  
  gatheringOther?: {
    id: string;
    gathering: string;
    cap?: number;
    payment_amount?: number;
    payment_for?: string;
    payment_to_member?: boolean;
    payment_venmo?: string;
    potluck?: boolean;
    recruitment?: boolean;
    signup_question?: string;
    remote?: boolean;
    location_tbd?: boolean;
    description_tbd?: boolean;
    host_message?: string;
    host_subject?: string;
    plus_guests?: number;
    hold_autoreminders?: boolean;
  } | null;
}

// Combined host data interface for convenience
export interface HostData {
  gatheringDetail: any | null; // From existing useGatheringDetail
  gyldMembers: any[]; // From existing useGyldMembers
  activeMentors: ActiveMentor[];
  gyldGatherings: GyldGathering[];
  plannedWorkflows: PlannedWorkflow[];
} 