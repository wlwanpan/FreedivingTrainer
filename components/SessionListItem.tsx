import { WatchDetailLabel } from '@/constants/sessions'
import { TableTypeLabel } from '@/constants/tables'
import { Colors, FontSizes, Layout } from '@/design/styles'
import { Session } from '@/db/schema'
import { useFormatterContext } from '@/providers/formatter'
import { contractionLabel, parseContractions } from '@/utils/contractions'
import { styled } from 'styled-components/native'


type Props = {
  session: Session
  onDelete?: () => void
}

export default function SessionListItem({ session, onDelete }: Props) {
  const { formatDay, formatSeconds } = useFormatterContext()
  const logged = parseContractions(session.contractions).length
  const watchLabel = session.source === 'watch'
    ? WatchDetailLabel[session.watchDetail ?? 'ios']
    : null

  return (
    <Wrapper>
      <SBody>
        <STitle>{TableTypeLabel[session.tableType]} · {formatDay(session.day)}</STitle>
        <SMeta>
          {session.roundsCompleted} rounds · hold {formatSeconds(session.holdSeconds)} · rest {formatSeconds(session.restSeconds)}
          {logged > 0 ? ` · ${contractionLabel(logged)}` : ''}
        </SMeta>
      </SBody>
      {watchLabel != null ? (
        <SWatchPill>
          <SWatchPillText>{watchLabel}</SWatchPillText>
        </SWatchPill>
      ) : null}
      {onDelete ? (
        <SDelete onPress={onDelete}>
          <SDeleteText>Delete</SDeleteText>
        </SDelete>
      ) : null}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 14px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.GreyDivider};
`

const SBody = styled.View`
  flex: 1;
`

const STitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.DeepPrimary};
`

const SMeta = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SWatchPill = styled.View`
  flex-shrink: 0;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background-color: ${Colors.TealBackground};
`

const SWatchPillText = styled.Text`
  font-size: ${FontSizes.XSmall};
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.TealPrimary};
`

const SDelete = styled.Pressable`
  flex-shrink: 0;
  min-height: ${Layout.MinControl}px;
  justify-content: center;
  padding: 8px;
`

const SDeleteText = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.CoralPrimary};
`
