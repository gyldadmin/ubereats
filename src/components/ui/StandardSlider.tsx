import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface StandardSliderProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export default function StandardSlider({
  visible,
  onClose,
  title,
  hasUnsavedChanges,
  onSave,
  onCancel,
  children
}: StandardSliderProps) {
  const [showSaveChangesPopup, setShowSaveChangesPopup] = useState(false);

  // Handle slider close
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowSaveChangesPopup(true);
    } else {
      onClose();
    }
  };

  // Handle save changes popup responses
  const handleSaveChanges = () => {
    onSave();
    setShowSaveChangesPopup(false);
    onClose();
  };

  const handleDiscardChanges = () => {
    onCancel();
    setShowSaveChangesPopup(false);
    onClose();
  };

  return (
    <>
      {/* Main Slider Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Content */}
            {children}
          </ScrollView>

          {/* Fixed bottom buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !hasUnsavedChanges && styles.saveButtonInactive
              ]}
              onPress={onSave}
              disabled={!hasUnsavedChanges}
            >
              <Text style={[
                styles.saveButtonText,
                !hasUnsavedChanges && styles.saveButtonTextInactive
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save Changes Confirmation Popup */}
      <Modal
        visible={showSaveChangesPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveChangesPopup(false)}
      >
        <TouchableOpacity 
          style={styles.popupOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSaveChangesPopup(false)}
        >
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>Save Changes?</Text>
            <Text style={styles.popupMessage}>
              You have unsaved changes that will be lost if you continue.
            </Text>
            
            <View style={styles.popupButtons}>
              <TouchableOpacity 
                style={styles.popupNoButton}
                onPress={handleDiscardChanges}
              >
                <Text style={styles.popupNoButtonText}>No</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.popupYesButton}
                onPress={handleSaveChanges}
              >
                <Text style={styles.popupYesButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  
  // Title using EventDetailScreen pattern
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginTop: 5, // Reduced from 20 to 5 pixels for 45px total spacing (16+8+16+5)
    marginBottom: 16,
  },

  // Fixed bottom buttons
  modalButtons: {
    flexDirection: 'row',
    padding: theme.spacing.lg + 20, // Add 20px more space
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center', // Center buttons vertically in the larger space
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary, // Brand color when hasUnsavedChanges is true
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInactive: {
    backgroundColor: 'rgba(19, 190, 199, 0.35)', // Brand color at 35% opacity when hasUnsavedChanges is false
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
  saveButtonTextInactive: {
    color: theme.colors.text.secondary,
  },

  // Save Changes Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    width: 320,
    height: 240,
    elevation: 8,
    justifyContent: 'space-between',
  },
  popupTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  popupMessage: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  popupNoButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  popupNoButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  popupYesButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  popupYesButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
}); 
