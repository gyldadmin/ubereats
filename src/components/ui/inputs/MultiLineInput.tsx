import React from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { TextInput } from 'react-native-paper';
import { theme } from '../../../styles/theme';

interface MultiLineInputProps {
  // Core functionality
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onValueChange?: (text: string) => void; // Support both prop names
  placeholder?: string;
  
  // Multi-line specific
  multiline?: boolean;
  numberOfLines?: number;
  minHeight?: number;
  maxHeight?: number;
  
  // Input behavior
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  
  // Validation & states
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  // Appearance
  mode?: 'outlined' | 'flat';
  dense?: boolean;
  
  // Colors & theming
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  
  // Character count
  showCharacterCount?: boolean;
  characterCountPosition?: 'bottom-right' | 'bottom-left';
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
  onContentSizeChange?: (event: any) => void;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // Styling
  style?: any;
  contentStyle?: any;
  
  // Testing
  testID?: string;
}

export default function MultiLineInput({
  label = 'Label',
  value,
  onChangeText,
  onValueChange,
  placeholder = 'Type',
  multiline = true,
  numberOfLines = 4,
  minHeight = 72, // 3 lines of 24px each (typical line height)
  maxHeight = 200,
  error = false,
  disabled = false,
  autoCapitalize = 'sentences',
  maxLength,
  required,
  mode = 'outlined',
  dense = false,
  textColor,
  backgroundColor,
  outlineColor,
  activeOutlineColor,
  showCharacterCount = false,
  characterCountPosition = 'bottom-right',
  onFocus,
  onBlur,
  onContentSizeChange,
  accessibilityLabel,
  accessibilityHint,
  style,
  contentStyle,
  testID,
}: MultiLineInputProps) {
  // Support both prop names for backwards compatibility
  const handleChange = onChangeText || onValueChange;
  
  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        mode={mode}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        error={error}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        dense={dense}
        onFocus={onFocus}
        onBlur={onBlur}
        onContentSizeChange={onContentSizeChange}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        render={props => (
          <RNTextInput
            {...props}
            multiline={multiline}
            scrollEnabled={false} // Force expansion instead of scrolling
            onContentSizeChange={(event) => {
              // Forward the event to the parent component
              onContentSizeChange?.(event);
            }}
            style={[
              props.style,
              {
                minHeight: Math.max(minHeight, 40),
                maxHeight,
                textAlignVertical: 'top', // Align text to top for multiline
              }
            ]}
          />
        )}
        style={[
          styles.input,
          {
            backgroundColor: backgroundColor || theme.colors.background.secondary,
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
      />
      {showCharacterCount && maxLength && (
        <View style={[
          styles.characterCountContainer,
          characterCountPosition === 'bottom-left' && styles.characterCountLeft
        ]}>
          <View style={styles.characterCount}>
            <TextInput.Affix
              text={`${value.length}/${maxLength}`}
              textStyle={[
                styles.characterCountText,
                value.length > maxLength * 0.9 && styles.characterCountWarning,
                value.length >= maxLength && styles.characterCountError,
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  characterCountLeft: {
    alignItems: 'flex-start',
  },
  characterCount: {
    paddingHorizontal: theme.spacing.sm,
  },
  characterCountText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  characterCountWarning: {
    color: theme.colors.warning || '#f39c12',
  },
  characterCountError: {
    color: theme.colors.error || '#e74c3c',
  },
}); 