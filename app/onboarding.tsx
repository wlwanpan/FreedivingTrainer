import OnboardingBaselineIntro from '@/components/OnboardingBaselineIntro'
import OnboardingWelcome from '@/components/OnboardingWelcome'
import WrapperScreen from '@/components/WrapperScreen'
import { useSQLContext } from '@/providers/sql'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'


type OnboardingStep = 'welcome' | 'baseline'

export default function OnboardingScreen() {
  const router = useRouter()
  const sql = useSQLContext()
  const onboardedAt = sql.settings.createdAt?.getTime() ?? null
  const [step, setStep] = useState<OnboardingStep>('welcome')

  useEffect(() => {
    if (onboardedAt != null) {
      router.replace('/')
    }
  }, [onboardedAt, router])

  const startTest = () => {
    router.push({ pathname: '/baseline', params: { entry: 'onboarding' } })
  }

  const enterTimes = () => {
    router.push({ pathname: '/baseline', params: { entry: 'onboarding', start: 'manual' } })
  }

  return (
    <WrapperScreen skipBottomInset>
      {step === 'welcome' ? (
        <OnboardingWelcome onContinue={() => setStep('baseline')} />
      ) : (
        <OnboardingBaselineIntro onStart={startTest} onEnterTimes={enterTimes} />
      )}
    </WrapperScreen>
  )
}
