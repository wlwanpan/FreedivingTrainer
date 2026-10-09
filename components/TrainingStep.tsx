import { Colors, FontSizes } from '@/design/styles'
import { TrainPhaseKind } from '@/hooks/useTrainingClock'
import { useFormatterContext } from '@/providers/formatter'
import { useEffect } from 'react'
import Animated, {
  Easing,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { ImageSourcePropType } from 'react-native'
import { styled } from 'styled-components/native'


export type TrainingStepRole = 'done' | 'current' | 'next' | 'complete'

const PhaseLabel: Record<TrainPhaseKind, string> = {
  breathe: 'Breathe-up',
  hold: 'Hold',
  rest: 'Rest',
}

const PhaseColor: Record<TrainPhaseKind, string> = {
  breathe: Colors.DeepPrimary,
  hold: Colors.TealPrimary,
  rest: Colors.BluePrimary,
}

export const TrainingStepLayout = {
  cardHeight: 176,
  gap: 28,
  edge: 16,
} as const

const Place = {
  done: { scale: 0.78, opacity: 0.78 },
  current: { scale: 1, opacity: 1 },
  next: { scale: 0.9, opacity: 1 },
  complete: { scale: 1, opacity: 1 },
} as const

export function trainingStepY(role: TrainingStepRole, chainHeight: number): number {
  const current = Math.max(0, (chainHeight - TrainingStepLayout.cardHeight) / 2)
  if (role === 'done') {
    const lifted = current - TrainingStepLayout.gap - TrainingStepLayout.cardHeight * Place.done.scale
    return Math.max(TrainingStepLayout.edge, lifted)
  }
  if (role === 'next') {
    return current + TrainingStepLayout.cardHeight + TrainingStepLayout.gap
  }
  return current
}

const Sprites: Record<TrainPhaseKind | 'meditate', ImageSourcePropType> = {
  breathe: require('../assets/images/training/breathe.png'),
  hold: require('../assets/images/training/hold.png'),
  rest: require('../assets/images/training/rest.png'),
  meditate: require('../assets/images/training/meditate.png'),
}

const Motion = {
  duration: 460,
  easing: Easing.out(Easing.cubic),
}

type Props = {
  role: TrainingStepRole
  y: number
  kind?: TrainPhaseKind
  seconds?: number
  remainingSeconds?: number
  roundIndex?: number | null
  roundCount?: number
  note?: string
}

export default function TrainingStep({
  role,
  y,
  kind = 'breathe',
  seconds = 0,
  remainingSeconds = 0,
  roundIndex = null,
  roundCount = 0,
  note,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const place = Place[role]
  const translateY = useSharedValue(y)
  const scale = useSharedValue(place.scale)
  const opacity = useSharedValue(place.opacity)
  const veil = useSharedValue(role === 'next' ? 1 : 0)

  useEffect(() => {
    const nextPlace = Place[role]
    translateY.value = withTiming(y, Motion)
    scale.value = withTiming(nextPlace.scale, Motion)
    opacity.value = withTiming(nextPlace.opacity, Motion)
    veil.value = withTiming(role === 'next' ? 1 : 0, Motion)
  }, [opacity, role, scale, translateY, veil, y])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transformOrigin: 'top',
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))
  const veilStyle = useAnimatedStyle(() => ({
    opacity: veil.value,
  }))
  const zIndex = role === 'done' ? 3 : role === 'next' ? 1 : 2

  const shownSeconds = role === 'current' ? remainingSeconds : seconds
  const detail = role === 'complete'
    ? note ?? ''
    : roundIndex == null
      ? 'Settle in before the first hold.'
      : `Round ${roundIndex} of ${roundCount}`
  const title = role === 'complete'
    ? 'Table complete'
    : role === 'done'
      ? PhaseLabel[kind]
      : PhaseLabel[kind]
  const color = role === 'done'
    ? Colors.GreyPrimary
    : role === 'complete'
      ? Colors.TealPrimary
      : PhaseColor[kind]

  return (
    <SExit
      exiting={FadeOutUp.duration(380)}
      style={{ zIndex }}
      pointerEvents={role === 'current' || role === 'complete' ? 'auto' : 'none'}
    >
      <SCard style={animatedStyle}>
        <SClip>
          <SSpriteFrame>
            <SSprite
              source={role === 'complete' ? Sprites.meditate : Sprites[kind]}
              resizeMode='contain'
            />
          </SSpriteFrame>
          <STitle style={{ color }}>{role === 'done' ? 'Completed' : title}</STitle>
          {role === 'done' ? (
            <SDoneLabel style={{ color: PhaseColor[kind] }}>{PhaseLabel[kind]}</SDoneLabel>
          ) : (
            <STime
              style={{
                color: role === 'complete' ? Colors.DeepPrimary : color,
                fontVariant: ['tabular-nums'],
              }}
            >
              {role === 'complete' ? 'Done' : formatSeconds(shownSeconds)}
            </STime>
          )}
          {role === 'done' ? (
            <SDoneTime>{formatSeconds(seconds)}</SDoneTime>
          ) : (
            <SDetail>{detail}</SDetail>
          )}
          <SVeil style={veilStyle} />
        </SClip>
      </SCard>
    </SExit>
  )
}

const SExit = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 28px;
  right: 28px;
`

const SCard = styled(Animated.View)`
  border-radius: 22px;
  background-color: ${Colors.White};
  shadow-color: ${Colors.Black};
  shadow-offset: 0px 10px;
  shadow-opacity: 0.08;
  shadow-radius: 18px;
  elevation: 4;
`

const SClip = styled.View`
  min-height: ${TrainingStepLayout.cardHeight}px;
  justify-content: center;
  padding: 22px 20px 18px;
  border-radius: 22px;
  overflow: hidden;
  background-color: ${Colors.White};
`

const SSpriteFrame = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  align-items: center;
  justify-content: center;
`

const SSprite = styled.Image`
  width: 100%;
  aspect-ratio: 1;
  opacity: 0.22;
`

const STitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  text-align: center;
`

const SDoneLabel = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Large};
  font-weight: 800;
  text-align: center;
`

const STime = styled.Text`
  margin-top: 6px;
  font-size: ${FontSizes.Timer};
  font-weight: 700;
  text-align: center;
`

const SDoneTime = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  text-align: center;
  color: ${Colors.GreyPrimary};
`

const SDetail = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  text-align: center;
  color: ${Colors.GreyPrimary};
`

const SVeil = styled(Animated.View)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.42);
`
