import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { createMMKV } from 'react-native-mmkv'
import type { MMKV } from 'react-native-mmkv'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config'

// ---------------------------------------------------------------------------
// MMKV-backed storage adapter for Supabase auth session persistence
// ---------------------------------------------------------------------------
let storage: MMKV | null = null

function getStorage(): MMKV {
  if (!storage) {
    storage = createMMKV({ id: 'supabase-auth' })
  }
  return storage
}

const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    return getStorage().getString(key) ?? null
  },
  setItem: (key: string, value: string): void => {
    getStorage().set(key, value)
  },
  removeItem: (key: string): void => {
    getStorage().remove(key)
  },
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
