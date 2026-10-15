import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import TrainingBackdrop from '@/components/TrainingBackdrop'
import TrainingGestureInfo from '@/components/TrainingGestureInfo'
import TrainingGestureTutorial from '@/components/TrainingGestureTutorial'
import TrainingKeepAwake from '@/components/TrainingKeepAwake'
import TrainingStep, { trainingCardSize, trainingStepY } from '@/components/TrainingStep'
import TrainingTelemetry from '@/components/TrainingTelemetry'
import { useBottomControlInset } from '@/design/chrome'
import { Footer } from '@/design/styled'
import { Colors, FontSizes, Layout } from '@/design/styles'
import { TrainStep } from '@/hooks/useTrainingClock'
import { registerTrainingResume } from '@/hooks/trainingPause'
import { Translate } from '@/i18n/types'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import { contractionLabel, contractionsInRound, ContractionTap, LoggedContraction, sessionResultNote } from '@/utils/contractions'
import { playTrainingHaptic } from '@/utils/training_haptic'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { styled } from 'styled-components/native'


type Props = {
  title: string
  previous: TrainStep | null
  current: TrainStep | null
  next: TrainStep | null
  remainingSeconds: number
  elapsedTotalSeconds: number
  totalSeconds: number
  stepCount: number
  roundCount: number
  heartRateBpm: number | null
  paused: boolean
  done: boolean
  saving: boolean
  saved: boolean
  saveFailed: boolean
  contractions: LoggedContraction[]
  onCancel: () => void
  onClose: () => void
  onRetry: () => void
  onTogglePause: () => void
  onRememberTap: () => void
  onLogContraction: () => ContractionTap
}

