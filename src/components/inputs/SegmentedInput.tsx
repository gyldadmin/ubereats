import React from 'react';
import { SegmentedInput as SegmentedInputPrimitive } from '../ui/inputs';
import { theme } from '../../styles/theme';

interface SegmentedOption<T = string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

interface SegmentedInputProps<T = string> {
  label: string;
  value: T | T[];
  onValueChange: (value: T | T[]) => void;
  options: SegmentedOption<T>[];
  multiSelect?: boolean;
  maxSelections?: number;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  density?: 'regular' | 'small' | 'medium' | 'high';
  selectedColor?: string;
  unselectedColor?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
  orientation?: 'horizontal' | 'vertical';
  distribution?: 'equal' | 'content';
  showIcons?: boolean;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  onPress?: (value: T) => void;
  onLongPress?: (value: T) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  buttonStyle?: any;
  labelStyle?: any;
  testID?: string;
}

// App's default segmented input with consistent styling
export const SegmentedInput = <T = string>(props: SegmentedInputProps<T>) => (
  <SegmentedInputPrimitive
    density="regular"
    showIcons={true}
    iconPosition="left"
    style={[
      { 
        marginBottom: theme.spacing.md,
      }, 
      props.style
    ]}
    {...props}
  />
); 