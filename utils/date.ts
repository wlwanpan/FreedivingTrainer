import { DefaultDateFormat } from '@/constants/dates'
import { englishTranslate } from '@/i18n/translate'
import { Translate } from '@/i18n/types'

export function todayDate(): string {
  const now = new Date()
  return dayStamp(now.getFullYear(), now.getMonth(), now.getDate())
}

export function dayStamp(year: number, month: number, date: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(date).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function formatMonthYear(year: number, month: number, t: Translate = englishTranslate): string {
  return t('calendar.monthYear', { month: t(`calendar.monthFull.${month}`), year })
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

export function formatDay(
  day: string,
  format: string = DefaultDateFormat,
  t: Translate = englishTranslate,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match || format !== 'MMM D, YYYY') {
    return day
  }
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) {
    return day
  }
  return t('calendar.longDate', {
    month: t(`calendar.monthShort.${monthIndex}`),
    day: Number(match[3]),
    year: match[1],
  })
}
