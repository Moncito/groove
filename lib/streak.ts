import { differenceInCalendarDays, parseISO, subDays, format } from 'date-fns'

/**
 * Calculate current streak from a sorted (asc) array of 'yyyy-MM-dd' check-in dates.
 * Streak counts consecutive days ending on today or yesterday (grace period).
 */
export function calculateStreak(checkedDates: string[], today: Date = new Date()): number {
  if (checkedDates.length === 0) return 0

  const todayStr = format(today, 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')

  const unique = [...new Set(checkedDates)].sort().reverse()

  // Must start from today or yesterday to have an active streak
  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(unique[i - 1]),
      parseISO(unique[i]),
    )
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculate total number of unique check-in days.
 */
export function calculateTotalDays(checkedDates: string[]): number {
  return new Set(checkedDates).size
}
