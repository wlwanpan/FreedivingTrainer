import { planCopy } from '@/i18n/labels'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import {
  baselineRetestDue,
  currentPlanWeek,
  customPlanFrequency,
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
  const { t } = useI18n()
  const plan = trainingPlanFromSettings(settings)
  const startedAt = settings.trainingPlanStartedAt
  const baselineMaxSeconds = settings.baselineMaxHoldSeconds
  if (plan == null || startedAt == null || baselineMaxSeconds == null) return null

  const now = new Date()
  const week = currentPlanWeek(startedAt, now, plan.weeks)
  const retestDue = baselineRetestDue(plan, startedAt, settings.baselineTestedAt, now)
  return {
    planName: planCopy(plan.id, 'name', t),
    weeks: plan.weeks,
    week,
    frequency: plan.id === 'custom'
      ? customPlanFrequency(plan.sessionKinds ?? [], t)
      : planCopy(plan.id, 'frequency', t),
    setsO2: plan.setsO2,
    retestDue,
    detail: planDetail({
      plan,
      week,
      contractionSeconds: settings.baselineContractionSeconds,
      retestDue,
    }, t),
    sessions: weeklySessions({
      baselineMaxSeconds,
      contractionSeconds: settings.baselineContractionSeconds,
      plan,
      week,
    }),
  }
}
