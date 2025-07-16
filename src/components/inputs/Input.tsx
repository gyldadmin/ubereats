import React from 'react';
import { SingleLineInput } from '../ui/inputs';
import { theme } from '../../styles/theme';

interface SingleLineInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onValueChange?: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  maxLength?: number;
  mode?: 'outlined' | 'flat';
  dense?: boolean;
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  blurOnSubmit?: boolean;
  selectTextOnFocus?: boolean;
  style?: any;
  contentStyle?: any;
  testID?: string;
  secureTextEntry?: boolean;
}

// App's default single-line input with consistent styling
export const Input = (props: SingleLineInputProps) => (
  <SingleLineInput
    mode="outlined"
    dense={false}
    style={[
      { 
        marginBottom: theme.spacing.md,
        minHeight: 60,
      }, 
      props.style
    ]}
    outlineColor={theme.colors.border.light}
    activeOutlineColor={theme.colors.primary}
    backgroundColor={theme.colors.background.secondary}
    {...props}
  />
); 