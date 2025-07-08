import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

// User satellite table interfaces
interface UserPublic {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  first: string;
  full_name: string;
  title?: string;
  list?: number;
  profpic?: string;
  blurb?: string;
  candidate?: string;
  employer?: string;
  gyld?: string;
  nomination?: string;
}

interface UserInternal {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_status?: string;
  activity_type?: string[];
  proflink?: string;
  knowledge_domain?: string[];
  neighborhood?: string;
  start_field?: string;
  role_interest?: string[];
  phone_number?: string;
  notification_preferences?: object;
}

interface AuthState {
  // Core auth data
  user: User | null;
  userName: string | null;
  userGyld: string | null;
  isOrganizer: boolean;
  
  // User satellite data
  userPublic: UserPublic | null;
  userInternal: UserInternal | null;
  
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
  userPublic: null,
  userInternal: null,
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
      set({ 
        userName: null, 
        userGyld: null, 
        isOrganizer: false,
        userPublic: null,
        userInternal: null 
      });
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

  // Fetch user's satellite data and derived properties from database
  fetchUserData: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true });
    
    try {
      // Query users_public table for complete public profile data
      const { data: userPublic, error: publicError } = await supabase
        .from('users_public')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (publicError) {
        console.error('Error fetching user public data:', publicError);
        set({ isLoading: false });
        return;
      }

      // Query users_internal table for complete internal user data
      const { data: userInternal, error: internalError } = await supabase
        .from('users_internal')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (internalError) {
        console.error('Error fetching user internal data:', internalError);
        // Continue without internal data - it might not exist yet
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
        userPublic,
        userInternal,
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
        userPublic: null,
        userInternal: null,
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
            userPublic: null,
            userInternal: null,
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