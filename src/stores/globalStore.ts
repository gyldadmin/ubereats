/**
 * Global State Store using Zustand
 * Provides app-wide state management with TypeScript support and persistence
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our global state
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  userStatus?: 'active' | 'inactive' | 'admin';
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr';
  notifications: {
    push: boolean;
    email: boolean;
    gathering: boolean;
  };
  privacy: {
    profileVisible: boolean;
    locationSharing: boolean;
  };
}

export interface GlobalState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  
  // App settings
  settings: AppSettings;
  
  // UI state
  isLoading: boolean;
  networkStatus: 'online' | 'offline';
  
  // Cache for frequently accessed data
  cache: {
    restaurants: any[];
    gatherings: any[];
    lastUpdated: {
      restaurants: number | null;
      gatherings: number | null;
    };
  };
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLoading: (isLoading: boolean) => void;
  setNetworkStatus: (status: 'online' | 'offline') => void;
  updateCache: (key: 'restaurants' | 'gatherings', data: any[]) => void;
  clearCache: () => void;
  reset: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notifications: {
    push: true,
    email: true,
    gathering: true,
  },
  privacy: {
    profileVisible: true,
    locationSharing: false,
  },
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  settings: defaultSettings,
  isLoading: false,
  networkStatus: 'online' as const,
  cache: {
    restaurants: [],
    gatherings: [],
    lastUpdated: {
      restaurants: null,
      gatherings: null,
    },
  },
};

// Create the store with persistence
export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Actions
      setUser: (user) => 
        set({ user, isAuthenticated: !!user }),
      
      setAuthenticated: (isAuthenticated) => 
        set({ isAuthenticated }),
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      setLoading: (isLoading) => 
        set({ isLoading }),
      
      setNetworkStatus: (networkStatus) => 
        set({ networkStatus }),
      
      updateCache: (key, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: data,
            lastUpdated: {
              ...state.cache.lastUpdated,
              [key]: Date.now(),
            },
          },
        })),
      
      clearCache: () =>
        set((state) => ({
          cache: {
            restaurants: [],
            gatherings: [],
            lastUpdated: {
              restaurants: null,
              gatherings: null,
            },
          },
        })),
      
      reset: () => 
        set(initialState),
    }),
    {
      name: 'gyld-global-store', // Storage key
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields (don't persist loading states)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
        cache: state.cache,
      }),
    }
  )
);

// Selector hooks for better performance (prevents unnecessary re-renders)
export const useUser = () => useGlobalStore((state) => state.user);
export const useIsAuthenticated = () => useGlobalStore((state) => state.isAuthenticated);
export const useSettings = () => useGlobalStore((state) => state.settings);
export const useIsLoading = () => useGlobalStore((state) => state.isLoading);
export const useNetworkStatus = () => useGlobalStore((state) => state.networkStatus);
export const useCache = () => useGlobalStore((state) => state.cache);

// Action hooks for cleaner component usage
export const useGlobalActions = () => useGlobalStore((state) => ({
  setUser: state.setUser,
  setAuthenticated: state.setAuthenticated,
  updateSettings: state.updateSettings,
  setLoading: state.setLoading,
  setNetworkStatus: state.setNetworkStatus,
  updateCache: state.updateCache,
  clearCache: state.clearCache,
  reset: state.reset,
})); 