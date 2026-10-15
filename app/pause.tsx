import Button from '@/components/Button'
import { Colors, Fonts, FontSizes } from '@/design/styles'
import { resumeTrainingSession } from '@/hooks/trainingPause'
import { useI18n } from '@/providers/i18n'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styled } from 'styled-components/native'


export default function PauseScreen() {
  const { t } = useI18n()
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      resumeTrainingSession()
    })
  }, [navigation])

  const dismiss = () => router.back()
  const taps = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(400)
      .maxDistance(48)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (success) dismiss()
      })
  }, [])

  return (
    <Wrapper
      accessibilityRole='alert'
      accessibilityLabel={t('pause.paused')}
    >
      <GestureDetector gesture={taps}>
        <SScrim />
      </GestureDetector>
      <SCard
        onPress={() => {}}
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <STitle>{t('pause.paused')}</STitle>
        <Button title={t('pause.resume')} onPress={dismiss} />
      </SCard>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
  justify-content: flex-end;
  background-color: ${Colors.Overlay};
`

const SScrim = styled.View`
  flex: 1;
`

const SCard = styled.Pressable`
  padding: 24px 20px 8px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background-color: ${Colors.Card};
`

const STitle = styled.Text`
  margin-bottom: 16px;
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Large};
  font-weight: 700;
  text-align: center;
  color: ${Colors.Text};
`
