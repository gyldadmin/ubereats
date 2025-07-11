import { useMemo, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { processContentBlock } from '../utils/contentHelpers';
import type { ContentKey, ProcessedContent } from '../types/content';
import { supabase } from '../services/supabase';

// Direct import of content instead of require()
import mentoringHowItWorksContent from '../content/mentoring_how_it_works.json';

// Content data imports - each file named after its key
const contentFiles = {
  mentoring_how_it_works: mentoringHowItWorksContent,
};

// Debug: Log the imported content immediately
console.log('📄 Content files loaded:', contentFiles);
console.log('📄 Mentoring content specifically:', mentoringHowItWorksContent);

/**
 * Hook to get processed content with dynamic data replacement
 * @param contentKey - The key of the content to retrieve
 * @returns Processed content with all placeholders replaced
 */
export const useContent = (contentKey: ContentKey): ProcessedContent | null => {
  const { userPublic, userGyld } = useAuthStore();
  const [gyldTypeData, setGyldTypeData] = useState<any>(null);
  
  // Fetch user's actual gyld type data
  useEffect(() => {
    const fetchGyldType = async () => {
      if (!userGyld) {
        console.log('🔍 No userGyld found, skipping gyld type fetch');
        return;
      }
      
      try {
        console.log('🔍 Fetching gyld type for user:', userPublic?.user_id);
        
        // Query the users_internal table to get gyld_type
        const { data, error } = await supabase
          .from('users_internal')
          .select('gyld_type')
          .eq('user_id', userPublic?.user_id)
          .single();
          
        if (error) {
          console.error('❌ Error fetching gyld type:', error);
          return;
        }
        
        console.log('✅ Fetched gyld type data:', data);
        setGyldTypeData(data?.gyld_type);
      } catch (err) {
        console.error('❌ Error in fetchGyldType:', err);
      }
    };
    
    fetchGyldType();
  }, [userPublic?.user_id, userGyld]);
  
  return useMemo(() => {
    console.log('🔄 useContent called with:', { contentKey, userPublic: !!userPublic, userGyld: !!userGyld });
    
    // Get the raw content from the appropriate file
    const rawContent = contentFiles[contentKey];
    
    console.log('🔍 Content lookup result:', {
      contentKey,
      hasRawContent: !!rawContent,
      rawContentKeys: Object.keys(rawContent || {}),
      gyldTypeData,
      userPublic: userPublic?.first
    });
    
    if (!rawContent) {
      console.warn(`❌ Content not found for key: ${contentKey}`);
      return null;
    }
    
    // Create user object for content processing
    const userForContent = {
      first: userPublic?.first || 'there',
      gyld: {
        name: userGyld || 'your gyld',
        gyld_type: {
          '@': gyldTypeData || 'product management', // Use real data or fallback
          label: gyldTypeData || 'Product Management'
        }
      }
    };
    
    console.log('🔍 Processing content with user data:', userForContent);
    
    // Process the content with dynamic data
    const processedContent = processContentBlock(rawContent, userForContent);
    
    console.log('✅ Final processed content:', processedContent);
    
    return processedContent;
  }, [contentKey, userPublic, userGyld, gyldTypeData]);
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