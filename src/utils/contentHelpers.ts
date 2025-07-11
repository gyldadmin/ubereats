// Content helper functions for dynamic data replacement

// Helper function to get gyld type focus area from gyld_type.@
export const getGyldTypeFocus = (gyldTypeAt?: string): string => {
  if (!gyldTypeAt) return 'your field';
  
  // Convert gyld_type.@ to readable focus area
  switch (gyldTypeAt.toLowerCase()) {
    case 'product':
    case 'product management':
      return 'product strategy and development';
    case 'engineering':
    case 'software engineering':
      return 'software architecture and system design';
    case 'design':
    case 'ux design':
      return 'user experience and design thinking';
    case 'data':
    case 'data science':
      return 'data analysis and machine learning';
    case 'marketing':
      return 'marketing strategy and growth';
    case 'sales':
      return 'sales strategy and customer development';
    default:
      return gyldTypeAt.toLowerCase();
  }
};

// Main function to replace all placeholders in content
export const replaceContentPlaceholders = (
  content: string, 
  user: any
): string => {
  if (!content) return '';
  
  // Get dynamic values from user object
  const gyldTypeAt = user?.gyld?.gyld_type?.['@'] || user?.gyld?.gyld_type?.label;
  const gyldTypeFocus = getGyldTypeFocus(gyldTypeAt);
  
  // Define all possible replacements
  const replacements: Record<string, string> = {
    '[gyld_type_@]': gyldTypeFocus,
    '[user_name]': user?.first || 'there',
    '[gyld_name]': user?.gyld?.name || 'your gyld',
    // Add more placeholders as needed
  };
  
  // Replace all placeholders
  let processedContent = content;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return processedContent;
};

// Helper to process an entire content block
export const processContentBlock = (
  contentBlock: { title: string; description: string; content: string },
  user: any
) => {
  return {
    title: replaceContentPlaceholders(contentBlock.title, user),
    description: replaceContentPlaceholders(contentBlock.description, user),
    content: replaceContentPlaceholders(contentBlock.content, user),
  };
}; 