import OnboardingBaselineIntro from '@/components/OnboardingBaselineIntro'
import OnboardingWelcome from '@/components/OnboardingWelcome'
import WrapperScreen from '@/components/WrapperScreen'
import { useSQLContext } from '@/providers/sql'
import { Practice } from '@/utils/practice'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'


type OnboardingStep = 'welcome' | 'baseline'

export default function OnboardingScreen() {
  const router = useRouter()
  const sql = useSQLContext()
  const onboardedAt = sql.settings.createdAt?.getTime() ?? null
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [practice, setPractice] = useState<Practice | null>(null)

  useEffect(() => {
    if (onboardedAt != null) {
      router.replace('/')
    }
  }, [onboardedAt, router])

  const startTest = () => {
    if (practice == null) return
    router.push({ pathname: '/baseline', params: { entry: 'onboarding', practice } })
  }

  const enterTimes = () => {
    if (practice == null) return
    router.push({ pathname: '/baseline', params: { entry: 'onboarding', start: 'manual', practice } })
  }

  return (
    <WrapperScreen skipBottomInset>
      {step === 'welcome' ? (
        <OnboardingWelcome
          practice={practice}
          onSelect={setPractice}
          onContinue={() => {
            if (practice == null) return
            setStep('baseline')
          }}
        />
      ) : (
        <OnboardingBaselineIntro onStart={startTest} onEnterTimes={enterTimes} />
      )}
    </WrapperScreen>
  )
}
