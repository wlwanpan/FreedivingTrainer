import Button from '@/components/Button'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { styled } from 'styled-components/native'


type Props = {
  onContinue: () => void
}

export default function OnboardingWelcome({ onContinue }: Props) {
  const { t } = useI18n()

  return (
    <Wrapper>
      <SBody>
        <SEyebrow>{t('onboarding.eyebrow')}</SEyebrow>
        <STitle>{t('onboarding.welcomeTitle')}</STitle>
        <SCopy>{t('onboarding.welcomeCopy')}</SCopy>
      </SBody>
      <Footer>
        <Button title={t('onboarding.continue')} onPress={onContinue} />
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
  justify-content: center;
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
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`
