import { ErrorTitles } from '@/constants/errors'
import { withWatchTrainingLoss } from '@/hooks/useWearableStatus'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import {
  isCurrentPlanChoice,
  PlanChoice,
  planFromChoice,
  planSwitchWarning,
  serializeCustomPlan,
  trainingPlanFromSettings,
  weeklySessions,
} from '@/utils/training_plan'
import useCurrentPlanWeek from './useCurrentPlanWeek'


export type PlanChangeResult = 'saved' | 'unchanged' | 'cancelled' | 'error'

export default function useChangeTrainingPlan() {
  const sql = useSQLContext()
  const { showConfirmation, showWarning } = useWarningModal()
  const planWeek = useCurrentPlanWeek()

  return async (choice: PlanChoice): Promise<PlanChangeResult> => {
    const next = planFromChoice(choice)
    const current = trainingPlanFromSettings(sql.settings)
    if (next == null) return 'error'
    if (isCurrentPlanChoice(sql.settings, choice)) return 'unchanged'

    const baseline = sql.settings.baselineMaxHoldSeconds
    if (baseline == null) return 'error'

    if (current != null) {
      const confirmed = await showConfirmation(
        'Change plan?',
        withWatchTrainingLoss(planSwitchWarning(current.name, planWeek?.week ?? null)),
      )
      if (!confirmed) return 'cancelled'
    }

    const now = new Date()
    const sessions = weeklySessions({
      baselineMaxSeconds: baseline,
      contractionSeconds: sql.settings.baselineContractionSeconds,
      plan: next,
      week: 1,
    })
    const co2 = sessions.find((session) => session.kind === 'co2') ?? null
    const o2 = sessions.find((session) => session.kind === 'o2') ?? null
    if (sessions.length === 0) return 'error'

    const res = await sql.updateSettings({
      ...sql.settings,
      ...(co2 == null ? {} : {
        co2HoldSeconds: co2.holdSeconds,
        co2RestStartSeconds: co2.restStartSeconds,
        co2RestStepSeconds: co2.restStepSeconds,
        co2Rounds: co2.rounds,
      }),
      ...(o2 == null ? {} : {
        o2HoldStartSeconds: o2.holdSeconds,
        o2HoldStepSeconds: o2.holdStepSeconds,
        o2RestSeconds: o2.restStartSeconds,
        o2Rounds: o2.rounds,
      }),
      trainingPlan: next.id,
      customPlan: choice.custom == null ? sql.settings.customPlan : serializeCustomPlan(choice.custom),
      trainingPlanStartedAt: now,
      updatedAt: now,
    })
    if (res.error) {
      showWarning(ErrorTitles.Sql, res.error.message)
      return 'error'
    }
    return 'saved'
  }
}
