import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface ErrorPopupProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export default function ErrorPopup({
  visible,
  onClose,
  title = 'Error',
  message = 'Couldn\'t save data. Please try again.',
  buttonText = 'OK'
}: ErrorPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.popupOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.popupContainer}>
          <Text style={styles.popupTitle}>{title}</Text>
          <Text style={styles.popupMessage}>{message}</Text>
          
          <TouchableOpacity 
            style={styles.popupButton}
            onPress={onClose}
          >
            <Text style={styles.popupButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    minHeight: 180,
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
    marginBottom: theme.spacing.lg,
  },
  popupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  popupButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
}); 