import { Colors, FontSizes } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { TableRound } from '@/utils/table'
import { styled } from 'styled-components/native'


type Props = {
  round: TableRound
  inCard?: boolean
  last?: boolean
}

export default function TableRoundRow({ round, inCard = false, last = false }: Props) {
  const { formatSeconds } = useFormatterContext()

  return (
    <Wrapper $inCard={inCard} $last={last}>
      <SIndex>Round {round.index}</SIndex>
      <SDetail>
        <SHold>Hold</SHold>
        {` ${formatSeconds(round.holdSeconds)}`}
      </SDetail>
      <SDetail>
        <SRest>Rest</SRest>
        {` ${formatSeconds(round.restSeconds)}`}
      </SDetail>
    </Wrapper>
  )
}

const Wrapper = styled.View<{ $inCard: boolean; $last: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14px ${(props) => props.$inCard ? 16 : 20}px;
  border-bottom-width: ${(props) => props.$last ? 0 : 1}px;
  border-bottom-color: ${Colors.GreyDivider};
`

const SIndex = styled.Text`
  width: 84px;
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.DeepPrimary};
`

const SDetail = styled.Text`
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SHold = styled.Text`
  font-weight: 700;
  color: ${Colors.TealPrimary};
`

const SRest = styled.Text`
  font-weight: 700;
  color: ${Colors.BluePrimary};
`
