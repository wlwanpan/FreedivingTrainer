import { useSQLContext } from '@/providers/sql'
import {
  currentPlanWeek,
  projectHold,
  trainingPlanById,
  weeklyCo2Tables,
  WeekTable,
} from '@/utils/training_plan'


export type PlanWeek = {
  planName: string
  weeks: number
  week: number
  tablesPerWeek: number
  gainSeconds: number
  projectedSeconds: number
  tables: WeekTable[]
}

export default function useCurrentPlanWeek(): PlanWeek | null {
  const { settings } = useSQLContext()
  const plan = trainingPlanById(settings.trainingPlan)
  const startedAt = settings.trainingPlanStartedAt
  const baselineMaxSeconds = settings.baselineMaxHoldSeconds
  if (plan == null || startedAt == null || baselineMaxSeconds == null) return null

  const week = currentPlanWeek(startedAt, new Date(), plan.weeks)
  const projection = projectHold(baselineMaxSeconds, plan)
  return {
    planName: plan.name,
    weeks: plan.weeks,
    week,
    tablesPerWeek: plan.tablesPerWeek,
    gainSeconds: projection.gainSeconds,
    projectedSeconds: projection.projectedSeconds,
    tables: weeklyCo2Tables({
      baselineMaxSeconds,
      contractionSeconds: settings.baselineContractionSeconds,
      plan,
      week,
    }),
  }
}
