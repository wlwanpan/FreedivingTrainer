import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { TrainPhaseKind } from '@/hooks/useTrainingClock'
import { roundOrdinal } from '@/i18n/labels'
import { Translate } from '@/i18n/types'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { trainingSpriteFrame } from '@/utils/training_sprite'
import Ionicons from '@expo/vector-icons/Ionicons'
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


export type TrainingStepRole = 'done' | 'current' | 'next' | 'complete' | 'placeholder'

const PhaseTitleKey: Record<TrainPhaseKind, string> = {
  breathe: 'training.breatheUp',
  hold: 'training.holdPhase',
  rest: 'training.restVentilate',
}

const PhaseShortKey: Record<TrainPhaseKind, string> = {
  breathe: 'training.breatheUp',
  hold: 'training.holdPhase',
  rest: 'training.rest',
}

const PhaseStageKey: Record<TrainPhaseKind, string> = {
  breathe: 'training.preparation',
  hold: 'training.holdPhaseName',
  rest: 'training.recoveryPhase',
}

const PhaseColor: Record<TrainPhaseKind, string> = {
  breathe: Colors.Aquamarine,
  hold: Colors.Seafoam,
  rest: Colors.Aquamarine,
}

const PhaseCueKey: Record<TrainPhaseKind, string> = {
  breathe: 'training.cueBreathe',
  hold: 'training.cueHold',
  rest: 'training.cueRest',
}

export const TrainingStepLayout = {
  inset: Space.screen,
  gap: 20,
  edge: Space.md,
  rail: 72,
  current: 312,
} as const

const RoleOpacity: Record<TrainingStepRole, number> = {
  done: 0.64,
  current: 1,
  next: 1,
  complete: 1,
  placeholder: 1,
}

export type TrainingCardSize = {
  width: number
  current: number
  rail: number
}

export function trainingCardSize(windowWidth: number): TrainingCardSize {
  const width = Math.max(0, windowWidth - TrainingStepLayout.inset * 2)
  return {
    width,
    current: TrainingStepLayout.current,
    rail: TrainingStepLayout.rail,
  }
}

export function trainingCardHeight(role: TrainingStepRole, card: TrainingCardSize): number {
  return role === 'current' || role === 'complete' ? card.current : card.rail
}

