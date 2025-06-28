/**
 * DESIGN SYSTEM STYLE GUIDE
 * 
 * CRITICAL: These are MANDATORY rules for ALL code generation
 * AI MUST follow these rules when creating any components or screens
 */

import { theme } from './theme';

/**
 * ====================================================================
 * MANDATORY RULES FOR AI CODE GENERATION
 * ====================================================================
 * 
 * When creating ANY screen, component, or UI element, you MUST:
 * 
 * 1. ALWAYS import and use these components:
 *    import { ScreenLayout, Typography, Spacer } from '../components/ui'
 *    import { componentStyles } from '../styles/componentStyles'
 * 
 * 2. SCREEN STRUCTURE - Every screen MUST follow this pattern:
 *    <ScreenLayout [props]>
 *      <Typography variant="h1">Screen Title</Typography>
 *      <Spacer size="lg" />
 *      // ... rest of content
 *    </ScreenLayout>
 * 
 * 3. TEXT - NEVER use <Text> directly, ALWAYS use <Typography>:
 *    ❌ <Text style={{fontSize: 16}}>Content</Text>
 *    ✅ <Typography variant="body">Content</Typography>
 * 
 * 4. SPACING - NEVER use manual margins/padding, ALWAYS use <Spacer>:
 *    ❌ <View style={{marginTop: 16}}>
 *    ✅ <Spacer size="lg" />
 * 
 * 5. STYLES - Use componentStyles for layout, theme values for everything else:
 *    ✅ style={componentStyles.standardCard}
 *    ✅ backgroundColor: theme.colors.background.primary
 * 
 * 6. COLORS - NEVER use hex codes, ALWAYS use theme.colors:
 *    ❌ color: '#333333'
 *    ✅ color: theme.colors.text.primary
 * 
 * 7. FONT SIZES - NEVER use hardcoded sizes, ALWAYS use theme.typography:
 *    ❌ fontSize: 18
 *    ✅ fontSize: theme.typography.sizes.lg
 */

export const DESIGN_SYSTEM_RULES = {
  // REQUIRED IMPORTS for every screen/component
  requiredImports: {
    components: "import { ScreenLayout, Typography, Spacer } from '../components/ui'",
    styles: "import { componentStyles } from '../styles/componentStyles'",
    theme: "import { theme } from '../styles/theme'",
  },

  // FORBIDDEN patterns - these should NEVER appear in generated code
  forbidden: {
    rawText: '<Text>', // Always use <Typography>
    rawView: 'style={{flex: 1, padding:', // Use ScreenLayout instead
    hardcodedColors: ['#', 'rgb(', 'rgba('], // Use theme.colors
    hardcodedSpacing: ['margin:', 'padding:'], // Use Spacer and componentStyles
    hardcodedFonts: ['fontSize:', 'fontWeight:'], // Use Typography variants
    customStyleSheet: 'StyleSheet.create', // Use componentStyles or inline theme values
  },

  // APPROVED patterns - these are the correct ways to do things
  approved: {
    screenWrapper: 'ScreenLayout',
    textComponent: 'Typography',
    spacingComponent: 'Spacer',
    layoutStyles: 'componentStyles',
    colorValues: 'theme.colors',
    typographyValues: 'theme.typography',
    spacingValues: 'theme.spacing',
  },

  // SCREEN TEMPLATES - copy these patterns exactly
  templates: {
    basicScreen: `
      <ScreenLayout>
        <Typography variant="h1">Screen Title</Typography>
        <Spacer size="lg" />
        <Typography variant="body">Content goes here</Typography>
      </ScreenLayout>
    `,
    
    scrollableScreen: `
      <ScreenLayout scrollable withHeader>
        <Typography variant="h1">Screen Title</Typography>
        <Spacer size="lg" />
        <Typography variant="body">Scrollable content</Typography>
      </ScreenLayout>
    `,
    
    centeredScreen: `
      <ScreenLayout centered>
        <Typography variant="h2" align="center">Centered Content</Typography>
        <Spacer size="md" />
        <Typography variant="body" align="center">Description</Typography>
      </ScreenLayout>
    `,
  },
} as const;

/**
 * ====================================================================
 * COMPONENT USAGE GUIDELINES
 * ====================================================================
 */

export const COMPONENT_GUIDELINES = {
  ScreenLayout: {
    purpose: 'Root wrapper for ALL screens - provides consistent layout',
    when: 'Every screen must use this as the outermost component',
    props: {
      scrollable: 'Use for screens with scrolling content',
      withHeader: 'Use when screen needs header spacing',
      centered: 'Use for loading states, empty states, modals',
      fullBleed: 'Use only for special screens (onboarding, splash)',
    },
  },

  Typography: {
    purpose: 'All text rendering - replaces <Text> completely',
    when: 'Every piece of text in the app',
    variants: {
      h1: 'Page titles, main headers',
      h2: 'Section headers',
      h3: 'Subsection headers',
      title: 'Component titles, card headers',
      subtitle: 'Secondary titles, descriptions',
      body: 'Main content text, paragraphs',
      caption: 'Small text, labels, metadata',
      button: 'Button text (though React Native Paper handles this)',
    },
  },

  Spacer: {
    purpose: 'All spacing between elements - replaces manual margins',
    when: 'Between any two components that need spacing',
    sizes: {
      xs: 'Tight spacing within components',
      sm: 'Close related elements',
      md: 'Default spacing between components',
      lg: 'Section spacing',
      xl: 'Large section spacing',
      xxl: 'Major section breaks',
      xxxl: 'Page-level spacing',
    },
  },
} as const;

/**
 * ====================================================================
 * EXCEPTION HANDLING
 * ====================================================================
 */

export const DESIGN_EXCEPTIONS = {
  // Document any intentional breaks from the design system here
  // Format: ComponentName: { reason, customApproach, approvedBy }
} as const;

/**
 * ====================================================================
 * VALIDATION CHECKLIST
 * ====================================================================
 * 
 * Before considering any component complete, verify:
 * 
 * ✅ Uses ScreenLayout as root wrapper
 * ✅ Uses Typography for all text
 * ✅ Uses Spacer for all spacing
 * ✅ Uses componentStyles for layout patterns
 * ✅ Uses theme.colors for all colors
 * ✅ No hardcoded values (fonts, colors, spacing)
 * ✅ No raw <Text> or <View style={{flex: 1}}> components
 * ✅ Follows approved patterns from templates
 */

export const VALIDATION_CHECKLIST = [
  'Uses ScreenLayout as root wrapper',
  'Uses Typography for all text',
  'Uses Spacer for all spacing',
  'Uses componentStyles for layout patterns',
  'Uses theme.colors for all colors',
  'No hardcoded values',
  'No raw Text or View components',
  'Follows approved templates',
] as const; 