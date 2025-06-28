/**
 * Global State Hook
 * Provides easy access to global state and actions
 * Integrates Zustand store with existing app patterns
 */

import { useEffect } from 'react';
import { 
  useGlobalStore, 
  useUser, 
  useIsAuthenticated, 
  useSettings, 
  useIsLoading, 
  useNetworkStatus, 
  useCache, 
  useGlobalActions,
  type User,
  type AppSettings 
} from '../stores';

/**
 * Main hook for accessing global state
 * Use this in components that need multiple pieces of global state
 */
export const useGlobalState = () => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const settings = useSettings();
  const isLoading = useIsLoading();
  const networkStatus = useNetworkStatus();
  const cache = useCache();
  const actions = useGlobalActions();

  return {
    // State
    user,
    isAuthenticated,
    settings,
    isLoading,
    networkStatus,
    cache,
    
    // Actions
    ...actions,
  };
};

/**
 * Hook for user-related state and actions
 */
export const useUserState = () => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { setUser, setAuthenticated } = useGlobalActions();

  return {
    user,
    isAuthenticated,
    setUser,
    setAuthenticated,
    logout: () => {
      setUser(null);
      setAuthenticated(false);
    },
  };
};

/**
 * Hook for app settings
 */
export const useAppSettings = () => {
  const settings = useSettings();
  const { updateSettings } = useGlobalActions();

  return {
    settings,
    updateSettings,
    // Convenience methods for common settings
    setTheme: (theme: AppSettings['theme']) => 
      updateSettings({ theme }),
    setLanguage: (language: AppSettings['language']) => 
      updateSettings({ language }),
    toggleNotifications: (type: keyof AppSettings['notifications']) =>
      updateSettings({
        notifications: {
          ...settings.notifications,
          [type]: !settings.notifications[type],
        },
      }),
  };
};

/**
 * Hook for loading states
 */
export const useLoadingState = () => {
  const isLoading = useIsLoading();
  const { setLoading } = useGlobalActions();

  return {
    isLoading,
    setLoading,
    startLoading: () => setLoading(true),
    stopLoading: () => setLoading(false),
  };
};

/**
 * Hook for cache management
 */
export const useCacheState = () => {
  const cache = useCache();
  const { updateCache, clearCache } = useGlobalActions();

  return {
    cache,
    updateCache,
    clearCache,
    // Convenience methods
    updateRestaurants: (restaurants: any[]) => 
      updateCache('restaurants', restaurants),
    updateGatherings: (gatherings: any[]) => 
      updateCache('gatherings', gatherings),
    isCacheStale: (key: 'restaurants' | 'gatherings', maxAge = 5 * 60 * 1000) => {
      const lastUpdated = cache.lastUpdated[key];
      if (!lastUpdated) return true;
      return Date.now() - lastUpdated > maxAge;
    },
  };
};

/**
 * Hook for network status
 */
export const useNetworkState = () => {
  const networkStatus = useNetworkStatus();
  const { setNetworkStatus } = useGlobalActions();

  return {
    networkStatus,
    setNetworkStatus,
    isOnline: networkStatus === 'online',
    isOffline: networkStatus === 'offline',
  };
}; 