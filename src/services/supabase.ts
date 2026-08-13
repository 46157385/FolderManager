import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { isCloudSyncEnabled } from '@/config/features'

interface SupabaseServices {
  client: SupabaseClient
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = isCloudSyncEnabled
  && Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseServices: SupabaseServices | null = isSupabaseConfigured
  ? createSupabaseServices(supabaseUrl!, supabaseAnonKey!)
  : null

function createSupabaseServices(url: string, anonKey: string): SupabaseServices {
  return {
    client: createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  }
}
