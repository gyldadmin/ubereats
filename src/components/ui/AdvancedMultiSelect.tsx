import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import {
  Chip,
  List,
  useTheme,
  Text,
  Surface,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles';
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
  title?: string; // Title for the modal
  label?: string; // Label for the floating label pattern
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Choose...',
  disabled = false,
  title = 'Select Options',
  label,
}) => {
  const paperTheme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedValues, setTempSelectedValues] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<RNTextInput>(null);

  // Get selected options for display as chips
  const selectedOptions = (options || []).filter(option =>
    selectedValues.includes(option.value)
  );

  // Get temp selected options for modal
  const tempSelectedOptions = (options || []).filter(option =>
    tempSelectedValues.includes(option.value)
  );

  // Filter options based on search query AND remove already temp-selected items
  const availableOptions = (options || [])
    .filter(option => !tempSelectedValues.includes(option.value)) // Remove temp selected items
    .filter(option => {
      const query = searchQuery.toLowerCase();
      const fullName = option.label.toLowerCase();
      // Split the full name into parts for first/last name searching
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      return fullName.includes(query) || 
             firstName.includes(query) || 
             lastName.includes(query);
    });

  const openModal = () => {
    if (!disabled && selectedValues.length < 3) {
      // Initialize temp selection with current selection
      setIsFocused(true);
      setTempSelectedValues([...selectedValues]);
      setSearchQuery('');
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsFocused(false);
    setModalVisible(false);
    setSearchQuery('');
    setTempSelectedValues([]);
  };

  const handleAddSelections = () => {
    // Save the temp selections as final selections
    onSelectionChange(tempSelectedValues);
    closeModal();
  };

  const handleOptionPress = (optionValue: any) => {
    // Add to temp selection only if we haven't reached the limit of 3
    setTempSelectedValues(prev => {
      if (prev.length < 3) {
        return [...prev, optionValue];
      }
      return prev;
    });
    setSearchQuery(''); // Clear search after selection
  };

  const removeTempChip = (valueToRemove: any) => {
    setTempSelectedValues(prev => prev.filter(value => value !== valueToRemove));
  };

  const removeMainChip = (valueToRemove: any) => {
    const newSelection = selectedValues.filter(value => value !== valueToRemove);
    onSelectionChange(newSelection);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (modalVisible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [modalVisible]);

  // Paper-style container component (same as EventDateTimePicker)
  const PaperContainer = ({ title, children, style }: { title: string; children: React.ReactNode; style?: any }) => (
    <View style={[styles.paperContainer, style]}>
      <View style={styles.paperTitle}>
        <Text style={[
          styles.paperTitleText, 
          { color: isFocused ? theme.colors.primary : theme.colors.text.tertiary }
        ]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );

  // Check if we should show the floating label (when there are selected values)
  const hasSelectedValues = selectedValues.length > 0;
  const shouldShowFloatingLabel = label && hasSelectedValues;

  return (
    <View style={styles.container}>
      {/* Main input field with chips */}
      {shouldShowFloatingLabel ? (
        <PaperContainer title={label}>
          <TouchableOpacity
            onPress={openModal}
            disabled={disabled || selectedValues.length >= 3}
            style={[
              styles.paperInputContainer,
              (disabled || selectedValues.length >= 3) && styles.disabled,
            ]}
          >
            <View style={styles.contentContainer}>
                          {/* Selected chips */}
            {selectedOptions.map((option) => (
              <Chip
                key={option.value}
                mode="outlined"
                onClose={() => removeMainChip(option.value)}
                style={[
                  styles.chip,
                  { 
                    borderColor: theme.colors.text.tertiary,
                    backgroundColor: theme.colors.background.tertiary
                  }
                ]}
                textStyle={{ color: theme.colors.text.primary, fontSize: 12 }}
                disabled={disabled}
              >
                {option.label}
              </Chip>
            ))}
              
              {selectedValues.length < 3 && selectedOptions.length === 0 && (
                <View style={[
                  styles.placeholderContainer,
                  { flex: 1 }, // Restore flex for initial placeholder height
                ]}>
                  <Text style={[
                    styles.placeholderText,
                    { color: theme.colors.text.tertiary }
                  ]}>
                    {placeholder}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </PaperContainer>
      ) : (
        <TouchableOpacity
          onPress={openModal}
          disabled={disabled || selectedValues.length >= 3}
          style={[
            globalStyles.input, // Applied first
            styles.inputContainer, // Applied second - OVERRIDES globalStyles!
            (disabled || selectedValues.length >= 3) && styles.disabled,
          ]}
        >
          <View style={styles.contentContainer}>
            {/* Selected chips */}
            {selectedOptions.map((option) => (
              <Chip
                key={option.value}
                mode="outlined"
                onClose={() => removeMainChip(option.value)}
                style={[
                  styles.chip,
                  { 
                    borderColor: theme.colors.text.tertiary,
                    backgroundColor: theme.colors.background.tertiary
                  }
                ]}
                textStyle={{ color: theme.colors.text.primary, fontSize: 12 }}
                disabled={disabled}
              >
                {option.label}
              </Chip>
            ))}
            
            {/* Placeholder text area */}
            {selectedValues.length < 3 && selectedOptions.length === 0 && (
              <View style={[
                styles.placeholderContainer,
                { flex: 1 }, // Restore flex for initial placeholder height
              ]}>
                <Text style={[
                  styles.placeholderText,
                  { color: theme.colors.text.tertiary }
                ]}>
                  {(label || placeholder)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Modal popup */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: 50, // Reduced from 100 to 50
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity 
            style={{
              width: '100%',
              maxWidth: 400,
              height: '90%', // Fixed height instead of maxHeight
              backgroundColor: 'white',
              borderRadius: 16,
              overflow: 'hidden',
            }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            }}>
              <TouchableOpacity onPress={closeModal} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
              <Button
                mode="contained"
                onPress={handleAddSelections}
                buttonColor={paperTheme.colors.primary}
              >
                Add
              </Button>
            </View>

            {/* Search input with chips */}
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            }}>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                minHeight: 60, // Changed from 48 to 60 pixels
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: '#f8f8f8',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#13bec7',
              }}>
                {/* Temp selected chips */}
                {tempSelectedOptions.map((option) => (
                  <Chip
                    key={option.value}
                    mode="outlined"
                    onClose={() => removeTempChip(option.value)}
                    style={[
                      styles.chip,
                      { 
                        borderColor: theme.colors.text.tertiary,
                        backgroundColor: theme.colors.background.tertiary
                      }
                    ]}
                    textStyle={{ color: theme.colors.text.primary, fontSize: 12 }}
                  >
                    {option.label}
                  </Chip>
                ))}
                
                {/* Search input */}
                <RNTextInput
                  ref={searchInputRef}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    fontSize: 16,
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    marginLeft: 4,
                  }}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  placeholder="Search options..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline={false}
                />
              </View>
            </View>

            {/* Options list */}
            <ScrollView 
              style={{
                flex: 1,
                backgroundColor: '#f8f8f8',
              }}
              contentContainerStyle={{
                padding: 16,
              }}
              showsVerticalScrollIndicator={true}
            >
              {availableOptions.map((option, index) => {
                const isDisabled = tempSelectedValues.length >= 3;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleOptionPress(option.value)}
                    disabled={isDisabled}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12, // Reduced from 16 (25% reduction)
                      marginVertical: 4,
                      backgroundColor: isDisabled ? '#f8f8f8' : 'white',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                      shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 1,
                      },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    <View style={{
                      width: 22, // Reduced from 30 by 25%
                      height: 22, // Reduced from 30 by 25%
                      borderRadius: 11, // Reduced from 15 by 25%
                      backgroundColor: isDisabled ? '#ccc' : paperTheme.colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons 
                        name="add" 
                        size={12} // Reduced from 15 by 25%
                        color="white" 
                      />
                    </View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: isDisabled ? theme.colors.text.tertiary : theme.colors.text.primary,
                      flex: 1,
                    }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Show message if no options */}
              {availableOptions.length === 0 && (
                <View style={{
                  padding: 40,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 16,
                    color: '#666',
                    textAlign: 'center',
                  }}>
                    {searchQuery ? "No matching options found" : "No options available"}
                  </Text>
                </View>
              )}
              
              {/* Extra spacing at bottom for better scrolling */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  inputContainer: {
    minHeight: 54, // Changed from 56 to 54 to adjust total height
    paddingVertical: 0, // Set to 0 so only global padding applies
    paddingHorizontal: 14, // Add 14px horizontal padding (overrides global 12px)
    justifyContent: 'center', // Add this to center content vertically in the 54px container
  },
  // Paper-style container (same as EventDateTimePicker)
  paperContainer: {
    position: 'relative',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8, // Match globalStyles.input borderRadius (layout.borderRadius.sm)
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    // NO padding - let paperInputContainer handle all spacing
  },
  paperTitle: {
    position: 'absolute',
    top: -10,
    left: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.xs,
    zIndex: 1,
  },
  paperTitleText: {
    fontSize: theme.typography.styles.caption.fontSize,
    fontWeight: '600',
    // Color is now set dynamically in the component
  },
  paperInputContainer: {
    minHeight: 54,
    paddingVertical: 0,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center', // Vertically center chips and placeholder
    minHeight: 24, // Adjusted: 48px total - 12px global padding - 12px for chips = 24px
  },
  chip: {
    marginRight: 6,
    marginBottom: 4,
    marginTop: 4,
  },
  placeholderContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0, // Reverted to 0 to remove extra horizontal padding
    marginLeft: 0,
    justifyContent: 'center',
    minHeight: 24, // Match the contentContainer height
  },
  placeholderText: {
    fontSize: 16,
    lineHeight: 20, // Add explicit line height to help with vertical centering
  },
  disabled: {
    opacity: 0.6,
  },
});