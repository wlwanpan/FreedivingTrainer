import { useSQLContext } from '@/providers/sql'
import {
  baselineRetestDue,
  currentPlanWeek,
  planDetail,
  trainingPlanFromSettings,
  weeklySessions,
  WeekSession,
} from '@/utils/training_plan'


export type PlanWeek = {
  planName: string
  weeks: number
  week: number
  frequency: string
  setsO2: boolean
  retestDue: boolean
  detail: string
  sessions: WeekSession[]
}

export default function useCurrentPlanWeek(): PlanWeek | null {
  const { settings } = useSQLContext()
  const plan = trainingPlanFromSettings(settings)
  const startedAt = settings.trainingPlanStartedAt
  const baselineMaxSeconds = settings.baselineMaxHoldSeconds
  if (plan == null || startedAt == null || baselineMaxSeconds == null) return null

  const now = new Date()
  const week = currentPlanWeek(startedAt, now, plan.weeks)
  const retestDue = baselineRetestDue(plan, startedAt, settings.baselineTestedAt, now)
  return {
    planName: plan.name,
    weeks: plan.weeks,
    week,
    frequency: plan.frequency,
    setsO2: plan.setsO2,
    retestDue,
    detail: planDetail({
      plan,
      week,
      contractionSeconds: settings.baselineContractionSeconds,
      retestDue,
    }),
    sessions: weeklySessions({
      baselineMaxSeconds,
      contractionSeconds: settings.baselineContractionSeconds,
      plan,
      week,
    }),
  }
}
