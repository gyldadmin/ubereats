import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://izyvwgdrqkuzeahrdrue.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6eXZ3Z2RycWt1emVhaHJkcnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODk0NzEsImV4cCI6MjA2NjE2NTQ3MX0.Zp4tRycTWZtJ3TI9bewAKAztAYt7kHPGCGwM5FZAZjo'

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)