export default function TrainingClock({
  title,
  previous,
  current,
  next,
  remainingSeconds,
  elapsedTotalSeconds,
  totalSeconds,
  stepCount,
  roundCount,
  heartRateBpm,
  paused,
  done,
  saving,
  saved,
  saveFailed,
  contractions,
  onCancel,
  onClose,
  onRetry,
  onTogglePause,
  onRememberTap,
  onLogContraction,
}: Props) {
  const { t } = useI18n()
  const { settings, updatedAt } = useSQLContext()
  const updateSetting = useUpdateSetting()
  const { showConfirmation } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const router = useRouter()
  const animated = settings.trainingAnimation
  const showIntro = updatedAt != null && !settings.trainingGesturesSeen
  const { width } = useWindowDimensions()
  const cardSize = trainingCardSize(width)
  const bottomInset = useBottomControlInset(false)
  const [chainHeight, setChainHeight] = useState(0)
  const [tutorialOpen, setTutorialOpen] = useState(showIntro)
  const [infoOpen, setInfoOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ id: number; text: string } | null>(null)
  const feedbackId = useRef(0)
  const introOpened = useRef(false)
  const introMarked = useRef(false)
  const resumeOnClose = useRef(false)
  const infoHeld = useRef(false)
  const pausedRef = useRef(paused)
  const doneRef = useRef(done)
  const onTogglePauseRef = useRef(onTogglePause)
  const onContractionRef = useRef<() => void>(() => {})
  const onRememberRef = useRef(onRememberTap)
  const onPauseRef = useRef<() => void>(() => {})
  onRememberRef.current = onRememberTap
  pausedRef.current = paused
  doneRef.current = done
  onTogglePauseRef.current = onTogglePause

  const showFeedback = (text: string) => {
    feedbackId.current += 1
    setFeedback({ id: feedbackId.current, text })
  }

  onPauseRef.current = () => {
    if (doneRef.current) return
    playTrainingHaptic(settings.trainingHaptic, 'tap')
    if (pausedRef.current) {
      onTogglePauseRef.current()
      return
    }
    onTogglePauseRef.current()
    router.push('/pause')
  }
  onContractionRef.current = () => {
    const result = onLogContraction()
    if (result.kind === 'logged') {
      showFeedback(t('training.contractionLogged', { time: formatSeconds(result.offsetSeconds) }))
      return
    }
    if (result.kind === 'hold-only') showFeedback(t('gestures.holdOnly'))
  }

  const gesturesActive = !done && !tutorialOpen && !infoOpen
  const taps = useMemo(() => {
    const single = Gesture.Tap()
      .numberOfTaps(1)
      .maxDistance(48)
      .runOnJS(true)
      .enabled(gesturesActive)
      .onTouchesDown(() => {
        onRememberRef.current()
      })
      .onEnd((_event, success) => {
        if (success) onContractionRef.current()
      })
    const double = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(400)
      .maxDistance(48)
      .runOnJS(true)
      .enabled(gesturesActive)
      .onEnd((_event, success) => {
        if (success) onPauseRef.current()
      })
    return Gesture.Exclusive(double, single)
  }, [gesturesActive])

  useEffect(() => {
    registerTrainingResume(() => {
      if (doneRef.current || !pausedRef.current) return
      onTogglePauseRef.current()
    })
    return () => registerTrainingResume(null)
  }, [])

  useEffect(() => {
    if (introOpened.current || !showIntro || doneRef.current) return
    introOpened.current = true
    if (!pausedRef.current) onTogglePauseRef.current()
    resumeOnClose.current = true
    setTutorialOpen(true)
  }, [showIntro])

  useEffect(() => {
    if (feedback == null) return
    const id = setTimeout(() => {
      setFeedback((currentFeedback) => (currentFeedback?.id === feedback.id ? null : currentFeedback))
    }, 1200)
    return () => clearTimeout(id)
  }, [feedback])

  const dismissTutorial = () => {
    setTutorialOpen(false)
    if (resumeOnClose.current) {
      resumeOnClose.current = false
      onTogglePause()
    }
    if (introMarked.current || settings.id === 0 || settings.trainingGesturesSeen) return
    introMarked.current = true
    void updateSetting({ trainingGesturesSeen: true })
  }

  const closeInfo = () => {
    setInfoOpen(false)
    if (!infoHeld.current) return
    infoHeld.current = false
    onTogglePause()
  }

  const toggleInfo = () => {
    if (infoOpen) {
      closeInfo()
      return
    }
    if (!done && !paused) {
      infoHeld.current = true
      onTogglePause()
    }
    setInfoOpen(true)
  }

  const requestCancel = async () => {
    if (previous == null) {
      onCancel()
      return
    }
    const resume = !paused
    if (resume) onTogglePause()
    const leave = await showConfirmation(
      t('training.leaveTitle'),
      t('training.leaveBody'),
      { confirmTitle: t('training.leaveConfirm') },
    )
    if (leave) {
      onCancel()
      return
    }
    if (resume) onTogglePause()
  }

  const replayTutorial = () => {
    if (done) return
    const resume = !paused || infoHeld.current
    infoHeld.current = false
    setInfoOpen(false)
    resumeOnClose.current = resume
    if (!paused) onTogglePause()
    setTutorialOpen(true)
  }

  const onChainLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    setChainHeight((currentHeight) => (currentHeight === height ? currentHeight : height))
  }
  const note = sessionResultNote(contractions.length, saveFailed, t)
  const previousAside = asideFor(previous, contractions, t)
  const currentAside = asideFor(current, contractions, t)

  return (
    <Wrapper>
      {done ? null : <TrainingKeepAwake />}
      <HeaderWithBtn
        headerText={done ? t('training.complete') : title}
        leftText={done ? undefined : t('training.cancel')}
        leftOnClick={done ? undefined : () => { void requestCancel() }}
        right={done || tutorialOpen ? undefined : (
          <SInfo
            onPress={toggleInfo}
            accessibilityRole='button'
            accessibilityLabel={t('training.gesturesA11y')}
          >
            {({ pressed }) => (
              <Ionicons
                name='information-circle-outline'
                size={28}
                color={pressed ? Colors.TextMuted : Colors.Text}
              />
            )}
          </SInfo>
        )}
      />
      <TrainingTelemetry
        elapsedTotalSeconds={elapsedTotalSeconds}
        totalSeconds={totalSeconds}
        roundIndex={current?.roundIndex ?? previous?.roundIndex ?? 0}
        roundCount={roundCount}
        heartRateBpm={heartRateBpm}
        contractions={contractions}
      />
      <SStage>
        <GestureDetector gesture={taps}>
          <SChain
            collapsable={false}
            onLayout={onChainLayout}
            accessibilityLabel={t('training.timerA11y')}
          >
            {animated ? <TrainingBackdrop paused={paused || tutorialOpen} /> : null}
            {chainHeight > 0 && previous ? (
              <TrainingStep
                key={previous.index}
                role='done'
                y={trainingStepY('done', chainHeight, cardSize)}
                kind={previous.kind}
                seconds={previous.seconds}
                roundIndex={previous.roundIndex}
                roundCount={roundCount}
                stepIndex={previous.index}
                stepCount={stepCount}
                aside={previousAside}
                animated={animated}
              />
            ) : chainHeight > 0 && current ? (
              <TrainingStep
                key='placeholder'
                role='placeholder'
                y={trainingStepY('placeholder', chainHeight, cardSize)}
                animated={animated}
              />
            ) : null}
            {chainHeight > 0 && current ? (
              <TrainingStep
                key={current.index}
                role='current'
                y={trainingStepY('current', chainHeight, cardSize)}
                kind={current.kind}
                seconds={current.seconds}
                remainingSeconds={remainingSeconds}
                roundIndex={current.roundIndex}
                roundCount={roundCount}
                stepIndex={current.index}
                stepCount={stepCount}
                aside={currentAside}
                animated={animated}
              />
            ) : null}
            {chainHeight > 0 && done ? (
              <TrainingStep
                key='complete'
                role='complete'
                y={trainingStepY('complete', chainHeight, cardSize)}
                note={note}
                animated={animated}
              />
            ) : null}
            {chainHeight > 0 && next ? (
              <TrainingStep
                key={next.index}
                role='next'
                y={trainingStepY('next', chainHeight, cardSize)}
                kind={next.kind}
                seconds={next.seconds}
                roundIndex={next.roundIndex}
                roundCount={roundCount}
                stepIndex={next.index}
                stepCount={stepCount}
                animated={animated}
              />
            ) : null}
          </SChain>
        </GestureDetector>
        {!done && !tutorialOpen ? (
          <SNotices pointerEvents='none' style={{ bottom: bottomInset }}>
            {feedback ? <SPill><SPillText>{feedback.text}</SPillText></SPill> : null}
          </SNotices>
        ) : null}
      </SStage>
      {done ? (
        <Footer>
          <Button
            title={saveFailed ? t('common.tryAgain') : t('common.done')}
            loading={saving}
            disabled={!saved && !saveFailed}
            onPress={saved ? onClose : onRetry}
          />
        </Footer>
      ) : null}
      {tutorialOpen ? <TrainingGestureTutorial onDismiss={dismissTutorial} /> : null}
      {infoOpen ? (
        <TrainingGestureInfo
          onClose={closeInfo}
          onReplay={replayTutorial}
        />
      ) : null}
    </Wrapper>
  )
}

function asideFor(
  step: TrainStep | null,
  contractions: LoggedContraction[],
  t: Translate,
): string | undefined {
  const count = contractionsInRound(contractions, step?.roundIndex ?? null, step?.kind ?? null)
  return count > 0 ? contractionLabel(count, t) : undefined
}

const Wrapper = styled.View`
  flex: 1;
  position: relative;
`

const SStage = styled.View`
  flex: 1;
  position: relative;
`

const SChain = styled.View`
  flex: 1;
  position: relative;
  overflow: hidden;
`

const SInfo = styled.Pressable`
  flex-shrink: 0;
  min-width: ${Layout.MinControl}px;
  min-height: ${Layout.MinControl}px;
  align-items: center;
  justify-content: center;
`

const SNotices = styled.View`
  position: absolute;
  left: 24px;
  right: 24px;
  align-items: center;
  gap: 8px;
`

const SPill = styled.View`
  padding: 8px 14px;
  border-radius: 999px;
  background-color: ${Colors.Chrome};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SPillText = styled.Text`
  color: ${Colors.Text};
  font-size: ${FontSizes.Small};
  font-weight: 700;
  text-align: center;
`

