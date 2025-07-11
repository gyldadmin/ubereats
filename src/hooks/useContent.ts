import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { processContentBlock } from '../utils/contentHelpers';
import type { ContentKey, ProcessedContent } from '../types/content';

// Direct import of content instead of require()
import mentoringHowItWorksContent from '../content/mentoring_how_it_works.json';

// Content data imports - each file named after its key
const contentFiles = {
  mentoring_how_it_works: mentoringHowItWorksContent,
};

/**
 * Hook to get processed content with dynamic data replacement
 * @param contentKey - The key of the content to retrieve
 * @returns Processed content with all placeholders replaced
 */
export const useContent = (contentKey: ContentKey): ProcessedContent | null => {
  const { userPublic } = useAuthStore();
  
  return useMemo(() => {
    // Get the raw content from the appropriate file
    const rawContent = contentFiles[contentKey];
    
    if (!rawContent) {
      return null;
    }
    
    // Create simple user object for content processing - no database dependency for now
    const userForContent = {
      first: userPublic?.first || 'there',
      gyld: {
        name: 'your gyld',
        gyld_type: {
          '@': 'product management', // Simple fallback
          label: 'Product Management'
        }
      }
    };
    
    // Process the content with dynamic data
    return processContentBlock(rawContent, userForContent);
  }, [contentKey, userPublic]);
};

/**
 * Hook to get specific parts of content (description or content only)
 * @param contentKey - The key of the content to retrieve
 * @param part - Which part to return ('description', 'content', or 'both')
 * @returns The requested part(s) of the content
 */
export const useContentPart = (
  contentKey: ContentKey, 
  part: 'description' | 'content' | 'both' = 'both'
): string | ProcessedContent | null => {
  const content = useContent(contentKey);
  
  if (!content) return null;
  
  switch (part) {
    case 'description':
      return content.description;
    case 'content':
      return content.content;
    case 'both':
    default:
      return content;
  }
}; 