import React from 'react';
import { PaperDropdown as BasePaperDropdown } from '../ui';

interface DropdownOption {
  value: string;
  label: string;
}

interface PaperDropdownProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  mode?: 'outlined' | 'flat';
  backgroundColor?: string;
  menuBackgroundColor?: string;
  menuMaxWidth?: number;
  menuMinWidth?: number;
}

export default function PaperDropdown(props: PaperDropdownProps) {
  return <BasePaperDropdown {...props} />;
}

// Export the interface for use in other components
export type { DropdownOption, PaperDropdownProps }; 