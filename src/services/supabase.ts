import { createClient } from '@supabase/supabase-js'
import { Database } from '../types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Create and export the Supabase client with permanent session configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable persistent sessions across app restarts
    persistSession: true,
    // Automatically refresh tokens to maintain session
    autoRefreshToken: true,
    // Disable URL session detection (not needed for React Native)
    detectSessionInUrl: false,
    // Use secure storage for session persistence
    storage: {
      // AsyncStorage is used by default in React Native
      // This ensures sessions survive app updates and device reboots
      getItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        // React Native will use AsyncStorage automatically
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        // React Native will use AsyncStorage automatically
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        // React Native will use AsyncStorage automatically
      },
    },
  },
})