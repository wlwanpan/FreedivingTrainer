import Button from '@/components/Button'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, Fonts, FontSizes, Radii } from '@/design/styles'
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
          One maximum static hold sizes your tables. Mark the first contraction, then keep holding until you need to breathe. After that, choose a plan or build your own. Keep CO2 and O2 on different days.
        </SCopy>
        <SCard>
          <SCardTitle>CO2</SCardTitle>
          <SCardCopy>The hold stays fixed. Rest starts long and steps down each round.</SCardCopy>
        </SCard>
        <SCard>
          <SCardTitle>O2</SCardTitle>
          <SCardCopy>Holds get longer each round. Rest stays fixed.</SCardCopy>
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
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
`

const STitle = styled.Text`
  margin-top: 8px;
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XLarge};
  font-weight: 700;
  color: ${Colors.Text};
`

const SCopy = styled.Text`
  margin-top: 12px;
  margin-bottom: 24px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`

const SCard = styled.View`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SCardTitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SCardCopy = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SFooter = styled.View`
  padding: 16px 24px 8px;
`
