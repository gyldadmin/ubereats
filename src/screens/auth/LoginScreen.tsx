import React, { useState } from 'react';
import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
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

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { signIn, loading, error, clearError } = useAuthContext();

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
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await signIn(email.trim().toLowerCase(), password);
      // Navigation will be handled automatically by auth state change
    } catch (err) {
      // Error is handled by the auth context
      console.log('Login failed:', err);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUpPress = () => {
    navigation.navigate('SignUp');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScreenLayout centered>
        <Card style={componentStyles.standardCard}>
          <Card.Content>
            <Typography variant="h1" align="center">Welcome Back</Typography>
            <Spacer size="xs" />
            <Typography variant="subtitle" align="center" color="secondary">
              Sign in to your Gyld account
            </Typography>
            <Spacer size="lg" />

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
                onPress={handleLogin}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text.inverse}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </View>

            <Button
              mode="text"
              onPress={handleForgotPassword}
              textColor={theme.colors.primary}
              disabled={loading}
            >
              Forgot Password?
            </Button>

            <Spacer size="md" />

            <View style={componentStyles.buttonGroup}>
              <Typography variant="body">Don't have an account? </Typography>
              <Button
                mode="text"
                onPress={handleSignUpPress}
                compact
                textColor={theme.colors.primary}
                disabled={loading}
              >
                Sign Up
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScreenLayout>
    </TouchableWithoutFeedback>
  );
}; 