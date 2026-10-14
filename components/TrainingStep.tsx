import { Colors, Fonts, FontSizes, Radii } from '@/design/styles'
import { TrainPhaseKind } from '@/hooks/useTrainingClock'
import { useFormatterContext } from '@/providers/formatter'
import { trainingSpriteFrame } from '@/utils/training_sprite'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { styled } from 'styled-components/native'


export type TrainingStepRole = 'done' | 'current' | 'next' | 'complete'

const PhaseLabel: Record<TrainPhaseKind, string> = {
  breathe: 'Breathe-up',
  hold: 'Hold',
  rest: 'Rest',
}

const PhaseColor: Record<TrainPhaseKind, string> = {
  breathe: Colors.Aquamarine,
  hold: Colors.Seafoam,
  rest: Colors.Aquamarine,
}

export const TrainingStepLayout = {
  inset: 28,
  gap: 28,
  edge: 16,
} as const

export type TrainingCardSize = {
  width: number
  height: number
}

export function trainingCardSize(windowWidth: number): TrainingCardSize {
  const width = Math.max(0, (windowWidth - TrainingStepLayout.inset * 2) * 0.9)
  return { width, height: Math.round(width * 0.6) }
}

const Place = {
  done: { scale: 0.78, opacity: 0.78 },
  current: { scale: 1, opacity: 1 },
  next: { scale: 0.9, opacity: 1 },
  complete: { scale: 1, opacity: 1 },
} as const

export function trainingStepY(role: TrainingStepRole, chainHeight: number, card: TrainingCardSize): number {
  const current = Math.max(0, (chainHeight - card.height) / 2)
  if (role === 'done') {
    const lifted = current - TrainingStepLayout.gap - card.height * Place.done.scale
    return Math.max(TrainingStepLayout.edge, lifted)
  }
  if (role === 'next') {
    return current + card.height + TrainingStepLayout.gap
  }
  return current
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
  aside?: string
  animated?: boolean
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
  aside,
  animated = true,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const { width } = useWindowDimensions()
  const card = trainingCardSize(width)
  const place = Place[role]
  const translateY = useSharedValue(y)
  const scale = useSharedValue(place.scale)
  const opacity = useSharedValue(place.opacity)
  const veil = useSharedValue(role === 'next' ? 1 : 0)

  useEffect(() => {
    const nextPlace = Place[role]
    const nextVeil = role === 'next' ? 1 : 0
    if (!animated) {
      translateY.value = y
      scale.value = nextPlace.scale
      opacity.value = nextPlace.opacity
      veil.value = nextVeil
      return
    }
    translateY.value = withTiming(y, Motion)
    scale.value = withTiming(nextPlace.scale, Motion)
    opacity.value = withTiming(nextPlace.opacity, Motion)
    veil.value = withTiming(nextVeil, Motion)
  }, [animated, opacity, role, scale, translateY, veil, y])

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
  const zIndex = role === 'current' || role === 'complete' ? 3 : role === 'done' ? 2 : 1

  const shownSeconds = role === 'current' ? remainingSeconds : seconds
  const roundLine = roundIndex == null
    ? 'Settle in before the first hold.'
    : `Round ${roundIndex} of ${roundCount}`
  const detail = role === 'complete'
    ? note ?? ''
    : aside
      ? `${roundLine} · ${aside}`
      : roundLine
  const title = role === 'complete'
    ? 'Table complete'
    : role === 'done'
      ? PhaseLabel[kind]
      : PhaseLabel[kind]
  const color = role === 'done'
    ? Colors.TextMuted
    : role === 'complete'
      ? Colors.Seafoam
      : PhaseColor[kind]
  const sprite = trainingSpriteFrame(role === 'complete' ? 'meditate' : kind)
  const cover = Math.max(card.width, card.height)

  return (
    <SExit
      exiting={animated ? FadeOutUp.duration(380) : undefined}
      style={{ zIndex }}
      pointerEvents={role === 'current' || role === 'complete' ? 'auto' : 'none'}
    >
      <SCard style={[animatedStyle, { width: card.width, borderRadius: Radii.Card }]}>
        <SClip style={{ height: card.height, borderRadius: Radii.Card }}>
          <SSpriteFrame>
            <SSpriteWindow style={{ width: cover, height: cover }}>
              <SSprite source={sprite.source} style={sprite.style} />
            </SSpriteWindow>
          </SSpriteFrame>
          <STitle style={{ color }}>{role === 'done' ? 'Completed' : title}</STitle>
          {role === 'done' ? (
            <SDoneLabel style={{ color: PhaseColor[kind] }}>{PhaseLabel[kind]}</SDoneLabel>
          ) : (
            <STime
              style={{
                color: role === 'complete' ? Colors.Text : color,
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
          {role === 'done' && aside ? <SDetail>{aside}</SDetail> : null}
          <SVeil style={[veilStyle, { borderRadius: Radii.Card }]} />
        </SClip>
      </SCard>
    </SExit>
  )
}

const SExit = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: ${TrainingStepLayout.inset}px;
  right: ${TrainingStepLayout.inset}px;
`

const SCard = styled(Animated.View)`
  align-self: center;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Seafoam};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.18;
  shadow-radius: 18px;
  elevation: 4;
`

const SClip = styled.View`
  justify-content: center;
  padding: 22px 20px 18px;
  overflow: hidden;
  background-color: ${Colors.Card};
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

const SSpriteWindow = styled.View`
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const SSprite = styled.Image`
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
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Timer};
  font-weight: 700;
  letter-spacing: -1.4px;
  text-align: center;
`

const SDoneTime = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  text-align: center;
  color: ${Colors.TextMuted};
`

const SDetail = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  text-align: center;
  color: ${Colors.TextMuted};
`

const SVeil = styled(Animated.View)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${Colors.Overlay};
`
