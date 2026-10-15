import { WatchDetail, WatchDetails } from '../constants/sessions'
import { TableType, TableTypes } from '../constants/tables'

export type WatchCompletedSession = {
  tableType: TableType
  holdSeconds: number
  restSeconds: number
  roundsCompleted: number
  roundsPlanned: number
  startedAt: number | null
  completedAt: number
  planWeek: number | null
  planSession: number | null
  watchDetail: WatchDetail
  heartRates: { bpm: number; recordedAt: Date }[]
}

function wholeNumber(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  const rounded = Math.round(parsed)
  if (rounded < min || rounded > max) return null
  return rounded
}

function tableType(value: unknown): TableType | null {
  if (typeof value !== 'string') return null
  return (TableTypes as readonly string[]).includes(value) ? value as TableType : null
}

function readWatchDetail(value: unknown): WatchDetail {
  if (typeof value !== 'string') return 'ios'
  return (WatchDetails as readonly string[]).includes(value) ? value as WatchDetail : 'ios'
}

function readRateAt(record: Record<string, unknown>): number | null {
  const raw = record.at ?? record.recordedAt
  const parsed = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  const rounded = Math.round(parsed)
  if (rounded < 1 || rounded > Number.MAX_SAFE_INTEGER) return null
  return rounded
}

function readRates(value: unknown): { bpm: number; recordedAt: Date }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (item == null || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const bpm = wholeNumber(record.bpm, 30, 230)
    const at = readRateAt(record)
    if (bpm == null || at == null) return []
    return [{ bpm, recordedAt: new Date(at) }]
  })
}

export function readWatchCompletion(
  payload: Record<string, unknown>,
  planKey: string,
): WatchCompletedSession | null {
  if (payload.type !== 'sessionComplete') return null
  const kind = tableType(payload.tableType)
  const holdSeconds = wholeNumber(payload.holdSeconds, 1, 3600)
  const restSeconds = wholeNumber(payload.restSeconds, 0, 3600)
  const roundsCompleted = wholeNumber(payload.roundsCompleted, 1, 40)
  const roundsPlanned = wholeNumber(payload.roundsPlanned, 1, 40)
  const completedAt = wholeNumber(payload.completedAt, 1, Number.MAX_SAFE_INTEGER)
  const startedAt = wholeNumber(payload.startedAt, 1, Number.MAX_SAFE_INTEGER)
  if (
    kind == null
    || holdSeconds == null
    || restSeconds == null
    || roundsCompleted == null
    || roundsPlanned == null
    || completedAt == null
  ) return null
  const week = wholeNumber(payload.week, 1, 52)
  const sessionIndex = wholeNumber(payload.sessionIndex, 1, 40)
  const key = typeof payload.planKey === 'string' ? payload.planKey : ''
  const samePlan = key === '' || key === planKey
  const slotted = samePlan && week != null && sessionIndex != null
  return {
    tableType: kind,
    holdSeconds,
    restSeconds,
    roundsCompleted,
    roundsPlanned,
    startedAt,
    completedAt,
    planWeek: slotted ? week : null,
    planSession: slotted ? sessionIndex : null,
    watchDetail: readWatchDetail(payload.watchDetail),
    heartRates: readRates(payload.heartRates),
  }
}

export function dayStamp(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
