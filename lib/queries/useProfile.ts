import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_pro: boolean
  created_at: string
}

async function fetchProfile(username: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, bio, avatar_url, is_pro, created_at')
    .eq('username', username)
    .single()

  if (error) throw error
  return data as Profile
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfile(username),
    enabled: Boolean(username),
  })
}
