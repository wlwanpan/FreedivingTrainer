import Button from '@/components/Button'
import { Colors, FontSizes } from '@/design/styles'
import { TrainingGestureCopy } from '@/utils/training_gestures'
import { useEffect, useState } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { styled } from 'styled-components/native'


type Props = {
  onDismiss: () => void
}

const Travel = 46

export default function TrainingGestureTutorial({ onDismiss }: Props) {
  const [step, setStep] = useState(0)
  const press = useSharedValue(0)
  const rippleA = useSharedValue(1)
  const rippleB = useSharedValue(1)
  const single = step === 0

  useEffect(() => {
    let cancelled = false
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const wait = (ms: number) => new Promise<void>((resolve) => {
      const id = setTimeout(() => {
        timers.delete(id)
        resolve()
      }, ms)
      timers.add(id)
    })
    const pulse = (slot: number) => {
      const ripple = slot === 0 ? rippleA : rippleB
      ripple.value = 0
      ripple.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.quad) })
    }
    const run = async () => {
      let slot = 0
      while (!cancelled) {
        for (let index = 0; index < 2; index += 1) {
          if (cancelled) return
          setStep(index)
          press.value = withTiming(0, { duration: 140 })
          await wait(520)
          const taps = index === 0 ? 1 : 2
          for (let tap = 0; tap < taps; tap += 1) {
            if (cancelled) return
            press.value = withTiming(1, { duration: 90 })
            await wait(130)
            if (cancelled) return
            press.value = withTiming(0, { duration: 150 })
            pulse(slot)
            slot = slot === 0 ? 1 : 0
            await wait(tap === taps - 1 ? 980 : 170)
          }
        }
      }
    }
    void run()
    return () => {
      cancelled = true
      for (const id of timers) clearTimeout(id)
    }
  }, [press, rippleA, rippleB])

  const handStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: press.value * Travel },
      { scale: 1 - press.value * 0.05 },
    ],
  }))
  const rippleAStyle = useAnimatedStyle(() => ({
    opacity: (1 - rippleA.value) * 0.55,
    transform: [{ scale: 0.5 + rippleA.value * 1.15 }],
  }))
  const rippleBStyle = useAnimatedStyle(() => ({
    opacity: (1 - rippleB.value) * 0.55,
    transform: [{ scale: 0.5 + rippleB.value * 1.15 }],
  }))
  const tone = single ? Colors.CoralPrimary : Colors.TealPrimary

  return (
    <Wrapper accessibilityViewIsModal>
      <SCard>
        <SStage>
          <STarget style={{ borderColor: tone }} />
          <SRipple style={[rippleAStyle, { borderColor: tone }]} />
          <SRipple style={[rippleBStyle, { borderColor: tone }]} />
          <SHand style={handStyle}>
            <SFinger>
              <SNail />
              <SCrease />
            </SFinger>
          </SHand>
        </SStage>
        <SCue $active={single}>
          <SCueTitle $active={single}>{TrainingGestureCopy.singleTitle}</SCueTitle>
          <SCueBody>{TrainingGestureCopy.singleBody}</SCueBody>
        </SCue>
        <SCue $active={!single}>
          <SCueTitle $active={!single}>{TrainingGestureCopy.doubleTitle}</SCueTitle>
          <SCueBody>{TrainingGestureCopy.doubleBody}</SCueBody>
        </SCue>
        <Button title='Got it' onPress={onDismiss} />
      </SCard>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  justify-content: center;
  padding: 20px;
  background-color: rgba(6, 52, 60, 0.55);
`

const SCard = styled.View`
  padding: 18px 18px 8px;
  border-radius: 20px;
  background-color: ${Colors.White};
`

const SStage = styled.View`
  height: 196px;
  margin-bottom: 16px;
  border-radius: 16px;
  background-color: ${Colors.TealBackground};
  overflow: hidden;
`

const STarget = styled.View`
  position: absolute;
  bottom: 28px;
  left: 50%;
  width: 36px;
  height: 36px;
  margin-left: -18px;
  border-radius: 18px;
  border-width: 2px;
  background-color: ${Colors.White};
`

const SRipple = styled(Animated.View)`
  position: absolute;
  bottom: 22px;
  left: 50%;
  width: 48px;
  height: 48px;
  margin-left: -24px;
  border-radius: 24px;
  border-width: 3px;
`

const SHand = styled(Animated.View)`
  position: absolute;
  top: 16px;
  left: 50%;
  margin-left: -32px;
`

const SFinger = styled.View`
  width: 64px;
  height: 92px;
  border-radius: 32px;
  background-color: ${Colors.DeepPrimary};
  align-items: center;
`

const SNail = styled.View`
  width: 26px;
  height: 18px;
  margin-top: 12px;
  border-radius: 10px;
  background-color: ${Colors.SandPrimary};
`

const SCrease = styled.View`
  width: 36px;
  height: 3px;
  margin-top: 14px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.28);
`

const SCue = styled.View<{ $active: boolean }>`
  margin-bottom: 12px;
  opacity: ${(props) => (props.$active ? 1 : 0.4)};
`

const SCueTitle = styled.Text<{ $active: boolean }>`
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${(props) => (props.$active ? Colors.DeepPrimary : Colors.GreyPrimary)};
`

const SCueBody = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`
