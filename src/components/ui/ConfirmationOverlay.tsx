import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface ConfirmationOverlayProps {
  visible: boolean;
  title?: string;
  message?: string;
  saveLabel?: string;
  discardLabel?: string;
  onSave: () => void;
  onDiscard: () => void;
}

// Absolute-position overlay that blocks interaction and asks the user to save or discard.
// Re-used by all Gathering-Setup sliders so behaviour and styling stay consistent.
export const ConfirmationOverlay: React.FC<ConfirmationOverlayProps> = ({
  visible,
  title = 'Save changes?',
  message = 'You have unsaved changes that will be lost if you discard.',
  saveLabel = 'Save',
  discardLabel = 'Discard',
  onSave,
  onDiscard,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.discardButton} onPress={onDiscard}>
            <Text style={styles.discardText}>{discardLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveText}>{saveLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  discardButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
});

export default ConfirmationOverlay; 