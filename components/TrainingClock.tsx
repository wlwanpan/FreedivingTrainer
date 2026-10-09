import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import TrainingBackdrop from '@/components/TrainingBackdrop'
import TrainingStep, { trainingStepY } from '@/components/TrainingStep'
import { Footer } from '@/design/styled'
import { Colors } from '@/design/styles'
import { TrainStep } from '@/hooks/useTrainingClock'
import { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  title: string
  previous: TrainStep | null
  current: TrainStep | null
  next: TrainStep | null
  remainingSeconds: number
  roundCount: number
  paused: boolean
  done: boolean
  saving: boolean
  saved: boolean
  saveFailed: boolean
  onCancel: () => void
  onClose: () => void
  onRetry: () => void
  onTogglePause: () => void
}

export default function TrainingClock({
  title,
  previous,
  current,
  next,
  remainingSeconds,
  roundCount,
  paused,
  done,
  saving,
  saved,
  saveFailed,
  onCancel,
  onClose,
  onRetry,
  onTogglePause,
}: Props) {
  const [chainHeight, setChainHeight] = useState(0)
  const note = saveFailed
    ? 'The session did not save.'
    : 'This session is saved on this device.'
  const onChainLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    setChainHeight((current) => (current === height ? current : height))
  }

  return (
    <Wrapper>
      <HeaderWithBtn
        headerText={done ? 'Complete' : title}
        leftText={done ? undefined : 'Cancel'}
        leftOnClick={done ? undefined : onCancel}
      />
      <SChain onLayout={onChainLayout}>
        <TrainingBackdrop
          kind={done ? null : current?.kind ?? null}
          paused={paused}
        />
        {chainHeight > 0 && previous ? (
          <TrainingStep
            key={previous.index}
            role='done'
            y={trainingStepY('done', chainHeight)}
            kind={previous.kind}
            seconds={previous.seconds}
            roundIndex={previous.roundIndex}
            roundCount={roundCount}
          />
        ) : null}
        {chainHeight > 0 && current ? (
          <TrainingStep
            key={current.index}
            role='current'
            y={trainingStepY('current', chainHeight)}
            kind={current.kind}
            seconds={current.seconds}
            remainingSeconds={remainingSeconds}
            roundIndex={current.roundIndex}
            roundCount={roundCount}
          />
        ) : null}
        {chainHeight > 0 && done ? (
          <TrainingStep
            key='complete'
            role='complete'
            y={trainingStepY('complete', chainHeight)}
            note={note}
          />
        ) : null}
        {chainHeight > 0 && next ? (
          <TrainingStep
            key={next.index}
            role='next'
            y={trainingStepY('next', chainHeight)}
            kind={next.kind}
            seconds={next.seconds}
            roundIndex={next.roundIndex}
            roundCount={roundCount}
          />
        ) : null}
      </SChain>
      <Footer>
        {done ? (
          <Button
            title={saveFailed ? 'Try again' : 'Done'}
            loading={saving}
            disabled={!saved && !saveFailed}
            onPress={saved ? onClose : onRetry}
          />
        ) : (
          <Button
            title={paused ? 'Resume' : 'Pause'}
            onPress={onTogglePause}
            defaultBGColor={paused ? Colors.TealPrimary : Colors.GreyPrimary}
            pressedBGColor={paused ? Colors.TealFaded : Colors.GreyFaded}
          />
        )}
      </Footer>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
`

const SChain = styled.View`
  flex: 1;
  position: relative;
  overflow: hidden;
`
