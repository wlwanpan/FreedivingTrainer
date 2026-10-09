import Button from '@/components/Button'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, FontSizes } from '@/design/styles'
import { useSQLContext } from '@/providers/sql'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { styled } from 'styled-components/native'


export default function OnboardingScreen() {
  const router = useRouter()
  const sql = useSQLContext()
  const onboardedAt = sql.settings.createdAt?.getTime() ?? null

  useEffect(() => {
    if (onboardedAt != null) {
      router.replace('/')
    }
  }, [onboardedAt, router])

  const startTest = () => {
    router.push({ pathname: '/baseline', params: { entry: 'onboarding' } })
  }

  return (
    <WrapperScreen>
      <SBody>
        <SEyebrow>FreedivingTrainer</SEyebrow>
        <STitle>Find your baseline</STitle>
        <SCopy>
          One maximum static hold sizes your CO2 and O2 tables. Mark the first contraction, then keep holding until you need to breathe.
        </SCopy>
        <SCard>
          <SCardTitle>CO2</SCardTitle>
          <SCardCopy>The hold is set to 50–60% of that maximum. Rest starts long and steps down each round.</SCardCopy>
        </SCard>
        <SCard>
          <SCardTitle>O2</SCardTitle>
          <SCardCopy>Holds climb toward about 80% of your maximum. Rest stays long enough to recover.</SCardCopy>
        </SCard>
      </SBody>
      <SFooter>
        <Button title='Start baseline test' onPress={startTest} />
      </SFooter>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  flex: 1;
  padding: 24px 24px 0;
`

const SEyebrow = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.TealPrimary};
`

const STitle = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SCopy = styled.Text`
  margin-top: 12px;
  margin-bottom: 24px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.GreyPrimary};
`

const SCard = styled.View`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 14px;
  background-color: ${Colors.TealBackground};
`

const SCardTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.DeepPrimary};
`

const SCardCopy = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SFooter = styled.View`
  padding: 16px 24px 8px;
`
