import { ErrorTitles } from '@/constants/errors'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import { TrainingPlanId, trainingPlanById, weeklySessions } from '@/utils/training_plan'
import useCurrentPlanWeek from './useCurrentPlanWeek'


export default function useChangeTrainingPlan() {
  const sql = useSQLContext()
  const { showConfirmation, showWarning } = useWarningModal()
  const planWeek = useCurrentPlanWeek()

  return async (planId: TrainingPlanId) => {
    const next = trainingPlanById(planId)
    const current = trainingPlanById(sql.settings.trainingPlan)
    if (next == null || next.id === current?.id) return

    const baseline = sql.settings.baselineMaxHoldSeconds
    if (baseline == null) return

    if (planWeek != null && planWeek.week > 1) {
      const confirmed = await showConfirmation(
        'Change plan?',
        `You are on week ${planWeek.week} of the ${planWeek.planName}. That progress will be lost, and the new plan starts at week 1.`,
      )
      if (!confirmed) return
    }

    const now = new Date()
    const sessions = weeklySessions({
      baselineMaxSeconds: baseline,
      contractionSeconds: sql.settings.baselineContractionSeconds,
      plan: next,
      week: 1,
    })
    const co2 = sessions.find((session) => session.kind === 'co2') ?? sessions[0]
    const o2 = sessions.find((session) => session.kind === 'o2') ?? null
    if (co2 == null) return

    const res = await sql.updateSettings({
      ...sql.settings,
      co2HoldSeconds: co2.holdSeconds,
      co2RestStartSeconds: co2.restStartSeconds,
      co2RestStepSeconds: co2.restStepSeconds,
      co2Rounds: co2.rounds,
      ...(o2 == null ? {} : {
        o2HoldStartSeconds: o2.holdSeconds,
        o2HoldStepSeconds: o2.holdStepSeconds,
        o2RestSeconds: o2.restStartSeconds,
        o2Rounds: o2.rounds,
      }),
      trainingPlan: next.id,
      trainingPlanStartedAt: now,
      updatedAt: now,
    })
    if (res.error) {
      showWarning(ErrorTitles.Sql, res.error.message)
    }
  }
}
