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