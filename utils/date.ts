import { DefaultDateFormat } from '@/constants/dates'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function todayDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
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
