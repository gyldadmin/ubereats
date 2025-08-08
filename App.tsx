import React, { useEffect } from 'react';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores';
import { colors } from './src/styles/colors';

// Configure React Native Paper to use @expo/vector-icons
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.primaryLight,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    outline: colors.border.light,
    outlineVariant: colors.border.medium,
  },
};

// Configure icons for React Native Paper
const settings = {
  icon: (props: any) => <MaterialCommunityIcons {...props} />,
};

// Configure notification handler to show notifications while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const initialize = useAuthStore(state => state.initialize);
  const signIn = useAuthStore(state => state.signIn);

  useEffect(() => {
    // Initialize auth store when app starts
    initialize();
  }, [initialize]);

  // E2E: auto sign-in a test user so DB writes run under a real session
  useEffect(() => {
    const maybeSignIn = async () => {
      try {
        const extra: any = (Constants as any)?.expoConfig?.extra ?? {};
        const isE2E =
          process.env.E2E === 'true' ||
          process.env.EXPO_PUBLIC_E2E === 'true' ||
          extra.EXPO_PUBLIC_E2E === 'true';
        const email = extra.EXPO_PUBLIC_E2E_EMAIL || process.env.EXPO_PUBLIC_E2E_EMAIL;
        const password = extra.EXPO_PUBLIC_E2E_PASSWORD || process.env.EXPO_PUBLIC_E2E_PASSWORD;
        if (isE2E && email && password) {
          await signIn(email, password);
        }
      } catch {}
    };
    maybeSignIn();
  }, [signIn]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme} settings={settings}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}