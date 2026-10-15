import { withWatchTrainingLoss } from '@/hooks/useWearableStatus'
import { planCopy } from '@/i18n/labels'
import { useI18n } from '@/providers/i18n'
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
import useTrainingOutline from './useTrainingOutline'


export type PlanChangeResult = 'saved' | 'unchanged' | 'cancelled' | 'error'

export default function useChangeTrainingPlan() {
  const sql = useSQLContext()
  const { t } = useI18n()
  const { showConfirmation, showWarning } = useWarningModal()
  const planWeek = useCurrentPlanWeek()
  const outline = useTrainingOutline()

  return async (choice: PlanChoice): Promise<PlanChangeResult> => {
    const next = planFromChoice(choice)
    const current = trainingPlanFromSettings(sql.settings)
    if (next == null) return 'error'
    if (isCurrentPlanChoice(sql.settings, choice)) return 'unchanged'

    const baseline = sql.settings.baselineMaxHoldSeconds
    if (baseline == null) return 'error'

    if (current != null && outline?.progress !== 1) {
      const confirmed = await showConfirmation(
        t('plan.changeTitle'),
        withWatchTrainingLoss(planSwitchWarning(planCopy(current.id, 'name', t), planWeek?.week ?? null, t), t),
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
      showWarning(t('errors.sql'), res.error.message)
      return 'error'
    }
    return 'saved'
  }
}
