// Push Notification Types

export interface PushServiceInputs {
  // Core content
  title1: string; // Main push title
  title2?: string; // Push subtitle  
  content: string; // Push body content
  
  // Recipients and timing
  users: string[]; // Array of user IDs to send push to
  send_date: Date; // When to send the push
  
  // Deep linking
  deep_link?: string; // Format: "ScreenName?param1=value1&param2=value2"
  
  // Action buttons (up to 3)
  button1_text?: string;
  button1_url?: string;
  button2_text?: string;
  button2_url?: string;
  button3_text?: string;
  button3_url?: string;
  
  // Metadata
  initiated_by: string; // User ID who initiated the push
  gathering_ID?: string; // Optional gathering association
  candidate_ID?: string; // Optional candidate association
  
  // Content template integration
  content_key?: string; // Reference to content_templates table
  template_variables?: Record<string, string | number | null>; // Variables for template processing
}

// Expo Push Notification Payload Types
export interface ExpoPushMessage {
  to: string | string[]; // Push token(s)
  title?: string;
  subtitle?: string;
  body?: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  mutableContent?: boolean;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded' | string;
  };
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  details?: {
    error?: 'DeviceNotRegistered' | 'MessageTooBig' | 'MessageRateExceeded' | string;
  };
}

// Service Response Types
export interface PushServiceResponse {
  success: boolean;
  message: string;
  error?: string;
  workflowId?: string; // For scheduled pushes
  ticketIds?: string[]; // For immediate pushes
  failedUsers?: string[]; // Users who couldn't receive push
}

// Database Types
// Note: NotificationSentRecord is imported from email types to avoid duplication

// Push Token Management Types
export interface PushTokenInfo {
  user_id: string;
  push_token: string | null;
  push_enabled: boolean;
  updated_at: Date;
}

export interface PushPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
} 