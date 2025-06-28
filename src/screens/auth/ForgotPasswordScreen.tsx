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

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword, loading, error, clearError } = useAuthContext();

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

  const handleResetPassword = async () => {
    clearError();
    
    if (!validateEmail(email)) {
      return;
    }

    try {
      await resetPassword(email.trim().toLowerCase());
      setEmailSent(true);
    } catch (err) {
      console.log('Password reset failed:', err);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <ScreenLayout centered>
        <Card style={componentStyles.standardCard}>
          <Card.Content>
            <Typography variant="h1" align="center">Check Your Email</Typography>
            <Spacer size="xs" />
            <Typography variant="subtitle" align="center" color="secondary">
              We've sent a password reset link to {email}
            </Typography>
            <Spacer size="lg" />
            <Typography variant="body" align="center" color="secondary">
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </Typography>
            <Spacer size="xl" />
            <View style={componentStyles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleBackToLogin}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text.inverse}
              >
                Back to Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout centered>
      <Card style={componentStyles.standardCard}>
        <Card.Content>
          <Typography variant="h1" align="center">Reset Password</Typography>
          <Spacer size="xs" />
          <Typography variant="subtitle" align="center" color="secondary">
            Enter your email address and we'll send you a link to reset your password
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
              onPress={handleResetPassword}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.text.inverse}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </View>

          <Button
            mode="text"
            onPress={handleBackToLogin}
            textColor={theme.colors.primary}
            disabled={loading}
          >
            Back to Sign In
          </Button>
        </Card.Content>
      </Card>
    </ScreenLayout>
  );
}; 