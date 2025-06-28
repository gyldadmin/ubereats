/**
 * Global State Demo Component
 * Shows different ways to use the Zustand global state
 * Remove this file once you're familiar with the patterns
 */

import React from 'react';
import { View } from 'react-native';
import { Button, Switch } from 'react-native-paper';
import { ScreenLayout, Typography, Spacer } from '../ui';
import { componentStyles } from '../../styles/componentStyles';
import { 
  useGlobalState, 
  useUserState, 
  useAppSettings, 
  useLoadingState, 
  useCacheState 
} from '../../hooks/useGlobalState';

export const GlobalStateDemo: React.FC = () => {
  // Method 1: Use specific hooks for better performance
  const { user, isAuthenticated, setUser } = useUserState();
  const { settings, setTheme, toggleNotifications } = useAppSettings();
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const { cache, updateRestaurants, isCacheStale } = useCacheState();

  // Method 2: Use the main hook for multiple pieces of state
  // const globalState = useGlobalState();

  const handleCreateTestUser = () => {
    setUser({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      userStatus: 'active',
    });
  };

  const handleClearUser = () => {
    setUser(null);
  };

  const handleTestLoading = async () => {
    startLoading();
    await new Promise(resolve => setTimeout(resolve, 2000));
    stopLoading();
  };

  const handleUpdateCache = () => {
    updateRestaurants([
      { id: 1, name: 'Test Restaurant', rating: 4.5 },
      { id: 2, name: 'Another Restaurant', rating: 4.0 },
    ]);
  };

  return (
    <ScreenLayout scrollable>
      <Typography variant="h1">Global State Demo</Typography>
      <Spacer size="lg" />

      {/* User State Section */}
      <View style={componentStyles.section}>
        <Typography variant="h2">User State</Typography>
        <Spacer size="md" />
        
        <Typography variant="body">
          Authenticated: {isAuthenticated ? 'Yes' : 'No'}
        </Typography>
        <Spacer size="sm" />
        
        {user ? (
          <View>
            <Typography variant="body">Name: {user.fullName}</Typography>
            <Typography variant="body">Email: {user.email}</Typography>
            <Typography variant="body">Status: {user.userStatus}</Typography>
          </View>
        ) : (
          <Typography variant="body">No user logged in</Typography>
        )}
        
        <Spacer size="md" />
        <View style={componentStyles.buttonGroup}>
          <Button mode="contained" onPress={handleCreateTestUser}>
            Create Test User
          </Button>
          <Button mode="outlined" onPress={handleClearUser}>
            Clear User
          </Button>
        </View>
      </View>

      {/* Settings Section */}
      <View style={componentStyles.section}>
        <Typography variant="h2">Settings</Typography>
        <Spacer size="md" />
        
        <Typography variant="body">Theme: {settings.theme}</Typography>
        <Typography variant="body">Language: {settings.language}</Typography>
        
        <Spacer size="md" />
        <View style={componentStyles.buttonGroup}>
          <Button mode="outlined" onPress={() => setTheme('light')}>
            Light Theme
          </Button>
          <Button mode="outlined" onPress={() => setTheme('dark')}>
            Dark Theme
          </Button>
        </View>
        
        <Spacer size="md" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body">Push Notifications</Typography>
          <Switch
            value={settings.notifications.push}
            onValueChange={() => toggleNotifications('push')}
          />
        </View>
      </View>

      {/* Loading State Section */}
      <View style={componentStyles.section}>
        <Typography variant="h2">Loading State</Typography>
        <Spacer size="md" />
        
        <Typography variant="body">
          Loading: {isLoading ? 'Yes' : 'No'}
        </Typography>
        
        <Spacer size="md" />
        <Button 
          mode="contained" 
          onPress={handleTestLoading}
          loading={isLoading}
          disabled={isLoading}
        >
          Test Loading (2s)
        </Button>
      </View>

      {/* Cache Section */}
      <View style={componentStyles.section}>
        <Typography variant="h2">Cache State</Typography>
        <Spacer size="md" />
        
        <Typography variant="body">
          Restaurants cached: {cache.restaurants.length}
        </Typography>
        <Typography variant="body">
          Cache stale: {isCacheStale('restaurants') ? 'Yes' : 'No'}
        </Typography>
        
        <Spacer size="md" />
        <Button mode="contained" onPress={handleUpdateCache}>
          Update Restaurant Cache
        </Button>
        
        {cache.restaurants.length > 0 && (
          <View>
            <Spacer size="md" />
            <Typography variant="body">Cached Restaurants:</Typography>
            {cache.restaurants.map((restaurant: any) => (
              <Typography key={restaurant.id} variant="body">
                • {restaurant.name} ({restaurant.rating}⭐)
              </Typography>
            ))}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}; 