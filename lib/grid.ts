import { 
  subWeeks, 
  subDays,
  startOfDay, 
  eachDayOfInterval, 
  format,
} from 'date-fns'
import { colors } from '@/theme/tokens'

export type GridIntensity = 0 | 1 | 2 | 3 | 4

export interface GridDay {
  date: Date
  dateString: string
  intensity: GridIntensity
  count: number
  monthLabel?: string
}

/**
 * Generates 52 weeks of dates ending today.
 * Each date is mapped to an intensity level based on check-in counts.
 */
export function generateGridData(checkIns: { date: string; count: number }[] = []): GridDay[] {
  try {
    const endDate = startOfDay(new Date())
    const startDate = subWeeks(endDate, 52)

    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    // Optimization: Pre-map check-ins for O(1) lookup
    const checkInMap = new Map<string, number>()
    checkIns.forEach(c => {
      if (c && c.date) {
        checkInMap.set(c.date, c.count)
      }
    })

    return allDays.map((date, index) => {
      const dateString = format(date, 'yyyy-MM-dd')
      const count = checkInMap.get(dateString) || 0
      
      // Add month labels for the first day of each month
      let monthLabel: string | undefined
      if (date.getDate() <= 7 && index % 7 === 0) {
        // Only show label if it's the start of a week near the beginning of the month
        // This is a simplification for the grid layout
        if (date.getDate() === 1 || (date.getDate() > 1 && date.getDate() <= 7)) {
          monthLabel = format(date, 'MMM')
        }
      }

      // Map count to intensity level (0-4)
      let intensity: GridIntensity = 0
      if (count >= 4) intensity = 4
      else if (count >= 3) intensity = 3
      else if (count >= 2) intensity = 2
      else if (count >= 1) intensity = 1

      return {
        date,
        dateString,
        intensity,
        count,
        monthLabel,
      }
    })
  } catch (error) {
    console.error('Error generating grid data:', error)
    return []
  }
}

/**
 * Calculates the current streak (consecutive days with at least one check-in)
 */
export function calculateStreak(checkInDates: string[]): number {
  if (!checkInDates || checkInDates.length === 0) return 0
  
  const uniqueDates = new Set(checkInDates)
  let streak = 0
  let dateToCheck = startOfDay(new Date())
  
  // If not checked in today, check if we had a streak up to yesterday
  if (!uniqueDates.has(format(dateToCheck, 'yyyy-MM-dd'))) {
    dateToCheck = subDays(dateToCheck, 1)
  }
  
  while (uniqueDates.has(format(dateToCheck, 'yyyy-MM-dd'))) {
    streak++
    dateToCheck = subDays(dateToCheck, 1)
  }
  
  return streak
}

/**
 * Returns the color associated with a specific intensity level.
 * If a baseColor is provided, it calculates opacity-based shades.
 */
export function getIntensityColor(intensity: GridIntensity): string {
  switch (intensity) {
    case 1: return colors.grid1
    case 2: return colors.grid2
    case 3: return colors.grid3
    case 4: return colors.grid4
    default: return colors.gridEmpty
  }
}
