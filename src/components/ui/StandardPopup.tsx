import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

export type ButtonStyle = 'primary' | 'secondary' | 'destructive';

export interface ButtonConfig {
  text: string;
  onPress: () => void;
  style?: ButtonStyle;
  disabled?: boolean;
}

interface StandardPopupProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons: 1 | 2;
  primaryButton: ButtonConfig;
  secondaryButton?: ButtonConfig; // Required when buttons = 2
  closeOnOverlayTap?: boolean;
  showCloseButton?: boolean;
}

export const StandardPopup: React.FC<StandardPopupProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons,
  primaryButton,
  secondaryButton,
  closeOnOverlayTap = true,
  showCloseButton = true,
}) => {
  const handleOverlayPress = () => {
    if (closeOnOverlayTap) {
      onClose();
    }
  };

  const getButtonStyles = (buttonStyle: ButtonStyle = 'primary', disabled: boolean = false) => {
    let buttonStyles: any[] = [styles.button];
    let textStyles: any[] = [styles.buttonText];

    switch (buttonStyle) {
      case 'primary':
        buttonStyles.push(disabled ? styles.buttonPrimaryDisabled : styles.buttonPrimary);
        textStyles.push(disabled ? styles.buttonTextPrimaryDisabled : styles.buttonTextPrimary);
        break;
      case 'secondary':
        buttonStyles.push(disabled ? styles.buttonSecondaryDisabled : styles.buttonSecondary);
        textStyles.push(disabled ? styles.buttonTextSecondaryDisabled : styles.buttonTextSecondary);
        break;
      case 'destructive':
        buttonStyles.push(disabled ? styles.buttonDestructiveDisabled : styles.buttonDestructive);
        textStyles.push(disabled ? styles.buttonTextDestructiveDisabled : styles.buttonTextDestructive);
        break;
    }

    return { buttonStyle: buttonStyles, textStyle: textStyles };
  };

  const renderButton = (config: ButtonConfig, isSecondary: boolean = false) => {
    const { buttonStyle, textStyle } = getButtonStyles(config.style, config.disabled);
    
    return (
      <TouchableOpacity
        key={isSecondary ? 'secondary' : 'primary'}
        style={[buttonStyle, buttons === 2 && styles.buttonHalfWidth]}
        onPress={config.onPress}
        disabled={config.disabled}
        activeOpacity={0.8}
      >
        <Text style={textStyle}>{config.text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={handleOverlayPress}
      >
        <TouchableOpacity 
          style={styles.popupContainer} 
          activeOpacity={1}
          onPress={() => {}} // Prevent closing when tapping inside popup
        >
          {/* Close button X in top-right corner */}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Button area */}
          <View style={[
            styles.buttonContainer,
            buttons === 2 ? styles.buttonContainerTwoButtons : styles.buttonContainerOneButton
          ]}>
            {buttons === 2 && secondaryButton && (
              <>
                {renderButton(secondaryButton, true)}
                {renderButton(primaryButton, false)}
              </>
            )}
            {buttons === 1 && renderButton(primaryButton, false)}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  popupContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    width: 320,
    minHeight: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
    padding: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.lg + theme.spacing.lg, // Extra space for X button
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  message: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  buttonContainerOneButton: {
    // Single button takes full width
  },
  buttonContainerTwoButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonHalfWidth: {
    flex: 1, // For two-button layout
  },
  buttonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  
  // Primary button styles
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonPrimaryDisabled: {
    backgroundColor: 'rgba(19, 190, 199, 0.35)',
  },
  buttonTextPrimary: {
    color: theme.colors.text.inverse,
  },
  buttonTextPrimaryDisabled: {
    color: theme.colors.text.secondary,
  },
  
  // Secondary button styles
  buttonSecondary: {
    backgroundColor: theme.colors.background.tertiary,
  },
  buttonSecondaryDisabled: {
    backgroundColor: theme.colors.background.tertiary,
    opacity: 0.5,
  },
  buttonTextSecondary: {
    color: theme.colors.text.secondary,
  },
  buttonTextSecondaryDisabled: {
    color: theme.colors.text.secondary,
    opacity: 0.5,
  },
  
  // Destructive button styles
  buttonDestructive: {
    backgroundColor: '#dc3545', // Red color for dangerous actions
  },
  buttonDestructiveDisabled: {
    backgroundColor: '#dc3545',
    opacity: 0.5,
  },
  buttonTextDestructive: {
    color: '#ffffff',
  },
  buttonTextDestructiveDisabled: {
    color: '#ffffff',
    opacity: 0.5,
  },
});

export default StandardPopup; 