import { format, isToday, isYesterday, parseISO } from 'date-fns'

export function formatCheckedDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function friendlyDate(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}
