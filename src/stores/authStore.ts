import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface AuthState {
  // Core auth data - the 4 approved pieces
  user: User | null;
  userName: string | null;
  userGyld: string | null;
  isOrganizer: boolean;
  
  // Auth state management
  isLoading: boolean;
  isInitialized: boolean;
  hasLoggedInBefore: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  fetchUserData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  checkHasLoggedInBefore: () => Promise<void>;
}

const STORAGE_KEY = 'hasLoggedInBefore';

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  userName: null,
  userGyld: null,
  isOrganizer: false,
  isLoading: false,
  isInitialized: false,
  hasLoggedInBefore: false,

  // Set user and trigger data fetch
  setUser: (user: User | null) => {
    set({ user });
    if (user) {
      get().fetchUserData();
      // Mark that user has logged in before
      AsyncStorage.setItem(STORAGE_KEY, 'true');
      set({ hasLoggedInBefore: true });
    } else {
      // Clear user data when user is null
      set({ userName: null, userGyld: null, isOrganizer: false });
    }
  },

  // Check if user has logged in before on this device
  checkHasLoggedInBefore: async () => {
    try {
      const hasLoggedIn = await AsyncStorage.getItem(STORAGE_KEY);
      set({ hasLoggedInBefore: hasLoggedIn === 'true' });
    } catch (error) {
      console.error('Error checking hasLoggedInBefore:', error);
      set({ hasLoggedInBefore: false });
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // User will be set via the auth state change listener
      set({ isLoading: false });
      return {};
      
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // User will be set via the auth state change listener
      set({ isLoading: false });
      return {};
      
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    set({ isLoading: true });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return {};
      
    } catch (error) {
      set({ isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  // Fetch user's gyld and organizer status from database
  fetchUserData: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true });
    
    try {
      // Query users_public table for user information
      const { data: userPublic, error: publicError } = await supabase
        .from('users_public')
        .select('full_name, first, gyld')
        .eq('user_id', user.id)
        .single();

      if (publicError) {
        console.error('Error fetching user public data:', publicError);
        set({ isLoading: false });
        return;
      }

      // Query gyld table to check if user is organizer
      let isOrganizer = false;
      if (userPublic?.gyld) {
        const { data: gyldData, error: gyldError } = await supabase
          .from('gyld')
          .select('organizer')
          .eq('id', userPublic.gyld)
          .single();

        if (gyldError) {
          console.error('Error fetching gyld data:', gyldError);
        } else {
          // Check if current user is in the organizer array
          isOrganizer = gyldData?.organizer?.includes(user.id) || false;
        }
      }

      // Determine userName - prefer full_name, fallback to first
      const userName = userPublic?.full_name || userPublic?.first || null;

      set({
        userName,
        userGyld: userPublic?.gyld || null,
        isOrganizer,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error in fetchUserData:', error);
      set({ isLoading: false });
    }
  },

  // Sign out user and clear all state
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        userName: null,
        userGyld: null,
        isOrganizer: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  // Initialize auth state and set up listener
  initialize: async () => {
    set({ isLoading: true });

    try {
      // Check if user has logged in before
      await get().checkHasLoggedInBefore();

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        await get().fetchUserData();
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          set({ user: session.user });
          await get().fetchUserData();
        } else {
          set({
            user: null,
            userName: null,
            userGyld: null,
            isOrganizer: false,
          });
        }
      });

      set({ isInitialized: true, isLoading: false });

    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },
})); 