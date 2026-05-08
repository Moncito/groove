import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { Habit } from '@/lib/queries/useHabits'

interface CreateHabitInput {
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'custom'
  customDays?: number[]
  type: 'activity' | 'output'
}

async function createHabit(input: CreateHabitInput, userId: string): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      frequency: input.frequency,
      custom_days: input.customDays ?? null,
      type: input.type,
    })
    .select('id, user_id, name, icon, color, frequency, custom_days, is_active, created_at, type')
    .single()

  if (error) throw error
  return data as Habit
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] })
    },
  })
}
