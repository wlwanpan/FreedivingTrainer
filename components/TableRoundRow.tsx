import { Colors, FontSizes } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { TableRound } from '@/utils/table'
import { styled } from 'styled-components/native'


type Props = {
  round: TableRound
}

export default function TableRoundRow({ round }: Props) {
  const { formatSeconds } = useFormatterContext()

  return (
    <Wrapper>
      <SIndex>Round {round.index}</SIndex>
      <SDetail>Hold {formatSeconds(round.holdSeconds)}</SDetail>
      <SDetail>Rest {formatSeconds(round.restSeconds)}</SDetail>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom-width: 1px;
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
