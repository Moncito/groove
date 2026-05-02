import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface FeedItem {
  id: string
  habit_id: string
  user_id: string
  checked_date: string
  proof_url: string | null
  note: string | null
  created_at: string
  users: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  habits: {
    name: string
    icon: string
    color: string
  }
}

async function fetchFeed(followingIds: string[]): Promise<FeedItem[]> {
  if (followingIds.length === 0) return []

  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      id, habit_id, user_id, checked_date, proof_url, note, created_at,
      users ( username, display_name, avatar_url ),
      habits ( name, icon, color )
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as unknown as FeedItem[]
}

export function useFeed(followingIds: string[]) {
  return useQuery({
    queryKey: ['feed', followingIds],
    queryFn: () => fetchFeed(followingIds),
    enabled: followingIds.length > 0,
  })
}
