import { Setting } from '@/db/schema'
import { NextTrainingSession, TrainingOutline } from '@/hooks/useTrainingOutline'
import { Translate } from '@/i18n/types'
import { practiceFromValue } from '@/utils/practice'
import { sessionRounds } from '@/utils/training_plan'
import { phoneTrainingContext, PhoneTraining } from '@/utils/watch_sync'
import { watchTablesFromSettings } from '@/utils/watch_tables'

export function watchPlanKey(settings: Pick<Setting, 'trainingPlan' | 'trainingPlanStartedAt' | 'customPlan' | 'practice'>): string {
  if (settings.trainingPlan == null || settings.trainingPlanStartedAt == null) return ''
  return `${settings.trainingPlan}:${settings.trainingPlanStartedAt.getTime()}:${settings.customPlan ?? ''}:${practiceFromValue(settings.practice)}`
}

export function buildWatchContext(input: {
  settings: Setting
  sessionsCount: number
  planKey: string
  sync: string
  syncedAt: number[]
  language: string
  t: Translate
  outline: TrainingOutline | null
  next: NextTrainingSession | null
  phoneTraining: PhoneTraining | null
  freeLimitReached: boolean
}): Record<string, unknown> {
  const {
    settings,
    sessionsCount,
    planKey,
    sync,
    syncedAt,
    language,
    t,
    outline,
    next,
    phoneTraining,
    freeLimitReached,
  } = input
  const rounds = next == null || next.openHold ? [] : sessionRounds(next)
  const tables = watchTablesFromSettings(settings, t)
  const shared = {
    type: 'nextSession' as const,
    loggedCount: sessionsCount,
    planKey,
    sync,
    syncedAt,
    tables,
    language,
    trainingHaptic: settings.trainingHaptic,
    trainingSound: settings.trainingSound,
    phoneTraining: phoneTrainingContext(phoneTraining),
  }
  if (freeLimitReached) return { ...shared, locked: true }
  if (outline != null && next == null) return { ...shared, complete: true }
  if (next == null || rounds.length === 0) return shared
  return {
    ...shared,
    name: next.name,
    week: next.week,
    sessionIndex: next.index,
    planWeek: outline?.week ?? next.week,
    planWeeks: outline?.weeks ?? 1,
    progress: Math.round((outline?.progress ?? 0) * 100),
    planName: outline?.planName ?? '',
    schedule: (outline?.schedule ?? []).map((entry) => ({
      week: entry.week,
      current: entry.current,
      locked: entry.locked,
      sessions: entry.sessions.map((session) => ({
        index: session.index,
        name: session.name,
        tableType: session.tableType,
        holdSeconds: session.holdSeconds,
        restSeconds: session.restStartSeconds,
        rounds: session.rounds,
        completed: session.completed,
        note: session.note,
      })),
    })),
    tableType: next.tableType,
    breatheUpSeconds: settings.breatheUpSeconds,
    holdSeconds: next.holdSeconds,
    restSeconds: next.restStartSeconds,
    rounds: rounds.map((round) => ({
      hold: round.holdSeconds,
      rest: round.restSeconds,
    })),
  }
}
