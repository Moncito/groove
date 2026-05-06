import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'custom'
  custom_days: number[] | null
  is_active: boolean
  created_at: string
}

async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, user_id, name, icon, color, frequency, custom_days, is_active, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Habit[]
}

export function useHabits(userId: string) {
  return useQuery({
    queryKey: ['habits', userId],
    queryFn: () => fetchHabits(userId),
    enabled: Boolean(userId),
  })
}

async function fetchHabit(habitId: string): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, user_id, name, icon, color, frequency, custom_days, is_active, created_at')
    .eq('id', habitId)
    .single()

  if (error) throw error
  return data as Habit
}

export function useHabit(habitId: string) {
  return useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => fetchHabit(habitId),
    enabled: Boolean(habitId),
  })
}
