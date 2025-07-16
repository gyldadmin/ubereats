import React from 'react';
import { SearchableDropdown as BaseSearchableDropdown } from '../ui';

interface Option {
  value: any;
  label: string;
}

interface SearchableDropdownProps {
  label: string;
  value: any;
  onValueChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
}) => {
  return (
    <BaseSearchableDropdown
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default SearchableDropdown; 