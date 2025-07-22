import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export interface PopupButton {
  text: string;
  onPress: () => void;
  style?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
}

interface StandardPopupProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  buttons: PopupButton[];
  width?: number;
  height?: number;
  closeOnOverlay?: boolean;
}

export const StandardPopup: React.FC<StandardPopupProps> = ({
  visible,
  onClose,
  title,
  children,
  buttons,
  width = 320,
  height = 280,
  closeOnOverlay = true,
}) => {

  const handleOverlayPress = () => {
    if (closeOnOverlay) {
      onClose();
    }
  };

  const getButtonStyle = (style: PopupButton['style']) => {
    switch (style) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'tertiary':
      default:
        return styles.tertiaryButton;
    }
  };

  const getButtonTextStyle = (style: PopupButton['style'], disabled?: boolean) => {
    if (disabled) {
      return styles.disabledButtonText;
    }
    
    switch (style) {
      case 'primary':
        return styles.primaryButtonText;
      case 'secondary':
        return styles.secondaryButtonText;
      case 'tertiary':
      default:
        return styles.tertiaryButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlayContainer}
        onPress={handleOverlayPress}
        activeOpacity={1}
      >
        <TouchableOpacity 
          style={[styles.popupContainer, { width, height }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()} // Prevent overlay close when touching popup
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  getButtonStyle(button.style),
                  button.disabled && styles.disabledButton
                ]}
                onPress={button.onPress}
                disabled={button.disabled}
              >
                <Text style={getButtonTextStyle(button.style, button.disabled)}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  popupContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Primary button (brand color, white text)
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  
  // Secondary button (light background, dark text)
  secondaryButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  
  // Tertiary button (minimal styling, link-like)
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  tertiaryButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  
  // Disabled state
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
}); 