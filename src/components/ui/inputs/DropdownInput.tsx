import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Menu, useTheme } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

interface DropdownOption<T = any> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface DropdownInputProps<T = any> {
  // Core functionality
  label: string;
  value: T | undefined;
  onValueChange: (value: T | undefined) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  
  // Search functionality
  searchable?: boolean;
  searchPlaceholder?: string;
  filterFunction?: (option: DropdownOption<T>, query: string) => boolean;
  
  // Validation & states
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  // Appearance
  inputMode?: 'outlined' | 'flat';
  dense?: boolean;
  
  // Colors & theming
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  
  // Icons
  dropdownIcon?: string;
  clearIcon?: string;
  showDropdownIcon?: boolean;
  showClearIcon?: boolean;
  
  // Menu behavior
  maxHeight?: number;
  animationType?: 'slide' | 'fade' | 'none';
  
  // Option rendering
  renderOption?: (option: DropdownOption<T>) => React.ReactNode;
  getOptionLabel?: (option: DropdownOption<T>) => string;
  getOptionValue?: (option: DropdownOption<T>) => T;
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onSearch?: (query: string) => void;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // Styling
  style?: any;
  contentStyle?: any;
  menuStyle?: any;
  optionStyle?: any;
  
  // Testing
  testID?: string;
}

export default function DropdownInput<T = any>({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  searchable = false,
  searchPlaceholder = 'Search...',
  filterFunction,
  error = false,
  disabled = false,
  required,
  inputMode = 'outlined',
  dense = false,
  textColor,
  backgroundColor,
  outlineColor,
  activeOutlineColor,
  dropdownIcon = 'chevron-down',
  clearIcon = 'x',
  showDropdownIcon = true,
  showClearIcon = true,
  maxHeight = 200,
  renderOption,
  getOptionLabel,
  getOptionValue,
  onFocus,
  onBlur,
  onMenuOpen,
  onMenuClose,
  onSearch,
  accessibilityLabel,
  accessibilityHint,
  style,
  contentStyle,
  menuStyle,
  optionStyle,
  testID,
}: DropdownInputProps<T>) {
  const paperTheme = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<any>(null);

  // Get selected option
  const selectedOption = options.find(option => 
    (getOptionValue ? getOptionValue(option) : option.value) === value
  );

  // Get display label
  const getLabel = (option: DropdownOption<T>) => {
    if (getOptionLabel) return getOptionLabel(option);
    return option.label;
  };

  // Get option value
  const getValue = (option: DropdownOption<T>) => {
    if (getOptionValue) return getOptionValue(option);
    return option.value;
  };

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => {
        if (filterFunction) {
          return filterFunction(option, searchQuery);
        }
        return getLabel(option).toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  const handlePress = () => {
    if (disabled) return;
    
    setVisible(true);
    onFocus?.();
    onMenuOpen?.();
  };

  const handleMenuClose = () => {
    setVisible(false);
    setSearchQuery('');
    onBlur?.();
    onMenuClose?.();
  };

  const handleOptionPress = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    
    onValueChange(getValue(option));
    handleMenuClose();
  };

  const handleClear = () => {
    onValueChange(undefined);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={handleMenuClose}
        anchor={
          <TouchableOpacity onPress={handlePress} disabled={disabled}>
            <TextInput
              ref={inputRef}
              label={label}
              value={selectedOption ? getLabel(selectedOption) : ''}
              placeholder={placeholder}
              mode={inputMode}
              disabled={disabled}
              error={error}
              dense={dense}
              editable={false}
              pointerEvents="none"
              accessibilityLabel={accessibilityLabel}
              accessibilityHint={accessibilityHint}
              testID={testID}
              style={[
                styles.input,
                {
                  backgroundColor: backgroundColor || theme.colors.background.secondary,
                  minHeight: 60,
                },
                style,
              ]}
              outlineStyle={{ borderRadius: 6 }}
              contentStyle={[
                {
                  color: textColor || theme.colors.text.primary,
                },
                contentStyle,
              ]}
              outlineColor={outlineColor || theme.colors.border.light}
              activeOutlineColor={activeOutlineColor || theme.colors.primary}
              left={
                selectedOption?.icon ? (
                  <TextInput.Icon
                    icon={() => (
                      <Feather
                        name={selectedOption.icon as any}
                        size={20}
                        color={disabled ? theme.colors.text.disabled : theme.colors.text.secondary}
                      />
                    )}
                  />
                ) : undefined
              }
              right={
                <>
                  {showClearIcon && selectedOption && (
                    <TextInput.Icon
                      icon={() => (
                        <Feather
                          name={clearIcon as any}
                          size={16}
                          color={theme.colors.text.secondary}
                        />
                      )}
                      onPress={handleClear}
                    />
                  )}
                  {showDropdownIcon && (
                    <TextInput.Icon
                      icon={() => (
                        <Feather
                          name={dropdownIcon as any}
                          size={20}
                          color={disabled ? theme.colors.text.disabled : theme.colors.text.secondary}
                        />
                      )}
                      onPress={handlePress}
                    />
                  )}
                </>
              }
            />
          </TouchableOpacity>
        }
        contentStyle={[
          {
            maxHeight,
            minWidth: 200,
          },
          menuStyle,
        ]}
      >
        {searchable && (
          <View style={styles.searchContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={searchPlaceholder}
              mode="outlined"
              dense
              style={styles.searchInput}
              left={
                <TextInput.Icon
                  icon={() => (
                    <Feather name="search" size={16} color={theme.colors.text.secondary} />
                  )}
                />
              }
            />
          </View>
        )}
        
        <ScrollView style={{ maxHeight: maxHeight - (searchable ? 60 : 0) }}>
          {filteredOptions.map((option, index) => (
            <Menu.Item
              key={index}
              title={getLabel(option)}
              onPress={() => handleOptionPress(option)}
              disabled={option.disabled}
              leadingIcon={option.icon ? () => (
                <Feather
                  name={option.icon as any}
                  size={20}
                  color={option.disabled ? theme.colors.text.disabled : theme.colors.text.secondary}
                />
              ) : undefined}
              style={[
                optionStyle,
                option.disabled && { opacity: 0.5 },
              ]}
            />
          ))}
        </ScrollView>
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
  },
  searchContainer: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  searchInput: {
    marginBottom: 0,
  },
}); 