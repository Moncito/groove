import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CheckIn {
  id: string
  habit_id: string
  user_id: string
  checked_date: string
  proof_url: string | null
  note: string | null
  created_at: string
}

async function fetchCheckIns(habitId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, habit_id, user_id, checked_date, proof_url, note, created_at')
    .eq('habit_id', habitId)
    .order('checked_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as CheckIn[]
}

export function useCheckIns(habitId: string) {
  return useQuery({
    queryKey: ['check-ins', habitId],
    queryFn: () => fetchCheckIns(habitId),
    enabled: Boolean(habitId),
  })
}
