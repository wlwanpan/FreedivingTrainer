import HeaderWithBtn from '@/components/HeaderWithBtn'
import WrapperScreen from '@/components/WrapperScreen'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function LanguageScreen() {
  const router = useRouter()
  const { t, language, setLanguage, options } = useI18n()
  const paddingBottom = useBottomControlInset(false)

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn
        headerText={t('language.label')}
        leftBack
        leftOnClick={() => router.back()}
      />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <SCard>
          {options.map((option, index) => {
            const selected = language === option.code
            return (
              <SOption
                key={option.code}
                onPress={() => {
                  setLanguage(option.code)
                  router.back()
                }}
                accessibilityRole='button'
                accessibilityState={{ selected }}
                accessibilityLabel={option.nativeName}
              >
                {({ pressed }) => (
                  <SRow $last={index === options.length - 1} $pressed={pressed}>
                    <SName>{option.nativeName}</SName>
                    {selected ? (
                      <Ionicons name='checkmark-circle' size={22} color={Colors.Seafoam} />
                    ) : null}
                  </SRow>
                )}
              </SOption>
            )
          })}
        </SCard>
      </SScroll>
    </WrapperScreen>
  )
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SCard = styled.View`
  margin: ${Space.md}px ${Space.screen}px 12px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SOption = styled.Pressable`
  min-height: ${Layout.MinControl}px;
`

const SRow = styled.View<{ $last: boolean; $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  min-height: ${Layout.MinControl}px;
  padding: ${Space.md}px;
  border-bottom-width: ${(props) => props.$last ? 0 : 1}px;
  border-bottom-color: ${Colors.Hairline};
  background-color: ${(props) => props.$pressed ? Colors.Hover : Colors.Card};
`

const SName = styled.Text`
  flex: 1;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`
