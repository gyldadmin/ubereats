import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_COLOR } from '../constants';

// Import the screens
import { HomeScreen, RolesScreen, GyldScreen, YouScreen } from '../screens';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Roles" component={RolesScreen} />
      <Tab.Screen name="Gyld" component={GyldScreen} />
      <Tab.Screen name="You" component={YouScreen} />
    </Tab.Navigator>
  );
} 