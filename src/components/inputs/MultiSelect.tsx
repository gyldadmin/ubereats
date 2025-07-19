import React from 'react';
import { MultiSelect as AdvancedMultiSelect } from '../ui/inputs';
import { theme } from '../../styles/theme';

interface Option {
  value: any;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: any[];
  onSelectionChange: (selectedValues: any[]) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  label?: string; // Adding label support for floating label pattern
  error?: boolean;
  required?: boolean;
  style?: any;
  testID?: string;
}

// App's default multi-select with consistent styling
export const MultiSelect = (props: MultiSelectProps) => (
  <AdvancedMultiSelect
    placeholder="Choose..."
    title="Select Options"
    {...props}
  />
); 