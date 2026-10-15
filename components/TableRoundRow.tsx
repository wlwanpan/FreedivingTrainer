import { Colors, Fonts, FontSizes } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { TableRound } from '@/utils/table'
import { styled } from 'styled-components/native'


type Props = {
  round: TableRound
  inCard?: boolean
  last?: boolean
}

export default function TableRoundRow({ round, inCard = false, last = false }: Props) {
  const { t } = useI18n()
  const { formatSeconds } = useFormatterContext()

  return (
    <Wrapper $inCard={inCard} $last={last}>
      <SIndex>{t('tableRound.round', { n: round.index })}</SIndex>
      <SDetail>
        <SHold>{t('common.hold')}</SHold>
        {` ${formatSeconds(round.holdSeconds)}`}
      </SDetail>
      <SDetail>
        <SRest>{t('common.rest')}</SRest>
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
  border-bottom-color: ${Colors.Hairline};
`

const SIndex = styled.Text`
  width: 84px;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SDetail = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  font-variant: tabular-nums;
  color: ${Colors.TextMuted};
`

const SHold = styled.Text`
  font-weight: 700;
  color: ${Colors.Seafoam};
`

const SRest = styled.Text`
  font-weight: 700;
  color: ${Colors.Aquamarine};
`
