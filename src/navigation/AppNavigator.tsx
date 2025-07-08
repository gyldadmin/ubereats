import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLOR } from '../constants';
import { useAuthStore } from '../stores';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

// Import the screens
import { HomeScreen, RolesScreen, GyldScreen, YouScreen } from '../screens';
import { SignInScreen, SignUpScreen, OnboardingScreen } from '../screens/auth';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main app tabs (shown when authenticated)
function MainTabs() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Tab.Navigator
        id="MainTabs"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Roles') {
              iconName = 'award';
            } else if (route.name === 'Gyld') {
              iconName = 'users';
            } else if (route.name === 'You') {
              iconName = 'user';
            }

            return <Feather name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: BRAND_COLOR,
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: {
            fontSize: 12, // Slightly bigger than default (11px)
            fontWeight: '500',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Roles" component={RolesScreen} />
        <Tab.Screen name="Gyld" component={GyldScreen} />
        <Tab.Screen name="You" component={YouScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// Auth screens (shown when not authenticated)
function AuthStack({ hasLoggedInBefore }: { hasLoggedInBefore: boolean }) {
  // If never logged in from device → show SignUpScreen first
  // If has logged in before but currently logged out → show SignInScreen first
  const initialRouteName = hasLoggedInBefore ? 'SignIn' : 'SignUp';
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Navigator 
        id="AuthStack"
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

// Loading screen
function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.loadingContainer}>
        <Text variant="headlineMedium">Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { user, isLoading, isInitialized, hasLoggedInBefore } = useAuthStore();

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Show main app if authenticated
  if (user) {
    return <MainTabs />;
  }

  // Show auth screens based on whether user has logged in before
  // If never logged in from device → show SignUpScreen
  // If has logged in before but currently logged out → show SignInScreen
  return <AuthStack hasLoggedInBefore={hasLoggedInBefore} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
