import React from 'react';
import Constants from 'expo-constants';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLOR } from '../constants';
import { useAuthStore } from '../stores';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Import the screens
import { HomeScreen, RolesScreen, GyldScreen, YouScreen } from '../screens';
import { SignInScreen, SignUpScreen, OnboardingScreen } from '../screens/auth';
import { EventDetailScreen } from '../screens/home/events';
import { 
  GatheringSetupScreen, 
  GatheringManageScreen, 
  GatheringPromoteScreen, 
  GatheringResourcesScreen, 
  MentoringCalendarScreen, 
  MentorFinderScreen 
} from '../screens/host';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Helper function to determine if tab bar should be visible
function getTabBarVisibility(route: any): boolean {
  // Get the currently focused route name from the nested navigation state
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
  
  // Hide tab bar on EventDetail and host screens
  const hostScreens = ['EventDetail', 'GatheringSetup', 'GatheringManage', 'GatheringPromote', 'GatheringResources', 'MentoringCalendar', 'MentorFinder'];
  if (hostScreens.includes(routeName)) {
    return false;
  }
  
  return true;
}

// Custom back button component
function CustomBackButton({ navigation }: { navigation: any }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{
        marginLeft: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6', // Light gray background
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text>←</Text>
    </TouchableOpacity>
  );
}

// Home stack navigator for gathering navigation
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          height: 44, // Set explicit header height
        },
        headerTintColor: BRAND_COLOR,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
        headerLeft: () => <CustomBackButton navigation={navigation} />,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        headerStatusBarHeight: 0, // Remove status bar height from header
      })}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          headerShown: false,
          title: 'Home'
        }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen} 
        options={{ 
          title: '',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="GatheringSetup" 
        component={GatheringSetupScreen} 
        options={{ 
          title: 'Set Up Gathering',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="GatheringManage" 
        component={GatheringManageScreen} 
        options={{ 
          title: 'Manage Gathering',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="GatheringPromote" 
        component={GatheringPromoteScreen} 
        options={{ 
          title: 'Promote Gathering',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="GatheringResources" 
        component={GatheringResourcesScreen} 
        options={{ 
          title: 'Resources',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="MentoringCalendar" 
        component={MentoringCalendarScreen} 
        options={{ 
          title: 'Mentoring Calendar',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="MentorFinder" 
        component={MentorFinderScreen} 
        options={{ 
          title: 'Find a Mentor',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Main app tabs (shown when authenticated)
function MainTabs() {
  return (
    <Tab.Navigator
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

          return <Feather name={iconName as any} size={size} color={color} />;
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
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={({ route }) => ({
          tabBarStyle: {
            display: getTabBarVisibility(route) ? 'flex' : 'none',
          },
        })}
      />
      <Tab.Screen name="Roles" component={RolesScreen} />
      <Tab.Screen name="Gyld" component={GyldScreen} />
      <Tab.Screen name="You" component={YouScreen} />
    </Tab.Navigator>
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
        <PaperText variant="headlineMedium">Loading...</PaperText>
      </View>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { user, isLoading, isInitialized, hasLoggedInBefore } = useAuthStore();

  // In E2E mode, bypass auth and land directly on MainTabs for stable selectors
  const isE2E = (() => {
    try {
      const extra: any = (Constants as any)?.expoConfig?.extra ?? {};
      return (
        process.env.E2E === 'true' ||
        process.env.EXPO_PUBLIC_E2E === 'true' ||
        extra.EXPO_PUBLIC_E2E === 'true'
      );
    } catch {
      return process.env.E2E === 'true' || process.env.EXPO_PUBLIC_E2E === 'true';
    }
  })();

  if (isE2E) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <MainTabs />
      </SafeAreaView>
    );
  }

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Show main app if authenticated
  if (user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <MainTabs />
      </SafeAreaView>
    );
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
