import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReactionCounts {
  fire: number
  grit: number
  props: number
}

export interface FeedItem {
  id: string
  habit_id: string
  user_id: string
  checked_date: string
  proof_url: string | null
  note: string | null
  share_grid: boolean
  created_at: string
  users: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  habits: {
    name: string
    icon: string
    color: string
  }
  // Aggregated counts (computed after fetch)
  reaction_counts: ReactionCounts
  comment_count: number
  // Current user reaction state
  user_reactions: string[] // ['fire', 'grit'] etc.
}

const PAGE_SIZE = 20

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchFeedPage(
  followingIds: string[],
  cursor: { createdAt: string; id: string } | null,
  currentUserId: string,
): Promise<{ items: FeedItem[]; nextCursor: { createdAt: string; id: string } | null }> {
  if (followingIds.length === 0) return { items: [], nextCursor: null }

  let query = supabase
    .from('check_ins')
    .select(`
      id, habit_id, user_id, checked_date, proof_url, note, share_grid, created_at,
      users!inner ( id, username, display_name, avatar_url ),
      habits!inner ( name, icon, color )
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
  }

  const { data, error } = await query

  if (error) throw error

  const checkIns = (data ?? []) as unknown as Omit<FeedItem, 'reaction_counts' | 'comment_count' | 'user_reactions'>[]

  if (checkIns.length === 0) return { items: [], nextCursor: null }

  // Batch-fetch reaction counts and comment counts
  const checkInIds = checkIns.map((c) => c.id)

  const [reactionsResult, commentsResult, userReactionsResult] = await Promise.all([
    // Reaction counts grouped by check_in_id and type
    supabase
      .from('reactions')
      .select('check_in_id, type')
      .in('check_in_id', checkInIds),
    // Comment counts
    supabase
      .from('comments')
      .select('check_in_id')
      .in('check_in_id', checkInIds),
    // Current user's reactions
    supabase
      .from('reactions')
      .select('check_in_id, type')
      .in('check_in_id', checkInIds)
      .eq('user_id', currentUserId),
  ])

  // Throw if any query failed
  if (reactionsResult.error) throw new Error(`Feed reactions fetch failed: ${reactionsResult.error.message}`)
  if (commentsResult.error) throw new Error(`Feed comments fetch failed: ${commentsResult.error.message}`)
  if (userReactionsResult.error) throw new Error(`Feed user reactions fetch failed: ${userReactionsResult.error.message}`)

  // Build reaction count map: { checkInId: { fire: 3, grit: 1, props: 0 } }
  const reactionMap: Record<string, ReactionCounts> = {}
  for (const r of reactionsResult.data ?? []) {
    if (!reactionMap[r.check_in_id]) {
      reactionMap[r.check_in_id] = { fire: 0, grit: 0, props: 0 }
    }
    const type = r.type as keyof ReactionCounts
    if (type in reactionMap[r.check_in_id]) {
      reactionMap[r.check_in_id][type]++
    }
  }

  // Build comment count map
  const commentMap: Record<string, number> = {}
  for (const c of commentsResult.data ?? []) {
    commentMap[c.check_in_id] = (commentMap[c.check_in_id] ?? 0) + 1
  }

  // Build user reactions map
  const userReactionMap: Record<string, string[]> = {}
  for (const r of userReactionsResult.data ?? []) {
    if (!userReactionMap[r.check_in_id]) {
      userReactionMap[r.check_in_id] = []
    }
    userReactionMap[r.check_in_id].push(r.type)
  }

  // Merge into feed items
  const items: FeedItem[] = checkIns.map((c) => ({
    ...c,
    share_grid: (c as Record<string, unknown>).share_grid as boolean ?? false,
    reaction_counts: reactionMap[c.id] ?? { fire: 0, grit: 0, props: 0 },
    comment_count: commentMap[c.id] ?? 0,
    user_reactions: userReactionMap[c.id] ?? [],
  }))

  const nextCursor =
    items.length === PAGE_SIZE
      ? {
          createdAt: items[items.length - 1].created_at,
          id: items[items.length - 1].id,
        }
      : null

  return { items, nextCursor }
}

// ---------------------------------------------------------------------------
// Hook: useFeed (infinite scroll)
// ---------------------------------------------------------------------------

export function useFeed(followingIds: string[], currentUserId: string) {
  return useInfiniteQuery({
    queryKey: ['feed', followingIds, currentUserId],
    queryFn: ({ pageParam }) =>
      fetchFeedPage(followingIds, pageParam as { createdAt: string; id: string } | null, currentUserId),
    initialPageParam: null as { createdAt: string; id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: followingIds.length > 0,
  })
}
