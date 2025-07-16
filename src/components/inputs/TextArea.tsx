import React from 'react';
import { MultiLineInput } from '../ui/inputs';
import { theme } from '../../styles/theme';

interface MultiLineInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onValueChange?: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  minHeight?: number;
  maxHeight?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  mode?: 'outlined' | 'flat';
  dense?: boolean;
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  showCharacterCount?: boolean;
  characterCountPosition?: 'bottom-right' | 'bottom-left';
  onFocus?: () => void;
  onBlur?: () => void;
  onContentSizeChange?: (event: any) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  contentStyle?: any;
  testID?: string;
}

// App's default multiline input with consistent styling
export const TextArea = (props: MultiLineInputProps) => (
  <MultiLineInput
    mode="outlined"
    multiline={true}
    numberOfLines={4}
    minHeight={112}
    maxHeight={200}
    showCharacterCount={true}
    style={[
      { 
        marginBottom: theme.spacing.md,
      }, 
      props.style
    ]}
    outlineColor={theme.colors.border.light}
    activeOutlineColor={theme.colors.primary}
    backgroundColor={theme.colors.background.secondary}
    {...props}
  />
); 