import { eachDayOfInterval, subDays, format, startOfDay } from 'date-fns'
import { grid as gridTokens } from '@/theme/tokens'

export type GridIntensity = 0 | 1 | 2 | 3

export interface GridCell {
  date: string   // 'yyyy-MM-dd'
  intensity: GridIntensity
}

/**
 * Generate the last 364 days (52 weeks × 7) ending today, inclusive.
 */
export function generateGridDates(today: Date = new Date()): string[] {
  const end = startOfDay(today)
  const start = subDays(end, gridTokens.weeks * 7 - 1)
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
}

/**
 * Map a set of check-in dates to grid cells with intensity levels.
 * Intensity: 0 = none, 1 = 1 check-in, 2 = 2, 3 = 3+
 */
export function buildGrid(
  dates: string[],
  checkedDates: string[],
): GridCell[] {
  const checkedSet = new Map<string, number>()
  for (const d of checkedDates) {
    checkedSet.set(d, (checkedSet.get(d) ?? 0) + 1)
  }

  return dates.map((date) => {
    const count = checkedSet.get(date) ?? 0
    const intensity: GridIntensity =
      count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3
    return { date, intensity }
  })
}
