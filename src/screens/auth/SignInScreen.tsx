import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../stores';

interface SignInScreenProps {
  navigation?: any;
}

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, resetPassword, isLoading } = useAuthStore();

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle sign in
  const handleSignIn = async () => {
    setError('');
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }

    // Attempt sign in
    const result = await signIn(email, password);
    
    if (result.error) {
      setError(result.error);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }
    
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    const result = await resetPassword(email);
    
    if (result.error) {
      setError(result.error);
    } else {
      Alert.alert(
        'Password Reset Sent',
        'Check your email for password reset instructions.',
        [{ text: 'OK' }]
      );
    }
  };

  // Navigate to sign up
  const navigateToSignUp = () => {
    if (navigation) {
      navigation.navigate('SignUp');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Welcome Back
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sign in to your account
        </Text>
      </View>

      <View style={styles.form}>
        {/* Email Input */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          outlineColor={theme.colors.border.light}
          activeOutlineColor={theme.colors.primary}
          error={error.includes('email') || error.includes('Email')}
        />

        {/* Password Input */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          style={styles.input}
          outlineColor={theme.colors.border.light}
          activeOutlineColor={theme.colors.primary}
          error={error.includes('password') || error.includes('Password')}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        {/* Error Message */}
        {error ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {/* Sign In Button */}
        <Button
          mode="contained"
          onPress={handleSignIn}
          loading={isLoading}
          disabled={isLoading}
          style={styles.signInButton}
          contentStyle={styles.buttonContent}
        >
          Sign In
        </Button>

        {/* Password Reset Link */}
        <TouchableOpacity onPress={handlePasswordReset} disabled={isLoading}>
          <Text variant="bodyMedium" style={styles.resetLink}>
            Forgot your password?
          </Text>
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      {/* Sign Up Link */}
      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.footerText}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
          <Text variant="bodyMedium" style={styles.signUpLink}>
            Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
  },
  errorText: {
    color: theme.colors.status.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  signInButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    height: 48,
  },
  resetLink: {
    color: theme.colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  divider: {
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.border.light,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.text.secondary,
  },
  signUpLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 