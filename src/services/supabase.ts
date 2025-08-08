import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import { Database } from '../types'

interface ExtraConfig {
  EXPO_PUBLIC_SUPABASE_URL?: string
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string
}

const fromEnv = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anon: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
}

const extra = (Constants?.expoConfig?.extra ?? {}) as ExtraConfig

const supabaseUrl = fromEnv.url ?? extra.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = fromEnv.anon ?? extra.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase config missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)