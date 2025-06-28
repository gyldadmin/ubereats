import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../contexts';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuthContext();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#13bec7" />
      </View>
    );
  }

  // Show auth screens if not authenticated, main app if authenticated
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}; 