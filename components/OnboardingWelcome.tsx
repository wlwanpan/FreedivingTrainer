import Button from '@/components/Button'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { trainingSpriteFrame } from '@/utils/training_sprite'
import { styled } from 'styled-components/native'


type Props = {
  onContinue: () => void
}

export default function OnboardingWelcome({ onContinue }: Props) {
  const { t } = useI18n()
  const sprite = trainingSpriteFrame('meditate', 1)

  return (
    <Wrapper>
      <SBody>
        <SEyebrow>{t('onboarding.eyebrow')}</SEyebrow>
        <SArt>
          <SSprite source={sprite.source} style={sprite.style} accessible={false} />
        </SArt>
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

const SArt = styled.View`
  align-self: center;
  width: 200px;
  height: 200px;
  margin-top: ${Space.xl}px;
  margin-bottom: ${Space.xl}px;
  overflow: hidden;
`

const SSprite = styled.Image``

const SEyebrow = styled.Text`
  margin-top: 8px;
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XLarge};
  font-weight: 700;
  color: ${Colors.Text};
`

const STitle = styled.Text`
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
