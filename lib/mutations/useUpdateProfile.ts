import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { Profile } from '@/lib/queries/useProfile'

interface UpdateProfileInput {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
}

async function updateProfile(input: UpdateProfileInput, userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .update(input)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] })
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })
}
