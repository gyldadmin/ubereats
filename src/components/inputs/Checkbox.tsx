import React from 'react';
import { CustomCheckbox } from '../ui/CustomCheckbox';

interface CheckboxProps {
  label?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  status?: 'checked' | 'unchecked' | 'indeterminate';
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  color?: string;
  uncheckedColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  labelStyle?: any;
  testID?: string;
}

// App's default checkbox with consistent styling
export const Checkbox = (props: CheckboxProps) => {
  return <CustomCheckbox {...props} />;
};

export default Checkbox; 