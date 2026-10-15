import Button from '@/components/Button'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes, Radii } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { styled } from 'styled-components/native'


type Props = {
  onStart: () => void
  onEnterTimes: () => void
}

export default function OnboardingBaselineIntro({ onStart, onEnterTimes }: Props) {
  const { t } = useI18n()

  return (
    <Wrapper>
      <SBody>
        <SEyebrow>{t('onboarding.eyebrow')}</SEyebrow>
        <STitle>{t('onboarding.title')}</STitle>
        <SCopy>{t('onboarding.copy')}</SCopy>
        <SCard>
          <SCardTitle>{t('tables.co2')}</SCardTitle>
          <SCardCopy>{t('onboarding.co2Copy')}</SCardCopy>
        </SCard>
        <SCard>
          <SCardTitle>{t('tables.o2')}</SCardTitle>
          <SCardCopy>{t('onboarding.o2Copy')}</SCardCopy>
        </SCard>
      </SBody>
      <Footer>
        <Button title={t('onboarding.start')} onPress={onStart} />
        <Button title={t('baseline.enterTimes')} onPress={onEnterTimes} variant='ghost' />
      </Footer>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
`

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
