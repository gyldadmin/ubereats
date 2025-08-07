// Content Template Types
export interface ContentTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  content_key: string;
  content_type: string; // UUID referencing workflow_type table
  usage_context: string | null;
  dynamic_variables: DynamicVariable[];
  primary_text: string | null;
  secondary_text: string | null;
  tertiary_text: string | null;
}

export interface DynamicVariable {
  variable: string;
  description: string;
}

export interface ProcessedContentTemplate {
  content_key: string;
  content_type: string;
  usage_context: string | null;
  primary_text: string | null;
  secondary_text: string | null;
  tertiary_text: string | null;
  dynamic_variables: DynamicVariable[];
  processed_primary_text: string | null;
  processed_secondary_text: string | null;
  processed_tertiary_text: string | null;
}

export interface ContentTemplateVariableData {
  [key: string]: string | number | null | undefined;
}

// Personalized Messaging Types
export interface PersonalizedMessageData {
  user_id: string;
  email: string;
  first_name: string;
  global_variables: Record<string, any>; // Event title, date, etc.
  user_variables: Record<string, any>;   // First name, custom URL, etc.
  merged_variables: Record<string, any>; // Combined for template processing
}

export interface PersonalizedTemplateResult {
  user_id: string;
  email: string;
  processed_template: ProcessedContentTemplate; // Using existing ProcessedContentTemplate
  success: boolean;
  error?: string;
} 