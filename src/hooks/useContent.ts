import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { processContentBlock } from '../utils/contentHelpers';
import type { ContentKey, ProcessedContent } from '../types/content';
import { supabase } from '../services/supabase';

// Content data imports - each file named after its key
const contentFiles = {
  mentoring_how_it_works: require('../content/mentoring_how_it_works.json'),
};

/**
 * Hook to get processed content with dynamic data replacement
 * @param contentKey - The key of the content to retrieve
 * @returns Processed content with all placeholders replaced
 */
export const useContent = (contentKey: ContentKey): ProcessedContent | null => {
  const { userPublic, userGyld } = useAuthStore();
  
  return useMemo(() => {
    // Get the raw content from the appropriate file
    const rawContent = contentFiles[contentKey];
    
    if (!rawContent) {
      console.warn(`Content not found for key: ${contentKey}`);
      return null;
    }
    
    // Create user object for content processing
    // Note: We'll need to enhance this with gyld_type info in the future
    const userForContent = {
      first: userPublic?.first,
      gyld: {
        name: userGyld, // This is just the ID, we'd need to fetch actual gyld data
        gyld_type: {
          '@': 'product', // Placeholder - this should come from database
          label: 'Product Management' // Placeholder - this should come from database
        }
      }
    };
    
    // Process the content with dynamic data
    return processContentBlock(rawContent, userForContent);
  }, [contentKey, userPublic, userGyld]);
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