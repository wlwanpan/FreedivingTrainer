import { useSQLContext } from '@/providers/sql'
import {
  baselineRetestDue,
  completedSessionIndexes,
  currentPlanWeek,
  planElapsedFraction,
  planSchedule,
  planWeekRange,
  trainingPlanFromSettings,
  WeekSession,
} from '@/utils/training_plan'


export type TrainingSession = WeekSession & {
  completed: boolean
}

export type TrainingWeek = {
  week: number
  current: boolean
  locked: boolean
  sessions: TrainingSession[]
}

export type TrainingOutline = {
  planName: string
  level: string
  frequency: string
  weeks: number
  week: number
  weekComplete: boolean
  progress: number
  retestDue: boolean
  schedule: TrainingWeek[]
}

export type NextTrainingSession = TrainingSession & {
  week: number
}

export function nextTrainingSession(outline: TrainingOutline | null): NextTrainingSession | null {
  if (outline == null) return null
  const currentWeek = outline.schedule.find((entry) => entry.current) ?? null
  const incomplete = currentWeek?.sessions.find((session) => !session.completed) ?? null
  if (currentWeek != null && incomplete != null) {
    return { ...incomplete, week: currentWeek.week }
  }
  const nextWeek = outline.schedule.find((entry) => entry.week > outline.week && !entry.locked) ?? null
  const nextIncomplete = nextWeek?.sessions.find((session) => !session.completed) ?? null
  if (nextWeek != null && nextIncomplete != null) {
    return { ...nextIncomplete, week: nextWeek.week }
  }
  return null
}

export default function useTrainingOutline(): TrainingOutline | null {
  const { settings, sessions } = useSQLContext()
  const plan = trainingPlanFromSettings(settings)
  const startedAt = settings.trainingPlanStartedAt
  const baselineMaxSeconds = settings.baselineMaxHoldSeconds
  if (plan == null || startedAt == null || baselineMaxSeconds == null) return null

  const now = new Date()
  const week = currentPlanWeek(startedAt, now, plan.weeks)
  const planStartedAt = startedAt.getTime()
  const schedule = planSchedule({
    baselineMaxSeconds,
    contractionSeconds: settings.baselineContractionSeconds,
    plan,
  }).map((entry) => ({
    ...entry,
    completed: completedSessionIndexes(
      sessions,
      entry.sessions,
      planWeekRange(startedAt, entry.week),
      entry.week,
      planStartedAt,
    ),
  }))
  const currentSessions = schedule.find((entry) => entry.week === week)?.sessions ?? []
  const currentCompleted = schedule.find((entry) => entry.week === week)?.completed ?? new Set<number>()
  const currentWeekComplete = currentSessions.length > 0
    && currentSessions.every((session) => currentCompleted.has(session.index))

  return {
    planName: plan.name,
    level: plan.level,
    frequency: plan.frequency,
    weeks: plan.weeks,
    week,
    weekComplete: currentWeekComplete,
    progress: planElapsedFraction(startedAt, now, plan.weeks),
    retestDue: baselineRetestDue(plan, startedAt, settings.baselineTestedAt, now),
    schedule: schedule.map((entry) => ({
      week: entry.week,
      current: entry.week === week,
      locked: entry.week > week && !currentWeekComplete,
      sessions: entry.sessions.map((session) => ({
        ...session,
        completed: entry.completed.has(session.index),
      })),
    })),
  }
}
