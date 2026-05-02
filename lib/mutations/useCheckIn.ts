import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { formatCheckedDate } from '@/lib/dates'
import type { CheckIn } from '@/lib/queries/useCheckIns'

interface CheckInInput {
  habitId: string
  note?: string
  proofUrl?: string
}

async function checkInHabit(input: CheckInInput, userId: string): Promise<CheckIn> {
  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      habit_id: input.habitId,
      user_id: userId,
      checked_date: formatCheckedDate(new Date()),
      note: input.note ?? null,
      proof_url: input.proofUrl ?? null,
    })
    .select('id, habit_id, user_id, checked_date, proof_url, note, created_at')
    .single()

  if (error) throw error
  return data as CheckIn
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: (input: CheckInInput) => checkInHabit(input, userId),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['check-ins', input.habitId] })
      const previous = queryClient.getQueryData<CheckIn[]>(['check-ins', input.habitId])

      const optimistic: CheckIn = {
        id: `optimistic-${Date.now()}`,
        habit_id: input.habitId,
        user_id: userId,
        checked_date: formatCheckedDate(new Date()),
        proof_url: input.proofUrl ?? null,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<CheckIn[]>(
        ['check-ins', input.habitId],
        (old) => [...(old ?? []), optimistic],
      )

      return { previous }
    },
    onError: (_err, input, context) => {
      queryClient.setQueryData(['check-ins', input.habitId], context?.previous)
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', input.habitId] })
    },
  })
}
