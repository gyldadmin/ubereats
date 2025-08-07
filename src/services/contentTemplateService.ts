import type {
    ContentTemplate,
    ContentTemplateVariableData,
    PersonalizedMessageData,
    PersonalizedTemplateResult,
    ProcessedContentTemplate
} from '../types/content';
import { supabase } from './supabase';

/**
 * Fetches a content template by content_key and optionally content_type
 */
export async function fetchContentTemplate(
  contentKey: string, 
  contentType?: 'email' | 'push' | 'sms' | 'display'
): Promise<ContentTemplate | null> {
  try {
    let query = supabase
      .from('content_templates')
      .select('*')
      .eq('content_key', contentKey);

    // If content_type is specified, join with workflow_type to filter
    if (contentType) {
      query = supabase
        .from('content_templates')
        .select(`
          *,
          workflow_type!inner(label)
        `)
        .eq('content_key', contentKey)
        .eq('workflow_type.label', contentType);
    }

    const { data, error } = await query.single();

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
  contentType: 'email' | 'push' | 'sms' | 'display',
  variableData: ContentTemplateVariableData
): Promise<ProcessedContentTemplate | null> {
  try {
    // Fetch the template from database
    const template = await fetchContentTemplate(contentKey, contentType);
    
    if (!template) {
      console.error(`Content template with key '${contentKey}' and type '${contentType}' not found`);
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

// PERSONALIZED MESSAGING FUNCTIONS

/**
 * Merges global template variables with user-specific variables
 * User variables take precedence over global variables in case of conflicts
 */
export function mergeTemplateVariables(
  globalVars: Record<string, any>,
  userVars: Record<string, any>
): Record<string, any> {
  // User variables override global variables if there's a conflict
  return {
    ...globalVars,
    ...userVars
  };
}

/**
 * Prepares personalized data array from user information and variables
 */
export function preparePersonalizedData(
  userIds: string[],
  emails: string[],
  perUserVariables: Array<{ user_id: string; variables: Record<string, any> }>,
  globalVariables: Record<string, any>
): PersonalizedMessageData[] {
  if (userIds.length !== emails.length) {
    throw new Error('userIds and emails arrays must have the same length');
  }

  if (perUserVariables.length !== userIds.length) {
    throw new Error('perUserVariables must have the same length as userIds');
  }

  return userIds.map((userId, index) => {
    const email = emails[index];
    if (!email) {
      throw new Error(`Email not found for user at index ${index}`);
    }
    
    const userVarEntry = perUserVariables.find(entry => entry.user_id === userId);
    const userVariables = userVarEntry?.variables || {};
    
    // Extract first name from user variables, fallback to empty string
    const firstName = userVariables.firstName || userVariables.first_name || '';

    return {
      user_id: userId,
      email: email,
      first_name: firstName,
      global_variables: globalVariables,
      user_variables: userVariables,
      merged_variables: mergeTemplateVariables(globalVariables, userVariables)
    };
  });
}

/**
 * Processes personalized content templates for multiple users
 * Each user gets their own processed template with merged global and user variables
 */
export async function processPersonalizedContentTemplate(
  contentKey: string,
  contentType: 'email' | 'push' | 'sms' | 'display',
  _globalVariables: ContentTemplateVariableData,
  personalizedData: PersonalizedMessageData[]
): Promise<PersonalizedTemplateResult[]> {
  try {
    // Fetch the template from database (same for all users)
    const template = await fetchContentTemplate(contentKey, contentType);
    
    if (!template) {
      const errorMessage = `Content template with key '${contentKey}' and type '${contentType}' not found`;
      console.error(errorMessage);
      
      // Return error result for all users
      return personalizedData.map(userData => ({
        user_id: userData.user_id,
        email: userData.email,
        processed_template: {} as ProcessedContentTemplate,
        success: false,
        error: errorMessage
      }));
    }

    // Process template for each user with their merged variables
    const results: PersonalizedTemplateResult[] = [];
    
    for (const userData of personalizedData) {
      try {
        // Use merged variables for template processing
        const processedTemplate: ProcessedContentTemplate = {
          content_key: template.content_key,
          content_type: template.content_type,
          usage_context: template.usage_context,
          primary_text: template.primary_text,
          secondary_text: template.secondary_text,
          tertiary_text: template.tertiary_text,
          dynamic_variables: template.dynamic_variables,
          processed_primary_text: processTemplateVariables(template.primary_text, userData.merged_variables),
          processed_secondary_text: processTemplateVariables(template.secondary_text, userData.merged_variables),
          processed_tertiary_text: processTemplateVariables(template.tertiary_text, userData.merged_variables),
        };

        results.push({
          user_id: userData.user_id,
          email: userData.email,
          processed_template: processedTemplate,
          success: true
        });

      } catch (userError) {
        console.error(`Error processing template for user ${userData.user_id}:`, userError);
        results.push({
          user_id: userData.user_id,
          email: userData.email,
          processed_template: {} as ProcessedContentTemplate,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown template processing error'
        });
      }
    }

    return results;

  } catch (error) {
    console.error('Error in processPersonalizedContentTemplate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in personalized template processing';
    
    // Return error result for all users
    return personalizedData.map(userData => ({
      user_id: userData.user_id,
      email: userData.email,
      processed_template: {} as ProcessedContentTemplate,
      success: false,
      error: errorMessage
    }));
  }
} 