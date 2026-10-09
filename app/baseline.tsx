import BaselinePlans from '@/components/BaselinePlans'
import BaselinePrep from '@/components/BaselinePrep'
import BaselineResult from '@/components/BaselineResult'
import BaselineTimer from '@/components/BaselineTimer'
import WrapperScreen from '@/components/WrapperScreen'
import useBaselineTest from '@/hooks/useBaselineTest'
import { useLocalSearchParams, useRouter } from 'expo-router'


export default function BaselineScreen() {
  const router = useRouter()
  const { entry } = useLocalSearchParams<{ entry?: string | string[] }>()
  const entryValue = Array.isArray(entry) ? entry[0] : entry
  const test = useBaselineTest(entryValue === 'onboarding')

  return (
    <WrapperScreen skipBottomInset>
      {test.stage === 'prep' ? (
        <BaselinePrep onStart={test.start} onBack={() => router.back()} />
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
          onStart={(planId) => { void test.save(planId) }}
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
