import { Colors } from '@/design/styles'
import { TrainPhaseKind } from '@/hooks/useTrainingClock'
import { useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { styled } from 'styled-components/native'


const BreathCycle = { duration: 5600, easing: Easing.inOut(Easing.sin) }
const RippleCycle = { duration: 14000, easing: Easing.inOut(Easing.sin) }
const StillnessCycle = { duration: 8000, easing: Easing.inOut(Easing.sin) }
const Fade = { duration: 800, easing: Easing.out(Easing.cubic) }

const PhaseColor: Record<TrainPhaseKind, string> = {
  breathe: Colors.DeepPrimary,
  hold: Colors.TealPrimary,
  rest: Colors.BluePrimary,
}

type Props = {
  kind: TrainPhaseKind | null
  paused: boolean
}

function useRippleStyle(ring: SharedValue<number>, presence: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    opacity: presence.value * (1 - ring.value) * 0.28,
    transform: [{ scale: 0.32 + ring.value * 1.55 }],
  }))
}

export default function TrainingBackdrop({ kind, paused }: Props) {
  const breathing = kind === 'breathe' || kind === 'rest'
  const meditating = kind === 'hold'
  const breath = useSharedValue(0)
  const stillness = useSharedValue(0)
  const presence = useSharedValue(0)
  const ringA = useSharedValue(0)
  const ringB = useSharedValue(0)
  const ringC = useSharedValue(0)
  const ringsStarted = useRef(false)
  const [frame, setFrame] = useState({ width: 0, height: 0 })

  useEffect(() => {
    presence.value = withTiming(meditating ? 1 : 0, Fade)
  }, [meditating, presence])

  useEffect(() => {
    if (!breathing) {
      cancelAnimation(breath)
      breath.value = withTiming(0, Fade)
      return
    }
    if (paused) {
      cancelAnimation(breath)
      return
    }
    breath.value = withRepeat(withTiming(1, BreathCycle), -1, true)
    return () => cancelAnimation(breath)
  }, [breath, breathing, paused])

  useEffect(() => {
    const rings = [ringA, ringB, ringC]
    if (!meditating) {
      ringsStarted.current = false
      cancelAnimation(stillness)
      rings.forEach((ring) => cancelAnimation(ring))
      return
    }
    if (paused) {
      cancelAnimation(stillness)
      rings.forEach((ring) => cancelAnimation(ring))
      return
    }
    const first = !ringsStarted.current
    ringsStarted.current = true
    stillness.value = withRepeat(withTiming(1, StillnessCycle), -1, true)
    rings.forEach((ring, index) => {
      if (first) ring.value = 0
      const delay = first ? index * (RippleCycle.duration / rings.length) : 0
      ring.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, RippleCycle),
            withTiming(0, { duration: 1 }),
          ),
          -1,
          false,
        ),
      )
    })
    return () => {
      cancelAnimation(stillness)
      rings.forEach((ring) => cancelAnimation(ring))
    }
  }, [meditating, paused, ringA, ringB, ringC, stillness])

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setFrame((current) => (
      current.width === width && current.height === height ? current : { width, height }
    ))
  }

  const color = PhaseColor[kind ?? 'breathe']
  const diameter = frame.width * 1.7
  const coreDiameter = diameter * 0.55
  const orbFrame = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    left: (frame.width - diameter) / 2,
    top: frame.height / 2 - diameter / 2,
  }
  const coreFrame = {
    width: coreDiameter,
    height: coreDiameter,
    borderRadius: coreDiameter / 2,
    left: (frame.width - coreDiameter) / 2,
    top: frame.height / 2 - coreDiameter / 2,
  }
  const haloStyle = useAnimatedStyle(() => ({
    opacity: breath.value * 0.14,
    transform: [{ scale: 0.28 + breath.value * 1.2 }],
  }))
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: breath.value * 0.3,
    transform: [{ scale: 0.18 + breath.value * 0.92 }],
  }))
  const coreStyle = useAnimatedStyle(() => ({
    opacity: breath.value * 0.42,
    transform: [{ scale: 0.12 + breath.value * 0.5 }],
  }))
  const glowStyle = useAnimatedStyle(() => ({
    opacity: presence.value * (0.08 + stillness.value * 0.1),
    transform: [{ scale: 0.5 + stillness.value * 0.08 }],
  }))
  const rippleA = useRippleStyle(ringA, presence)
  const rippleB = useRippleStyle(ringB, presence)
  const rippleC = useRippleStyle(ringC, presence)

  return (
    <SFill pointerEvents='none' onLayout={onLayout}>
      {frame.width > 0 ? (
        <>
          <SOrb style={[orbFrame, rippleA, { backgroundColor: Colors.TealPrimary }]} />
          <SOrb style={[orbFrame, rippleB, { backgroundColor: Colors.TealPrimary }]} />
          <SOrb style={[orbFrame, rippleC, { backgroundColor: Colors.TealPrimary }]} />
          <SOrb style={[orbFrame, glowStyle, { backgroundColor: Colors.TealPrimary }]} />
          <SOrb style={[orbFrame, haloStyle, { backgroundColor: color }]} />
          <SOrb style={[orbFrame, bubbleStyle, { backgroundColor: color }]} />
          <SOrb style={[coreFrame, coreStyle, { backgroundColor: color }]} />
        </>
      ) : null}
    </SFill>
  )
}

const SFill = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`

const SOrb = styled(Animated.View)`
  position: absolute;
`
