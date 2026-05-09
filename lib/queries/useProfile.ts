import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

async function fetchProfileById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, bio, avatar_url, is_pro, created_at')
    .eq('id', id)
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

export function useProfileById(id: string) {
  return useQuery({
    queryKey: ['profile', 'id', id],
    queryFn: () => fetchProfileById(id),
    enabled: Boolean(id),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      // 1. Update the public.users table
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 2. Sync with Auth Metadata so the local session stays updated
      if (updates.username || updates.display_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            username: updates.username,
            full_name: updates.display_name
          }
        })
        if (authError) console.error('Failed to sync auth metadata:', authError)
      }

      return data as Profile
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', data.username], data)
      queryClient.setQueryData(['profile', 'id', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}
