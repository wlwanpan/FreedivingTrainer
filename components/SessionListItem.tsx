import { TableTypeLabel } from '@/constants/tables'
import { Colors, FontSizes } from '@/design/styles'
import { Session } from '@/db/schema'
import { useFormatterContext } from '@/providers/formatter'
import { styled } from 'styled-components/native'


type Props = {
  session: Session
  onDelete: () => void
}

export default function SessionListItem({ session, onDelete }: Props) {
  const { formatDay, formatSeconds } = useFormatterContext()

  return (
    <Wrapper>
      <SBody>
        <STitle>{TableTypeLabel[session.tableType]} · {formatDay(session.day)}</STitle>
        <SMeta>
          {session.roundsCompleted} rounds · hold {formatSeconds(session.holdSeconds)} · rest {formatSeconds(session.restSeconds)}
        </SMeta>
      </SBody>
      <SDelete onPress={onDelete}>
        <SDeleteText>Delete</SDeleteText>
      </SDelete>
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

const SDelete = styled.Pressable`
  padding: 8px;
`

const SDeleteText = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.CoralPrimary};
`
