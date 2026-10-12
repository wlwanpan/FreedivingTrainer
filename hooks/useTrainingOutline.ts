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
  progress: number
  retestDue: boolean
  schedule: TrainingWeek[]
}

export default function useTrainingOutline(): TrainingOutline | null {
  const { settings, sessions } = useSQLContext()
  const plan = trainingPlanFromSettings(settings)
  const startedAt = settings.trainingPlanStartedAt
  const baselineMaxSeconds = settings.baselineMaxHoldSeconds
  if (plan == null || startedAt == null || baselineMaxSeconds == null) return null

  const now = new Date()
  const week = currentPlanWeek(startedAt, now, plan.weeks)
  const schedule = planSchedule({
    baselineMaxSeconds,
    contractionSeconds: settings.baselineContractionSeconds,
    plan,
  })
  const currentSessions = schedule.find((entry) => entry.week === week)?.sessions ?? []
  const completed = completedSessionIndexes(sessions, currentSessions, planWeekRange(startedAt, week))
  const currentWeekComplete = currentSessions.length > 0
    && currentSessions.every((session) => completed.has(session.index))

  return {
    planName: plan.name,
    level: plan.level,
    frequency: plan.frequency,
    weeks: plan.weeks,
    week,
    progress: planElapsedFraction(startedAt, now, plan.weeks),
    retestDue: baselineRetestDue(plan, startedAt, settings.baselineTestedAt, now),
    schedule: schedule.map((entry) => ({
      week: entry.week,
      current: entry.week === week,
      locked: entry.week > week && !currentWeekComplete,
      sessions: entry.sessions.map((session) => ({
        ...session,
        completed: entry.week === week && completed.has(session.index),
      })),
    })),
  }
}
