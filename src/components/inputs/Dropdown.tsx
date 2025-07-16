import React from 'react';
import { DropdownInput } from '../ui/inputs';
import { theme } from '../../styles/theme';

interface DropdownOption<T = any> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface DropdownInputProps<T = any> {
  label: string;
  value: T | undefined;
  onValueChange: (value: T | undefined) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterFunction?: (option: DropdownOption<T>, query: string) => boolean;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputMode?: 'outlined' | 'flat';
  dense?: boolean;
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  dropdownIcon?: string;
  clearIcon?: string;
  showDropdownIcon?: boolean;
  showClearIcon?: boolean;
  maxHeight?: number;
  renderOption?: (option: DropdownOption<T>) => React.ReactNode;
  getOptionLabel?: (option: DropdownOption<T>) => string;
  getOptionValue?: (option: DropdownOption<T>) => T;
  onFocus?: () => void;
  onBlur?: () => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onSearch?: (query: string) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  contentStyle?: any;
  menuStyle?: any;
  optionStyle?: any;
  testID?: string;
}

// App's default dropdown with consistent styling
export const Dropdown = <T = any>(props: DropdownInputProps<T>) => (
  <DropdownInput
    inputMode="outlined"
    searchable={true}
    showClearIcon={true}
    showDropdownIcon={true}
    maxHeight={200}
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