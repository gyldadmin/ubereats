// Email Service Types
// Defines interfaces for email service inputs, outputs, and internal operations

export interface EmailServiceInputs {
  // Core content
  template_name: string;
  email_type: string; // Used to lookup sender address from email table
  sender_fullname: string;
  subject: string;
  body1: string;
  body2?: string; // Optional second body part
  
  // Personalization fields (for invite_with_envelope template)
  first?: string; // First name for personalization
  gath_date?: string; // Gathering date
  gath_title?: string; // Gathering title
  
  // Recipients (static - current approach)
  to_address?: string[]; // Made optional to support dynamic recipients
  cc_address?: string[]; // Optional
  bcc_address?: string[]; // Optional
  
  // Dynamic recipient sources (new approach)
  recipient_source?: {
    type: 'rsvp_list' | 'user_ids' | 'gyld_members' | 'static_emails';
    gathering_id?: string; // For rsvp_list
    rsvp_status?: 'yes' | 'no' | 'maybe'; // For rsvp_list  
    user_ids?: string[]; // For user_ids type
    static_emails?: string[]; // For static_emails type
    gyld_id?: string; // For gyld_members type
  };
  
  // Reply handling
  reply_to_address?: string; // Optional
  reply_to_name?: string; // Optional
  
  // Media content
  header_image?: string; // URL, optional
  body_image?: string; // URL, optional
  
  // Action elements
  buttontext?: string; // Optional
  buttonurl?: string; // URL, optional
  unsubscribeurl?: string; // URL, optional
  
  // Dynamic content sources (new approach)
  content_source?: {
    template_key: string; // Content template key for dynamic rendering
    dynamic_data_sources: {
      gathering_id?: string; // Fetch fresh gathering details
      user_id?: string; // Fetch fresh user details  
      candidate_id?: string; // Fetch fresh candidate details
    };
  };
  
  // Scheduling
  send_date: Date;
  
  // Tracking fields (optional)
  gathering_ID?: string; // UUID
  role_ID?: string; // UUID  
  experience_ID?: string; // UUID
  candidate_ID?: string; // UUID
  initiated_by: string; // UUID - user who initiated the email
  
  // Individual messaging support
  send_individual_messages?: boolean; // Default: false (bulk mode)
  per_user_variables?: Array<{
    user_id: string;
    variables: Record<string, any>; // {firstName: "John", customUrl: "app://rsvp/123"}
  }>;
}

export interface EmailServiceResponse {
  success: boolean;
  message: string;
  workflowId?: string; // Only present for scheduled emails
  emailId?: string; // SendGrid message ID if sent immediately
  error?: string;
}

// Internal types for database operations
export interface EmailTemplateLookup {
  id: string;
  label: string;
  template_id: string;
  template_variables: string[];
  json_template: any; // JSONB
}

export interface EmailAddressLookup {
  id: string;
  label: string;
  address: string;
}

export interface NotificationTypeLookup {
  id: string;
  label: string;
}

export interface StatusOptionLookup {
  id: string;
  label: string;
}

// SendGrid API types
export interface SendGridPersonalization {
  to: Array<{ email: string }>;
  cc?: Array<{ email: string }>;
  bcc?: Array<{ email: string }>;
  dynamic_template_data?: Record<string, any>; // Optional for content-based emails
  subject?: string; // Required for content-based emails
}

export interface SendGridContent {
  type: 'text/plain' | 'text/html';
  value: string;
}

export interface SendGridPayload {
  personalizations: SendGridPersonalization[];
  from: {
    email: string;
    name: string;
  };
  reply_to?: {
    email: string;
    name?: string;
  };
  template_id?: string; // Optional - for template-based emails
  subject?: string; // Optional - for content-based emails  
  content?: SendGridContent[]; // Optional - for content-based emails
}

// Scheduled email tracking
export interface ScheduledEmailRecord {
  id: string;
  workflow_id: string;
  email_inputs: EmailServiceInputs;
  scheduled_for: Date;
  status: 'pending' | 'cancelled' | 'completed';
}

// Notification tracking
export interface NotificationSentRecord {
  workflow_type: string; // UUID referencing workflow_type table
  to_address: string[];
  body1: string;
  subject: string;
  send_date: Date;
  status?: 'sent' | 'failed'; // Delivery status (defaults to 'sent')
}

// New types for dynamic data fetching
export interface UserEmailInfo {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface GatheringDynamicData {
  id: string;
  title: string;
  description?: string;
  date_time?: string;
  location?: string;
  attendee_count?: number;
}

export interface DynamicContentData {
  gathering?: GatheringDynamicData;
  user?: {
    id: string;
    first_name?: string;
    email: string;
  };
  candidate?: {
    id: string;
    first_name?: string;
    status?: string;
  };
}