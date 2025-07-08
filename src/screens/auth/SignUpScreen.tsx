import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../stores';

interface SignUpScreenProps {
  navigation?: any;
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp, isLoading } = useAuthStore();

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle sign up
  const handleSignUp = async () => {
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

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Attempt sign up
    const result = await signUp(email, password);
    
    if (result.error) {
      setError(result.error);
    } else {
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account before signing in.',
        [{ text: 'OK' }]
      );
    }
  };

  // Navigate to sign in
  const navigateToSignIn = () => {
    if (navigation) {
      navigation.navigate('SignIn');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sign up to get started
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
          autoComplete="password-new"
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

        {/* Password Requirements */}
        <Text variant="bodySmall" style={styles.helpText}>
          Password must be at least 6 characters long
        </Text>

        {/* Error Message */}
        {error ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {/* Sign Up Button */}
        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={isLoading}
          disabled={isLoading}
          style={styles.signUpButton}
          contentStyle={styles.buttonContent}
        >
          Create Account
        </Button>
      </View>

      <Divider style={styles.divider} />

      {/* Sign In Link */}
      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.footerText}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={navigateToSignIn} disabled={isLoading}>
          <Text variant="bodyMedium" style={styles.signInLink}>
            Sign in
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
  helpText: {
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.status.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  signUpButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    height: 48,
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
  signInLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 