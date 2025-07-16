import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import {
  Text,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles';

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
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      setSearchQuery('');
      setModalVisible(true);
    }
  };

  const closeModal = () => {
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

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      {/* Main input field */}
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
            { color: selectedOption ? theme.colors.onSurface : theme.colors.onSurfaceVariant }
          ]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={theme.colors.onSurfaceVariant} 
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

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
                <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Option</Text>
              <View style={styles.closeButton} /> {/* Spacer for centering */}
            </View>

            {/* Search input - no gray lines */}
            <View style={styles.searchContainer}>
              <RNTextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: theme.colors.onSurface }]}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search options..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
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
                  <Text style={[styles.noResultsText, { color: theme.colors.onSurfaceVariant }]}>
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
                      { color: theme.colors.onSurface },
                      value === option.value && { color: theme.colors.primary, fontWeight: 'bold' }
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
    marginBottom: 16,
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
});

export default SearchableDropdown; 