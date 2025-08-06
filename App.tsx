import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Initialize auth store when app starts
    initialize();
  }, [initialize]);

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