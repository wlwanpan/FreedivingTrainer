import { TableType, TableTypes } from '@/constants/tables'
import type { TrainPlanSlot, TrainTable } from '@/hooks/useTrainingClock'
import { tableTypeLabel } from '@/i18n/labels'
import { Translate } from '@/i18n/types'
import { WeekSession } from '@/utils/training_plan'


export type TrainRouteParams = {
  type?: string | string[]
  name?: string | string[]
  hold?: string | string[]
  holdStep?: string | string[]
  restStart?: string | string[]
  restStep?: string | string[]
  rounds?: string | string[]
  week?: string | string[]
  session?: string | string[]
  note?: string | string[]
}

export function trainParamsFromSession(session: WeekSession, week: number): Record<string, string> {
  return {
    type: session.tableType,
    name: session.name,
    hold: String(session.holdSeconds),
    holdStep: String(session.holdStepSeconds),
    restStart: String(session.restStartSeconds),
    restStep: String(session.restStepSeconds),
    rounds: String(session.rounds),
    week: String(week),
    session: String(session.index),
    note: session.note,
  }
}

export function parseTableType(value: string | string[] | undefined): TableType | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw != null && (TableTypes as readonly string[]).includes(raw)) {
    return raw as TableType
  }
  return null
}

export function parseCount(value: string | string[] | undefined, allowZero: boolean): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 0 || (!allowZero && parsed === 0)) return null
  return parsed
}

export function parseLabel(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  const label = raw?.trim() ?? ''
  return label === '' ? null : label
}

export function parseSlot(params: {
  week?: string | string[]
  session?: string | string[]
}): TrainPlanSlot | null {
  const week = parseCount(params.week, false)
  const index = parseCount(params.session, false)
  if (week == null || index == null) return null
  return { week, index }
}

export function parseTrainTable(params: {
  hold?: string | string[]
  holdStep?: string | string[]
  restStart?: string | string[]
  restStep?: string | string[]
  rounds?: string | string[]
}): TrainTable | null {
  const holdSeconds = parseCount(params.hold, false)
  const restStartSeconds = parseCount(params.restStart, true)
  const restStepSeconds = parseCount(params.restStep, true)
  const rounds = parseCount(params.rounds, false)
  if (holdSeconds == null || restStartSeconds == null || restStepSeconds == null || rounds == null) {
    return null
  }
  return {
    holdSeconds,
    holdStepSeconds: parseCount(params.holdStep, true) ?? 0,
    restStartSeconds,
    restStepSeconds,
    rounds,
  }
}

export function trainTitle(name: string | string[] | undefined, tableType: TableType | null, t: Translate): string {
  return parseLabel(name) ?? (tableType == null ? '' : tableTypeLabel(tableType, t))
}
