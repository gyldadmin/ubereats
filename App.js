import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Import the views
import HomeView from './src/components/views/HomeView';
import RolesView from './src/components/views/RolesView';
import GyldView from './src/components/views/GyldView';
import YouView from './src/components/views/YouView';

const Tab = createBottomTabNavigator();

// Brand colors
const BRAND_COLOR = '#13bec7'; // Brand teal color

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Roles') {
              iconName = focused ? 'shield' : 'shield-outline';
            } else if (route.name === 'Gyld') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'You') {
              iconName = focused ? 'person-circle' : 'person-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: BRAND_COLOR,
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeView} />
        <Tab.Screen name="Roles" component={RolesView} />
        <Tab.Screen name="Gyld" component={GyldView} />
        <Tab.Screen name="You" component={YouView} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}