export function trainingStepY(role: TrainingStepRole, chainHeight: number, card: TrainingCardSize): number {
  const minCurrent = TrainingStepLayout.edge + card.rail + TrainingStepLayout.gap
  const current = Math.max(minCurrent, (chainHeight - card.current) / 2)
  if (role === 'done' || role === 'placeholder') {
    return current - TrainingStepLayout.gap - card.rail
  }
  if (role === 'next') {
    return current + card.current + TrainingStepLayout.gap
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
  stepIndex?: number
  stepCount?: number
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
  stepIndex,
  stepCount,
  note,
  aside,
  animated = true,
}: Props) {
  const { t, language } = useI18n()
  const { formatSeconds } = useFormatterContext()
  const { width } = useWindowDimensions()
  const card = trainingCardSize(width)
  const nextHeight = trainingCardHeight(role, card)
  const nextOpacity = RoleOpacity[role]
  const translateY = useSharedValue(y)
  const height = useSharedValue(nextHeight)
  const opacity = useSharedValue(nextOpacity)

  useEffect(() => {
    if (!animated) {
      translateY.value = y
      height.value = nextHeight
      opacity.value = nextOpacity
      return
    }
    translateY.value = withTiming(y, Motion)
    height.value = withTiming(nextHeight, Motion)
    opacity.value = withTiming(nextOpacity, Motion)
  }, [animated, height, nextHeight, nextOpacity, opacity, translateY, y])

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))
  const zIndex = role === 'current' || role === 'complete' ? 3 : role === 'done' ? 2 : 1
  const shownSeconds = role === 'current' ? remainingSeconds : seconds
  const color = role === 'complete' ? Colors.Seafoam : PhaseColor[kind]
  const sprite = trainingSpriteFrame(role === 'complete' ? 'meditate' : kind)
  const cover = Math.max(card.width, card.current)
  const rail = role === 'done' || role === 'next'

  return (
    <SExit
      exiting={animated ? FadeOutUp.duration(380) : undefined}
      style={{ zIndex }}
      pointerEvents={role === 'current' || role === 'complete' ? 'auto' : 'none'}
    >
      {role === 'placeholder' ? (
        <SGhost
          style={[animatedStyle, { width: card.width, borderRadius: Radii.Card }]}
          accessibilityLabel={t('training.noCompletedRounds')}
        >
          <SGhostText>{t('training.noCompletedRounds')}</SGhostText>
        </SGhost>
      ) : (
      <SCard style={[animatedStyle, { width: card.width, borderRadius: Radii.Card }]}>
        <SClip style={{ borderRadius: Radii.Card }}>
          {rail ? null : (
            <SSpriteFrame>
              <SSpriteWindow style={{ width: cover, height: cover }}>
                <SSprite source={sprite.source} style={sprite.style} />
              </SSpriteWindow>
            </SSpriteFrame>
          )}
          {role === 'done' ? (
            <SRail>
              <SIconWell>
                <Ionicons name='checkmark' size={16} color={Colors.Seafoam} />
              </SIconWell>
              <SRailCopy>
                <SRailTitleRow>
                  <SRailKicker>{t('training.phaseCompleted', { phase: t(PhaseShortKey[kind]) })}</SRailKicker>
                  {roundIndex == null ? null : (
                    <SRailRound>{t('training.ordinalRound', { ordinal: roundOrdinal(roundIndex, language, t) })}</SRailRound>
                  )}
                </SRailTitleRow>
                <SRailMeta numberOfLines={1}>
                  {aside
                    ? t('training.durationLogged', { time: formatSeconds(seconds), aside })
                    : t('training.duration', { time: formatSeconds(seconds) })}
                </SRailMeta>
              </SRailCopy>
              <SRailStatus>{t('common.done')}</SRailStatus>
            </SRail>
          ) : role === 'next' ? (
            <SRail>
              <SIconWell>
                <Ionicons name='time-outline' size={16} color={Colors.TextMuted} />
              </SIconWell>
              <SRailCopy>
                <SRailTitleRow>
                  <SRailLead>{t('training.next', { phase: t(PhaseShortKey[kind]) })}</SRailLead>
                  {roundIndex == null ? null : (
                    <SRailRound>{t('training.roundN', { n: roundIndex })}</SRailRound>
                  )}
                </SRailTitleRow>
                <SRailMeta numberOfLines={1}>
                  {t('training.upcoming', { time: formatSeconds(seconds), phase: t(PhaseShortKey[kind]) })}
                </SRailMeta>
              </SRailCopy>
              <SRailTime style={{ fontVariant: ['tabular-nums'] }}>
                {formatSeconds(seconds)}
              </SRailTime>
            </SRail>
          ) : (
            <SHero>
              <SHeroHeader>
                <SBadge>
                  <SBadgeText>
                    {role === 'complete' ? t('training.tableComplete') : t(PhaseTitleKey[kind])}
                  </SBadgeText>
                </SBadge>
                {role !== 'complete' && stepIndex != null && stepCount != null ? (
                  <SStage>{t('training.stage', { current: stepIndex + 1, total: stepCount })}</SStage>
                ) : null}
              </SHeroHeader>
              <STimerBlock>
                <STime
                  style={{
                    color: role === 'complete' ? Colors.Text : color,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {role === 'complete' ? t('common.done') : formatSeconds(shownSeconds)}
                </STime>
                <SPhaseLine>
                  {role === 'complete' ? t('training.sessionSaved') : heroSubtitle(kind, roundIndex, roundCount, t)}
                </SPhaseLine>
              </STimerBlock>
              <SNote>
                <SNoteIcon>
                  <Ionicons
                    name={role === 'complete' ? 'checkmark-circle-outline' : 'happy-outline'}
                    size={16}
                    color={color}
                  />
                </SNoteIcon>
                <SNoteText>
                  {role === 'complete' ? note ?? '' : t(PhaseCueKey[kind])}
                </SNoteText>
              </SNote>
            </SHero>
          )}
        </SClip>
      </SCard>
      )}
    </SExit>
  )
}

function heroSubtitle(
  kind: TrainPhaseKind,
  roundIndex: number | null,
  roundCount: number,
  t: Translate,
): string {
  if (roundIndex == null) return t('training.settle')
  return t('training.roundPhase', { n: roundIndex, total: roundCount, phase: t(PhaseStageKey[kind]) })
}

const SExit = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: ${TrainingStepLayout.inset}px;
  right: ${TrainingStepLayout.inset}px;
`

const SCard = styled(Animated.View)`
  align-self: center;
  overflow: hidden;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-offset: 0px 8px;
  shadow-opacity: 0.06;
  shadow-radius: 24px;
  elevation: 2;
`

const SGhost = styled(Animated.View)`
  align-self: center;
  align-items: center;
  justify-content: center;
  padding: 0 ${Space.md}px;
  background-color: transparent;
  border-width: 2px;
  border-color: ${Colors.TextDisabled};
  border-style: dotted;
`

const SGhostText = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-align: center;
  color: ${Colors.TextDisabled};
`

const SClip = styled.View`
  flex: 1;
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
  opacity: 0.16;
`

const SHero = styled.View`
  flex: 1;
  padding: ${Space.md}px;
`

const SHeroHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${Space.sm}px;
`

const SBadge = styled.View`
  padding: ${Space.xs}px 10px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.CardAlt};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SBadgeText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SStage = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  color: ${Colors.TextMuted};
`

const STimerBlock = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${Space.lg}px 0;
`

const STime = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Timer};
  font-weight: 700;
  letter-spacing: -1.4px;
  text-align: center;
`

const SPhaseLine = styled.Text`
  margin-top: ${Space.sm}px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  text-align: center;
  color: ${Colors.TextMuted};
`

const SNote = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${Space.sm}px;
  padding: 10px 12px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SNoteIcon = styled.View`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`

const SNoteText = styled.Text`
  flex: 1;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  line-height: 16px;
  color: ${Colors.TextMuted};
`

const SRail = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 0 ${Space.md}px;
`

const SIconWell = styled.View`
  width: 28px;
  height: 28px;
  border-radius: ${Radii.Pill}px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.CardAlt};
`

const SRailCopy = styled.View`
  flex: 1;
  min-width: 0;
  gap: ${Space.xs}px;
`

const SRailTitleRow = styled.View`
  flex-direction: row;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${Space.sm}px;
`

const SRailKicker = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.Text};
`

const SRailLead = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Text};
`

const SRailRound = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  color: ${Colors.TextMuted};
`

const SRailMeta = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  color: ${Colors.TextMuted};
`

const SRailStatus = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  color: ${Colors.TextMuted};
`

const SRailTime = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XLarge};
  font-weight: 700;
  color: ${Colors.Text};
`
