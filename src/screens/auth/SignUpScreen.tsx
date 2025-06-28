import React, { useState } from 'react';
import { View } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  HelperText,
} from 'react-native-paper';
import { ScreenLayout, Typography, Spacer } from '../../components/ui';
import { componentStyles } from '../../styles/componentStyles';
import { useAuthContext } from '../../contexts';
import { theme } from '../../styles/theme';

interface SignUpScreenProps {
  navigation: any;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { signUp, loading, error, clearError } = useAuthContext();

  const validateFullName = (name: string): boolean => {
    if (!name.trim()) {
      setFullNameError('Full name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setFullNameError('Full name must be at least 2 characters');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      setPasswordError('Password must contain both uppercase and lowercase letters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSignUp = async () => {
    // Clear previous errors
    clearError();
    
    // Validate all inputs
    const isFullNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);
    
    if (!isFullNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim());
      // Show success message or navigate to verification screen
      // For now, navigation will be handled automatically by auth state change
    } catch (err) {
      // Error is handled by the auth context
      console.log('Sign up failed:', err);
    }
  };

  const handleSignInPress = () => {
    navigation.navigate('Login');
  };

  return (
    <ScreenLayout scrollable>
      <Card style={componentStyles.standardCard}>
        <Card.Content>
          <Typography variant="h1" align="center">Join Gyld</Typography>
          <Spacer size="xs" />
          <Typography variant="subtitle" align="center" color="secondary">
            Create your professional network account
          </Typography>
          <Spacer size="lg" />

          <View style={componentStyles.formGroup}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fullNameError) validateFullName(text);
              }}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              style={{
                backgroundColor: theme.colors.background.secondary,
                marginBottom: theme.spacing.xs,
              }}
              outlineColor={theme.colors.border.medium}
              activeOutlineColor={theme.colors.primary}
              error={!!fullNameError}
              disabled={loading}
            />
            <HelperText type="error" visible={!!fullNameError}>
              {fullNameError}
            </HelperText>
          </View>

          <View style={componentStyles.formGroup}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={{
                backgroundColor: theme.colors.background.secondary,
                marginBottom: theme.spacing.xs,
              }}
              outlineColor={theme.colors.border.medium}
              activeOutlineColor={theme.colors.primary}
              error={!!emailError}
              disabled={loading}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>
          </View>

          <View style={componentStyles.formGroup}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) validatePassword(text);
                if (confirmPassword && confirmPasswordError) {
                  validateConfirmPassword(confirmPassword, text);
                }
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(prev => !prev)}
                />
              }
              style={{
                backgroundColor: theme.colors.background.secondary,
                marginBottom: theme.spacing.xs,
              }}
              outlineColor={theme.colors.border.medium}
              activeOutlineColor={theme.colors.primary}
              error={!!passwordError}
              disabled={loading}
            />
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>
          </View>

          <View style={componentStyles.formGroup}>
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) validateConfirmPassword(text, password);
              }}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(prev => !prev)}
                />
              }
              style={{
                backgroundColor: theme.colors.background.secondary,
                marginBottom: theme.spacing.xs,
              }}
              outlineColor={theme.colors.border.medium}
              activeOutlineColor={theme.colors.primary}
              error={!!confirmPasswordError}
              disabled={loading}
            />
            <HelperText type="error" visible={!!confirmPasswordError}>
              {confirmPasswordError}
            </HelperText>
          </View>

          {error && (
            <>
              <HelperText type="error" visible={true} style={{ textAlign: 'center' }}>
                {error}
              </HelperText>
              <Spacer size="md" />
            </>
          )}

          <View style={componentStyles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSignUp}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.text.inverse}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </View>

          <Spacer size="md" />

          <View style={componentStyles.buttonGroup}>
            <Typography variant="body">Already have an account? </Typography>
            <Button
              mode="text"
              onPress={handleSignInPress}
              compact
              textColor={theme.colors.primary}
              disabled={loading}
            >
              Sign In
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScreenLayout>
  );
}; 