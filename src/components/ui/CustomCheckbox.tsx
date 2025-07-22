import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { theme } from '../../styles/theme';
import { BRAND_COLOR } from '../../constants/theme';

interface CustomCheckboxProps {
  label?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  status?: 'checked' | 'unchecked' | 'indeterminate';
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  color?: string;
  uncheckedColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  labelStyle?: any;
  testID?: string;
}

export const CustomCheckbox = ({
  label,
  value,
  onValueChange,
  status,
  disabled = false,
  error = false,
  required,
  color,
  uncheckedColor,
  accessibilityLabel,
  accessibilityHint,
  style,
  labelStyle,
  testID,
}: CustomCheckboxProps) => {
  // Determine status from value if not explicitly provided
  const checkboxStatus = status || (value ? 'checked' : 'unchecked');
  const isChecked = checkboxStatus === 'checked';

  const handlePress = () => {
    if (disabled) return;
    
    if (onValueChange) {
      onValueChange(!isChecked);
    }
  };

  const checkboxColor = color || BRAND_COLOR;
  const borderColor = isChecked ? checkboxColor : (uncheckedColor || theme.colors.border.light);
  const backgroundColor = isChecked ? checkboxColor : 'transparent';

  return (
    <View style={[{ marginBottom: theme.spacing.md }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          opacity: disabled ? 0.5 : 1,
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        <View style={{
          width: 20,
          height: 20,
          borderWidth: 1,
          borderColor: error ? theme.colors.status.error : borderColor,
          borderRadius: 2,
          backgroundColor: backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: theme.spacing.sm,
        }}>
          {isChecked && (
            <View style={{
              width: 6,
              height: 10,
              borderRightWidth: 2,
              borderBottomWidth: 2,
              borderColor: 'white',
              transform: [{ rotate: '45deg' }],
              marginTop: -2,
            }} />
          )}
        </View>
        
        {label && (
          <Text 
            style={[
              {
                fontSize: theme.typography.sizes.md,
                fontWeight: theme.typography.weights.medium,
                color: error ? theme.colors.status.error : 
                       disabled ? theme.colors.text.tertiary : 
                       theme.colors.text.primary,
                flex: 1,
              },
              labelStyle,
            ]}
          >
            {label}
            {required && <Text style={{ color: theme.colors.status.error }}> *</Text>}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CustomCheckbox; 