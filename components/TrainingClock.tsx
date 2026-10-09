import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { TrainPhaseKind } from '@/hooks/useTrainingClock'
import { useFormatterContext } from '@/providers/formatter'
import { formatDuration } from '@/utils/duration'
import { styled } from 'styled-components/native'


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

type Props = {
  title: string
  kind: TrainPhaseKind
  remainingSeconds: number
  roundIndex: number | null
  roundCount: number
  nextKind: TrainPhaseKind | null
  nextSeconds: number | null
  done: boolean
  saving: boolean
  saved: boolean
  saveFailed: boolean
  onCancel: () => void
  onClose: () => void
  onRetry: () => void
}

export default function TrainingClock({
  title,
  kind,
  remainingSeconds,
  roundIndex,
  roundCount,
  nextKind,
  nextSeconds,
  done,
  saving,
  saved,
  saveFailed,
  onCancel,
  onClose,
  onRetry,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const detail = roundIndex == null
    ? 'Settle in. The first hold starts when this ends.'
    : `Round ${roundIndex} of ${roundCount}`
  const nextLine = nextKind == null || nextSeconds == null
    ? 'Last interval'
    : `Next ${PhaseLabel[nextKind].toLowerCase()} ${formatSeconds(nextSeconds)}`

  return (
    <Wrapper>
      <HeaderWithBtn
        headerText={done ? 'Complete' : title}
        leftText={done ? undefined : 'Cancel'}
        leftOnClick={done ? undefined : onCancel}
      />
      <SClock>
        <SPhase style={{ color: done ? Colors.TealPrimary : PhaseColor[kind] }}>
          {done ? 'Table complete' : PhaseLabel[kind]}
        </SPhase>
        <STime
          style={{ fontVariant: ['tabular-nums'], color: done ? Colors.DeepPrimary : PhaseColor[kind] }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {done ? formatDuration(0) : formatDuration(remainingSeconds)}
        </STime>
        <SDetail>{done ? 'This session is saved on this device.' : detail}</SDetail>
        {done ? null : <SNext>{nextLine}</SNext>}
      </SClock>
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

const Wrapper = styled.View`
  flex: 1;
`

const SClock = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const SPhase = styled.Text`
  font-size: ${FontSizes.Large};
  font-weight: 800;
`

const STime = styled.Text`
  width: 100%;
  margin-top: 8px;
  font-size: ${FontSizes.Timer};
  font-weight: 700;
  text-align: center;
`

const SDetail = styled.Text`
  margin-top: 16px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  text-align: center;
  color: ${Colors.GreyPrimary};
`

const SNext = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  text-align: center;
  color: ${Colors.GreyPrimary};
`
