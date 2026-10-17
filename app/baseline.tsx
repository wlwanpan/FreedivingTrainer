import BaselineManual from '@/components/BaselineManual'
import BaselinePlans from '@/components/BaselinePlans'
import BaselinePrep from '@/components/BaselinePrep'
import BaselineResult from '@/components/BaselineResult'
import BaselineTimer from '@/components/BaselineTimer'
import WrapperScreen from '@/components/WrapperScreen'
import useBaselineTest from '@/hooks/useBaselineTest'
import { useSQLContext } from '@/providers/sql'
import { practiceFromValue } from '@/utils/practice'
import { trainingPlanById } from '@/utils/training_plan'
import { useLocalSearchParams, useRouter } from 'expo-router'


export default function BaselineScreen() {
  const router = useRouter()
  const { entry, start, practice } = useLocalSearchParams<{
    entry?: string | string[]
    start?: string | string[]
    practice?: string | string[]
  }>()
  const entryValue = Array.isArray(entry) ? entry[0] : entry
  const startValue = Array.isArray(start) ? start[0] : start
  const practiceValue = Array.isArray(practice) ? practice[0] : practice
  const initialStage = startValue === 'manual' ? 'manual' : 'prep'
  const { settings } = useSQLContext()
  const onboarding = entryValue === 'onboarding'
  const selectedPractice = practiceFromValue(onboarding ? practiceValue : settings.practice)
  const test = useBaselineTest(onboarding, initialStage, selectedPractice)

  return (
    <WrapperScreen skipBottomInset>
      {test.stage === 'prep' ? (
        <BaselinePrep
          onStart={test.start}
          onBack={() => router.back()}
        />
      ) : null}
      {test.stage === 'manual' ? (
        <BaselineManual
          initialMaxHoldSeconds={test.manualDefaults.maxHoldSeconds}
          initialContractionSeconds={test.manualDefaults.contractionSeconds}
          onBack={() => {
            if (startValue === 'manual') {
              router.back()
              return
            }
            test.cancel()
          }}
          onSubmit={test.submitManual}
        />
      ) : null}
      {test.stage === 'hold' ? (
        <BaselineTimer
          elapsedSeconds={test.elapsedSeconds}
          contractionSeconds={test.contractionSeconds}
          controlsReady={test.controlsReady}
          onContraction={test.markContraction}
          onFinish={test.finish}
          onCancel={test.cancel}
        />
      ) : null}
      {test.stage === 'plan' && test.outcome ? (
        <BaselinePlans
          outcome={test.outcome}
          saving={test.saving}
          practice={selectedPractice}
          initialPlanId={trainingPlanById(settings.trainingPlan)?.id}
          initialCustomPlan={settings.customPlan}
          onStart={(choice) => { void test.save(choice) }}
          onRetake={test.retake}
        />
      ) : null}
      {test.stage === 'result' && test.outcome ? (
        <BaselineResult
          outcome={test.outcome}
          saving={false}
          onUse={test.showPlan}
          onRetake={test.retake}
        />
      ) : null}
    </WrapperScreen>
  )
}
