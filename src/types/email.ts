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
  
  // Recipients
  to_address: string[];
  cc_address?: string[]; // Optional
  bcc_address?: string[]; // Optional
  
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
  
  // Scheduling
  send_date: Date;
  
  // Tracking fields (optional)
  gathering_ID?: string; // UUID
  role_ID?: string; // UUID  
  experience_ID?: string; // UUID
  candidate_ID?: string; // UUID
  initiated_by: string; // UUID - user who initiated the email
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