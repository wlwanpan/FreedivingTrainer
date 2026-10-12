import BaselinePlans from '@/components/BaselinePlans'
import WrapperScreen from '@/components/WrapperScreen'
import useChangeTrainingPlan from '@/hooks/useChangeTrainingPlan'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { useSQLContext } from '@/providers/sql'
import { generateTablesFromBaseline } from '@/utils/baseline'
import { PlanChoice, trainingPlanById } from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'


export default function PlanScreen() {
  const router = useRouter()
  const { settings } = useSQLContext()
  const changePlan = useChangeTrainingPlan()
  const [saving, setSaving] = useState(false)
  const maxHoldSeconds = settings.baselineMaxHoldSeconds

  useEffect(() => {
    if (maxHoldSeconds == null) router.back()
  }, [maxHoldSeconds, router])

  if (maxHoldSeconds == null) return null

  const outcome: BaselineOutcome = {
    maxHoldSeconds,
    contractionSeconds: settings.baselineContractionSeconds,
    tooShort: false,
    plan: generateTablesFromBaseline({
      maxHoldSeconds,
      contractionSeconds: settings.baselineContractionSeconds,
    }),
  }
  const currentPlanId = trainingPlanById(settings.trainingPlan)?.id

  const apply = async (choice: PlanChoice) => {
    if (saving) return
    setSaving(true)
    const result = await changePlan(choice)
    setSaving(false)
    if (result === 'saved' || result === 'unchanged') router.back()
  }

  return (
    <WrapperScreen skipBottomInset>
      <BaselinePlans
        outcome={outcome}
        saving={saving}
        initialPlanId={currentPlanId}
        initialCustomPlan={settings.customPlan}
        onBack={() => router.back()}
        onStart={(choice) => { void apply(choice) }}
        onRetake={() => router.replace('/baseline')}
      />
    </WrapperScreen>
  )
}
