import { DefaultDateFormat } from '@/constants/dates'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function todayDate(): string {
  const now = new Date()
  return dayStamp(now.getFullYear(), now.getMonth(), now.getDate())
}

export function dayStamp(year: number, month: number, date: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(date).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month] ?? ''} ${year}`.trim()
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(year, month + delta, 1)
  return { year: next.getFullYear(), month: next.getMonth() }
}

export function monthFromDay(day: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(day)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1 }
}

export function formatDay(day: string, format: string = DefaultDateFormat): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match || format !== 'MMM D, YYYY') {
    return day
  }
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) {
    return day
  }
  return `${month} ${Number(match[3])}, ${match[1]}`
}
