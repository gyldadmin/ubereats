// Notification Orchestration Types

import type { EmailServiceInputs } from './email';
import type { PushServiceInputs } from './push';

// Orchestration Modes
export type OrchestrationMode = 'push_preferred' | 'both';

// Unified Orchestration Inputs
export interface OrchestrationInputs {
  // Mode selection
  mode: OrchestrationMode; // 'push_preferred' or 'both'
  
  // Recipients (static - current approach)
  users?: string[]; // Array of user IDs - made optional for dynamic support
  send_date: Date; // When to send
  
  // Dynamic recipient sources (new approach)
  recipient_source?: {
    type: 'rsvp_list' | 'user_ids' | 'gyld_members';
    gathering_id?: string; // For rsvp_list
    rsvp_status?: 'yes' | 'no' | 'maybe'; // For rsvp_list  
    user_ids?: string[]; // For user_ids type
    gyld_id?: string; // For gyld_members type
  };
  
  // Unified content (static - current approach)
  title?: string; // Main title/subject - made optional for dynamic support
  subtitle?: string; // Secondary title
  content?: string; // Main body content - made optional for dynamic support
  secondary_content?: string; // Additional body content for email
  
  // Content template integration (legacy approach)
  content_key?: string; // Reference to content_templates table
  template_variables?: Record<string, string | number | null>; // Variables for template processing
  
  // Dynamic content sources (new approach)
  content_source?: {
    template_key: string; // Content template key for dynamic rendering
    dynamic_data_sources: {
      gathering_id?: string; // Fetch fresh gathering details
      user_id?: string; // Fetch fresh user details  
      candidate_id?: string; // Fetch fresh candidate details
    };
  };
  
  // Deep linking and buttons
  deep_link?: string; // Format: "ScreenName?param1=value1&param2=value2"
  button1_text?: string;
  button1_url?: string;
  button2_text?: string;
  button2_url?: string;
  button3_text?: string;
  button3_url?: string;
  
  // Email-specific fields (used when email is sent)
  email_template_name?: string; // Default: 'basic_with_button'
  email_type?: string; // Default: 'notification'
  sender_fullname?: string; // Default: 'Gyld Notifications'
  reply_to_address?: string;
  unsubscribe_url?: string;
  header_image?: string;
  body_image?: string;
  
  // Metadata
  initiated_by: string; // User ID who initiated
  gathering_ID?: string; // Optional gathering association
  candidate_ID?: string; // Optional candidate association
}

// Orchestration Response
export interface OrchestrationResponse {
  success: boolean;
  message: string;
  error?: string;
  workflowId?: string; // For scheduled orchestrations
  
  // Detailed results
  push_results?: {
    attempted: boolean;
    success: boolean;
    sent_count: number;
    failed_count: number;
    failed_users: string[];
    error?: string;
    ticketIds?: string[];
  };
  
  email_results?: {
    attempted: boolean;
    success: boolean;
    sent_count: number;
    failed_count: number;
    error?: string;
    emailId?: string;
  };
}

// Internal mapping utilities
export interface PushInputsFromOrchestration {
  title1: string;
  title2?: string;
  content: string;
  users: string[];
  send_date: Date;
  deep_link?: string;
  button1_text?: string;
  button1_url?: string;
  button2_text?: string;
  button2_url?: string;
  button3_text?: string;
  button3_url?: string;
  initiated_by: string;
  gathering_ID?: string;
  candidate_ID?: string;
  content_key?: string;
  template_variables?: Record<string, string | number | null>;
}

export interface EmailInputsFromOrchestration {
  template_name: string;
  email_type: string;
  sender_fullname: string;
  subject: string;
  body1: string;
  body2?: string;
  to_address: string[]; // Email addresses resolved from user IDs
  send_date: Date;
  initiated_by: string;
  gathering_ID?: string;
  candidate_ID?: string;
  buttontext?: string;
  buttonurl?: string;
  unsubscribeurl?: string;
  reply_to_address?: string;
  header_image?: string;
  body_image?: string;
  // Add support for invite_with_envelope template fields
  first?: string;
  gath_date?: string;
  gath_title?: string;
} 