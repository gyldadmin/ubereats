import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import {
  Text,
  useTheme,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { globalStyles } from '../../styles';
import { theme } from '../../styles/theme';

interface Option {
  value: any;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: any;
  onValueChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  disabled = false,
  label,
}) => {
  const paperTheme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<RNTextInput>(null);

  // Get selected option for display
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    const query = searchQuery.toLowerCase();
    const optionLabel = option.label.toLowerCase();
    return optionLabel.includes(query);
  });

  const openModal = () => {
    if (!disabled) {
      setIsFocused(true);
      setSearchQuery('');
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsFocused(false);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleOptionPress = (optionValue: any) => {
    onValueChange(optionValue);
    closeModal(); // Auto-close on selection
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

  // Paper-style container component (same as EventDateTimePicker and MultiSelect)
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

  // Check if we should show the floating label (when there's a selected value)
  const hasSelectedValue = selectedOption !== undefined;
  const shouldShowFloatingLabel = label && hasSelectedValue && typeof label === 'string';

  return (
    <View style={styles.container}>
      {/* Main input field */}
      {shouldShowFloatingLabel ? (
        <PaperContainer title={label!}>
          <TouchableOpacity
            onPress={openModal}
            disabled={disabled}
            style={[
              styles.paperInputContainer,
              disabled && styles.disabled,
            ]}
          >
            <View style={styles.contentContainer}>
              <Text style={[
                styles.displayText,
                !selectedOption && styles.placeholderText,
                { color: selectedOption ? paperTheme.colors.onSurface : theme.colors.text.secondary }
              ]}>
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
              <MaterialIcons 
                name="keyboard-arrow-down" 
                size={20} 
                color={theme.colors.text.tertiary} 
                style={styles.chevron}
              />
            </View>
          </TouchableOpacity>
        </PaperContainer>
      ) : (
        <TouchableOpacity
          onPress={openModal}
          disabled={disabled}
          style={[
            globalStyles.input,
            styles.inputContainer,
            disabled && styles.disabled,
          ]}
        >
          <View style={styles.contentContainer}>
            <Text style={[
              styles.displayText,
              !selectedOption && styles.placeholderText,
              { color: selectedOption ? paperTheme.colors.onSurface : theme.colors.text.secondary }
            ]}>
              {selectedOption ? selectedOption.label : (label || placeholder)}
            </Text>
            <MaterialIcons 
              name="keyboard-arrow-down" 
              size={20} 
              color={theme.colors.text.tertiary} 
              style={styles.chevron}
            />
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal header - simplified, no buttons */}
            <View style={styles.modalHeader}>
                          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Option</Text>
              <View style={styles.closeButton} />
            </View>

            {/* Search input - no gray lines */}
            <View style={styles.searchContainer}>
              <RNTextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: paperTheme.colors.onSurface }]}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search options..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline={false}
              />
            </View>

            {/* Options list - simple list without cards */}
            <ScrollView 
              style={styles.optionsList}
              showsVerticalScrollIndicator={true}
            >
              {filteredOptions.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={[styles.noResultsText, { color: theme.colors.text.tertiary }]}>
                    No options found
                  </Text>
                </View>
              ) : (
                filteredOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleOptionPress(option.value)}
                    style={[
                      styles.optionItem,
                      value === option.value && styles.selectedOptionItem,
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: paperTheme.colors.onSurface },
                      value === option.value && { color: paperTheme.colors.primary, fontWeight: 'bold' }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 54,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: 48,
  },
  optionsList: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOptionItem: {
    backgroundColor: '#f0f9ff',
  },
  optionText: {
    fontSize: 16,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Paper-style container (same as EventDateTimePicker and MultiSelect)
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
});

export default SearchableDropdown; 