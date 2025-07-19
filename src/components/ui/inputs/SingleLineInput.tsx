import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { theme } from '../../../styles/theme';

interface SingleLineInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onValueChange?: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  maxLength?: number;
  mode?: 'outlined' | 'flat';
  dense?: boolean;
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  blurOnSubmit?: boolean;
  selectTextOnFocus?: boolean;
  style?: any;
  contentStyle?: any;
  testID?: string;
  secureTextEntry?: boolean;
}

// Single-line text input primitive component
const SingleLineInput = (props: SingleLineInputProps) => {
  const paperTheme = useTheme();
  
  // Handle both onChangeText and onValueChange for flexibility
  const handleTextChange = (text: string) => {
    if (props.onChangeText) {
      props.onChangeText(text);
    }
    if (props.onValueChange) {
      props.onValueChange(text);
    }
  };

  return (
    <View style={[styles.container, props.style]}>
      <TextInput
        label={props.label}
        value={props.value}
        onChangeText={handleTextChange}
        placeholder={props.placeholder}
        error={props.error}
        disabled={props.disabled}
        autoCapitalize={props.autoCapitalize}
        keyboardType={props.keyboardType}
        maxLength={props.maxLength}
        mode={props.mode || 'outlined'}
        dense={props.dense}
        textColor={props.textColor}
        style={[
          styles.input,
          {
            backgroundColor: props.backgroundColor || theme.colors.background.secondary,
            minHeight: 60,
          },
          props.contentStyle
        ]}
        outlineStyle={{ borderRadius: 6 }}
        theme={{
          colors: {
            outline: props.outlineColor || theme.colors.border.light,
            primary: props.activeOutlineColor || theme.colors.primary,
          },
        }}
        left={props.left}
        right={props.right}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onSubmitEditing={props.onSubmitEditing}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        returnKeyType={props.returnKeyType}
        blurOnSubmit={props.blurOnSubmit}
        selectTextOnFocus={props.selectTextOnFocus}
        testID={props.testID}
        secureTextEntry={props.secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  input: {
    minHeight: 60,
    fontSize: 16,
  },
});

export default SingleLineInput; 