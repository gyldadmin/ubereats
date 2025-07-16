import React from 'react';
import { ChipSelectionInput } from '../ui/inputs';
import { theme } from '../../styles/theme';

interface ChipOption<T = any> {
  value: T;
  label: string;
  icon?: string;
  avatar?: React.ReactNode;
  disabled?: boolean;
}

interface ChipSelectionInputProps<T = any> {
  label: string;
  value: T | T[];
  onValueChange: (value: T | T[]) => void;
  options: ChipOption<T>[];
  multiSelect?: boolean;
  maxSelections?: number;
  minSelections?: number;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  mode?: 'flat' | 'outlined';
  compact?: boolean;
  elevated?: boolean;
  selectedColor?: string;
  unselectedColor?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
  rippleColor?: string;
  layout?: 'wrap' | 'scroll';
  columns?: number;
  spacing?: number;
  showSelectedOverlay?: boolean;
  showSelectedCheck?: boolean;
  onPress?: (value: T) => void;
  onLongPress?: (value: T) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  chipContainerStyle?: any;
  chipStyle?: any;
  chipTextStyle?: any;
  testID?: string;
}

// App's default chip selection with consistent styling
export const ChipSelection = <T = any>(props: ChipSelectionInputProps<T>) => (
  <ChipSelectionInput
    mode="outlined"
    compact={false}
    elevated={false}
    layout="wrap"
    spacing={theme.spacing.sm}
    showSelectedOverlay={true}
    showSelectedCheck={true}
    style={[
      { 
        marginBottom: theme.spacing.md,
      }, 
      props.style
    ]}
    {...props}
  />
); 