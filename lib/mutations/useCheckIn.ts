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
      await queryClient.cancelQueries({ queryKey: ['all-check-ins', userId] })

      const previousHabitCheckIns = queryClient.getQueryData<CheckIn[]>(['check-ins', input.habitId])
      const previousTodayCheckIns = queryClient.getQueryData<CheckIn[]>(['check-ins', 'today', userId])
      const previousAllCheckIns = queryClient.getQueryData<CheckIn[]>(['all-check-ins', userId])

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

      // Update all check-ins for Profile Screen (Optimistic!)
      queryClient.setQueryData<CheckIn[]>(
        ['all-check-ins', userId],
        (old) => [...(old ?? []), optimistic],
      )

      return { previousHabitCheckIns, previousTodayCheckIns, previousAllCheckIns }
    },
    onError: (_err, input, context) => {
      queryClient.setQueryData(['check-ins', input.habitId], context?.previousHabitCheckIns)
      queryClient.setQueryData(['check-ins', 'today', userId], context?.previousTodayCheckIns)
      queryClient.setQueryData(['all-check-ins', userId], context?.previousAllCheckIns)
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', input.habitId] })
      queryClient.invalidateQueries({ queryKey: ['check-ins', 'today', userId] })
      queryClient.invalidateQueries({ queryKey: ['all-check-ins', userId] })
    },
  })
}

export function useUnCheck() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: async (habitId: string) => {
      const today = formatCheckedDate(new Date())
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('checked_date', today)

      if (error) throw error
    },
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ['check-ins', habitId] })
      await queryClient.cancelQueries({ queryKey: ['check-ins', 'today', userId] })
      await queryClient.cancelQueries({ queryKey: ['all-check-ins', userId] })

      const prevHabit = queryClient.getQueryData<CheckIn[]>(['check-ins', habitId])
      const prevToday = queryClient.getQueryData<CheckIn[]>(['check-ins', 'today', userId])
      const prevAll = queryClient.getQueryData<CheckIn[]>(['all-check-ins', userId])

      const today = formatCheckedDate(new Date())

      queryClient.setQueryData<CheckIn[]>(['check-ins', habitId], (old) => 
        old?.filter(c => c.checked_date !== today)
      )
      queryClient.setQueryData<CheckIn[]>(['check-ins', 'today', userId], (old) => 
        old?.filter(c => c.habit_id !== habitId)
      )
      queryClient.setQueryData<CheckIn[]>(['all-check-ins', userId], (old) => 
        old?.filter(c => !(c.habit_id === habitId && c.checked_date === today))
      )

      return { prevHabit, prevToday, prevAll }
    },
    onError: (_err, habitId, context) => {
      queryClient.setQueryData(['check-ins', habitId], context?.prevHabit)
      queryClient.setQueryData(['check-ins', 'today', userId], context?.prevToday)
      queryClient.setQueryData(['all-check-ins', userId], context?.prevAll)
    },
    onSettled: (_data, _err, habitId) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', habitId] })
      queryClient.invalidateQueries({ queryKey: ['check-ins', 'today', userId] })
      queryClient.invalidateQueries({ queryKey: ['all-check-ins', userId] })
    }
  })
}
