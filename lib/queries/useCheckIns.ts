import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCheckedDate } from '@/lib/dates'

export interface CheckIn {
  id: string
  habit_id: string
  user_id: string
  checked_date: string
  proof_url: string | null
  note: string | null
  created_at: string
}

export function useAllCheckIns(userId: string) {
  return useQuery({
    queryKey: ['all-check-ins', userId],
    queryFn: () => fetchAllCheckIns(userId),
    enabled: Boolean(userId),
  })
}

async function fetchAllCheckIns(userId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, habit_id, user_id, checked_date, proof_url, note, created_at')
    .eq('user_id', userId)
    .order('checked_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as CheckIn[]
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

async function fetchTodayCheckIns(userId: string): Promise<CheckIn[]> {
  const today = formatCheckedDate(new Date())
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, habit_id, user_id, checked_date, proof_url, note, created_at')
    .eq('user_id', userId)
    .eq('checked_date', today)

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

export function useTodayCheckIns(userId: string) {
  return useQuery({
    queryKey: ['check-ins', 'today', userId],
    queryFn: () => fetchTodayCheckIns(userId),
    enabled: Boolean(userId),
  })
}
