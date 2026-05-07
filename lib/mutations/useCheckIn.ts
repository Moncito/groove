import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { formatCheckedDate } from '@/lib/dates'
import { uploadHabitProof } from '@/lib/storage'
import type { CheckIn } from '@/lib/queries/useCheckIns'

interface CheckInInput {
  habitId: string
  note?: string
  photoUri?: string
}

async function checkInHabit(input: CheckInInput, userId: string): Promise<CheckIn> {
  let proofUrl = null

  if (input.photoUri) {
    proofUrl = await uploadHabitProof(input.photoUri, userId)
  }

  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      habit_id: input.habitId,
      user_id: userId,
      checked_date: formatCheckedDate(new Date()),
      note: input.note ?? null,
      proof_url: proofUrl,
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
      // Cancel relevant queries
      await queryClient.cancelQueries({ queryKey: ['check-ins', input.habitId] })
      await queryClient.cancelQueries({ queryKey: ['check-ins', 'today', userId] })

      const previousHabitCheckIns = queryClient.getQueryData<CheckIn[]>(['check-ins', input.habitId])
      const previousTodayCheckIns = queryClient.getQueryData<CheckIn[]>(['check-ins', 'today', userId])

      const optimistic: CheckIn = {
        id: `optimistic-${Date.now()}`,
        habit_id: input.habitId,
        user_id: userId,
        checked_date: formatCheckedDate(new Date()),
        proof_url: input.photoUri ? null : null,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      }

      // Update habit specific check-ins
      queryClient.setQueryData<CheckIn[]>(
        ['check-ins', input.habitId],
        (old) => [...(old ?? []), optimistic],
      )

      // Update today's check-ins for Home Screen
      queryClient.setQueryData<CheckIn[]>(
        ['check-ins', 'today', userId],
        (old) => [...(old ?? []), optimistic],
      )

      return { previousHabitCheckIns, previousTodayCheckIns }
    },
    onError: (_err, input, context) => {
      queryClient.setQueryData(['check-ins', input.habitId], context?.previousHabitCheckIns)
      queryClient.setQueryData(['check-ins', 'today', userId], context?.previousTodayCheckIns)
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', input.habitId] })
      queryClient.invalidateQueries({ queryKey: ['check-ins', 'today', userId] })
      queryClient.invalidateQueries({ queryKey: ['all-check-ins', userId] })
    },
  })
}
