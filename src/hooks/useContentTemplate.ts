import { useState, useEffect } from 'react';
import { getProcessedContentTemplate } from '../services/contentTemplateService';
import type { ProcessedContentTemplate, ContentTemplateVariableData } from '../types/content';

export function useContentTemplate(
  contentKey: string, 
  variableData: ContentTemplateVariableData
) {
  const [contentTemplate, setContentTemplate] = useState<ProcessedContentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch and process the content template
        const template = await getProcessedContentTemplate(contentKey, variableData);
        
        if (template) {
          setContentTemplate(template);
        } else {
          setError(`Content template '${contentKey}' not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content template');
        console.error('Error in useContentTemplate:', err);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if contentKey is provided
    if (contentKey) {
      fetchTemplate();
    }
  }, [contentKey, JSON.stringify(variableData)]);

  return {
    contentTemplate,
    loading,
    error,
  };
} 