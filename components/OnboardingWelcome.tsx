import Button from '@/components/Button'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { Practice } from '@/utils/practice'
import { trainingSpriteFrame } from '@/utils/training_sprite'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


type Props = {
  practice: Practice | null
  onSelect: (practice: Practice) => void
  onContinue: () => void
}

const Choices: readonly { id: Practice; title: string; copy: string }[] = [
  { id: 'freediver', title: 'onboarding.practiceFreediver', copy: 'onboarding.practiceFreediverCopy' },
  { id: 'mermaid', title: 'onboarding.practiceMermaid', copy: 'onboarding.practiceMermaidCopy' },
]

export default function OnboardingWelcome({ practice, onSelect, onContinue }: Props) {
  const { t } = useI18n()
  const sprite = trainingSpriteFrame('meditate', 1)

  return (
    <Wrapper>
      <SBody showsVerticalScrollIndicator={false}>
        <SEyebrow>{t('onboarding.eyebrow')}</SEyebrow>
        <SArt>
          <SSprite source={sprite.source} style={sprite.style} accessible={false} />
        </SArt>
        <STitle>{t('onboarding.welcomeTitle')}</STitle>
        <SCopy>{t('onboarding.welcomeCopy')}</SCopy>
        <SList>
          {Choices.map((choice) => {
            const selected = practice === choice.id
            return (
              <SOption
                key={choice.id}
                onPress={() => onSelect(choice.id)}
                accessibilityRole='button'
                accessibilityState={{ selected }}
                accessibilityLabel={t(choice.title)}
              >
                {({ pressed }) => (
                  <SRow $pressed={pressed} $selected={selected}>
                    <SCopyBlock>
                      <SName>{t(choice.title)}</SName>
                      <SChoiceCopy>{t(choice.copy)}</SChoiceCopy>
                    </SCopyBlock>
                    {selected ? (
                      <Ionicons name='checkmark-circle' size={22} color={Colors.Seafoam} />
                    ) : null}
                  </SRow>
                )}
              </SOption>
            )
          })}
        </SList>
      </SBody>
      <Footer>
        <Button
          title={t('onboarding.continue')}
          onPress={onContinue}
          disabled={practice == null}
        />
      </Footer>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
`

const SBody = styled.ScrollView`
  flex: 1;
  padding: ${Space.lg}px ${Space.lg}px 0;
`

const SArt = styled.View`
  align-self: center;
  width: 160px;
  height: 160px;
  margin-top: ${Space.md}px;
  margin-bottom: ${Space.md}px;
  overflow: hidden;
`

const SSprite = styled.Image``

const SEyebrow = styled.Text`
  margin-top: ${Space.sm}px;
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
  margin-top: ${Space.sm}px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`

const SList = styled.View`
  gap: ${Space.sm}px;
  margin-top: ${Space.lg}px;
  margin-bottom: ${Space.md}px;
`

const SOption = styled.Pressable`
  min-height: ${Layout.MinControl}px;
`

const SRow = styled.View<{ $pressed: boolean; $selected: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${Space.sm}px;
  min-height: ${Layout.MinControl}px;
  padding: ${Space.md}px;
  border-radius: ${Radii.Button}px;
  border-width: 1px;
  border-color: ${(props) => props.$selected ? Colors.Seafoam : Colors.Hairline};
  background-color: ${(props) => props.$pressed ? Colors.Hover : props.$selected ? Colors.SeafoamMuted : Colors.Card};
  overflow: hidden;
`

const SCopyBlock = styled.View`
  flex: 1;
`

const SName = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SChoiceCopy = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`
