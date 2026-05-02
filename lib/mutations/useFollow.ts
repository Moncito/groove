import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })

  if (error) throw error
}

async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw error
}

export function useFollow(targetUserId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  const follow = useMutation({
    mutationFn: () => followUser(userId, targetUserId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const unfollow = useMutation({
    mutationFn: () => unfollowUser(userId, targetUserId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return { follow, unfollow }
}
