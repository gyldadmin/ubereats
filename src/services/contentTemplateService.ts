import { supabase } from './supabase';
import type { 
  ContentTemplate, 
  ProcessedContentTemplate, 
  ContentTemplateVariableData 
} from '../types/content';

/**
 * Fetches a content template by content_key
 */
export async function fetchContentTemplate(contentKey: string): Promise<ContentTemplate | null> {
  try {
    // Query the content_templates table by content_key
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('content_key', contentKey)
      .single();

    if (error) {
      console.error('Error fetching content template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchContentTemplate:', error);
    return null;
  }
}

/**
 * Processes dynamic variables in text content
 */
export function processTemplateVariables(
  text: string | null, 
  variableData: ContentTemplateVariableData
): string | null {
  if (!text) return null;

  let processedText = text;

  // Replace each variable with its corresponding value
  Object.entries(variableData).forEach(([key, value]) => {
    const variablePattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const replacement = value?.toString() || '';
    processedText = processedText.replace(variablePattern, replacement);
  });

  return processedText;
}

/**
 * Fetches and processes a content template with dynamic data
 */
export async function getProcessedContentTemplate(
  contentKey: string,
  variableData: ContentTemplateVariableData
): Promise<ProcessedContentTemplate | null> {
  try {
    // Fetch the template from database
    const template = await fetchContentTemplate(contentKey);
    
    if (!template) {
      console.error(`Content template with key '${contentKey}' not found`);
      return null;
    }

    // Process dynamic variables in each text field
    const processedTemplate: ProcessedContentTemplate = {
      content_key: template.content_key,
      content_type: template.content_type,
      usage_context: template.usage_context,
      primary_text: template.primary_text,
      secondary_text: template.secondary_text,
      tertiary_text: template.tertiary_text,
      dynamic_variables: template.dynamic_variables,
      processed_primary_text: processTemplateVariables(template.primary_text, variableData),
      processed_secondary_text: processTemplateVariables(template.secondary_text, variableData),
      processed_tertiary_text: processTemplateVariables(template.tertiary_text, variableData),
    };

    return processedTemplate;
  } catch (error) {
    console.error('Error in getProcessedContentTemplate:', error);
    return null;
  }
}

/**
 * Parses markdown-style text for React Native display
 * Simple implementation for **bold** formatting
 */
export function parseMarkdownText(text: string): string {
  // For now, just strip markdown formatting
  // In a full implementation, you'd parse this for proper formatting
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
} 