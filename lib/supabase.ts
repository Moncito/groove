import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config'

// ---------------------------------------------------------------------------
// AsyncStorage adapter for Supabase auth session persistence
// (MMKV will replace this in native builds via expo prebuild)
// ---------------------------------------------------------------------------
const asyncStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key)
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value)
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key)
  },
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: asyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
