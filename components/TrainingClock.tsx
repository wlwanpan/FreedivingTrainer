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
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import { contractionLabel, contractionsInRound, ContractionTap, LoggedContraction, sessionResultNote } from '@/utils/contractions'
import { playTrainingHaptic } from '@/utils/training_haptic'
import { TrainingGestureCopy } from '@/utils/training_gestures'
import Ionicons from '@expo/vector-icons/Ionicons'
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
  const { settings, updatedAt } = useSQLContext()
  const updateSetting = useUpdateSetting()
  const { showConfirmation } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
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
    onTogglePauseRef.current()
  }
  onContractionRef.current = () => {
    const result = onLogContraction()
    if (result.kind === 'logged') {
      showFeedback(`Contraction · ${formatSeconds(result.offsetSeconds)}`)
      return
    }
    if (result.kind === 'hold-only') showFeedback(TrainingGestureCopy.holdOnly)
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
      'Leave training?',
      'Current progress will be lost.',
      { confirmTitle: 'Go Back' },
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
  const note = sessionResultNote(contractions.length, saveFailed)
  const previousAside = asideFor(previous, contractions)
  const currentAside = asideFor(current, contractions)

  return (
    <Wrapper>
      {done ? null : <TrainingKeepAwake />}
      <HeaderWithBtn
        headerText={done ? 'Complete' : title}
        leftText={done ? undefined : 'Cancel'}
        leftOnClick={done ? undefined : () => { void requestCancel() }}
        right={done || tutorialOpen ? undefined : (
          <SInfo
            onPress={toggleInfo}
            accessibilityRole='button'
            accessibilityLabel='Training gestures'
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
            accessibilityLabel='Training timer. Tap once during a hold to log a contraction. Double tap to pause or resume.'
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
                aside={previousAside}
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
                animated={animated}
              />
            ) : null}
          </SChain>
        </GestureDetector>
        {!done && !tutorialOpen ? (
          <SNotices pointerEvents='none' style={{ bottom: bottomInset }}>
            {feedback ? <SPill><SPillText>{feedback.text}</SPillText></SPill> : null}
            {paused ? (
              <SPauseCard>
                <SPauseTitle>{TrainingGestureCopy.paused}</SPauseTitle>
                <SPauseHint>{TrainingGestureCopy.resume}</SPauseHint>
              </SPauseCard>
            ) : null}
          </SNotices>
        ) : null}
        {tutorialOpen ? <TrainingGestureTutorial onDismiss={dismissTutorial} /> : null}
        {infoOpen ? (
          <TrainingGestureInfo
            onClose={closeInfo}
            onReplay={replayTutorial}
          />
        ) : null}
      </SStage>
      {done ? (
        <Footer>
          <Button
            title={saveFailed ? 'Try again' : 'Done'}
            loading={saving}
            disabled={!saved && !saveFailed}
            onPress={saved ? onClose : onRetry}
          />
        </Footer>
      ) : null}
    </Wrapper>
  )
}

function asideFor(step: TrainStep | null, contractions: LoggedContraction[]): string | undefined {
  const count = contractionsInRound(contractions, step?.roundIndex ?? null, step?.kind ?? null)
  return count > 0 ? contractionLabel(count) : undefined
}

const Wrapper = styled.View`
  flex: 1;
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

const SPauseCard = styled.View`
  padding: 10px 16px;
  border-radius: 14px;
  background-color: ${Colors.Chrome};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SPauseTitle = styled.Text`
  color: ${Colors.Text};
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  text-align: center;
`

const SPauseHint = styled.Text`
  margin-top: 2px;
  color: ${Colors.Aquamarine};
  font-size: ${FontSizes.Small};
  text-align: center;
`
