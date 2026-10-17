import { TableType } from '@/constants/tables'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import { Session } from '@/db/schema'
import { tableTypeLabel, watchDetailLabel } from '@/i18n/labels'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { contractionLabel, parseContractions } from '@/utils/contractions'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


type Props = {
  session: Session
  onDelete?: () => void
}

const TableDot: Record<TableType, string> = {
  co2: Colors.Seafoam,
  o2: Colors.Aquamarine,
  'one-breath': Colors.Seafoam,
  walk: Colors.Aquamarine,
}

export default function SessionListItem({ session, onDelete }: Props) {
  const { t } = useI18n()
  const { heartRates } = useSQLContext()
  const { formatDay, formatSeconds } = useFormatterContext()
  const logged = parseContractions(session.contractions).length
  const watchLabel = session.source === 'watch'
    ? watchDetailLabel(session.watchDetail ?? 'ios', t)
    : null
  const samples = heartRates.filter((sample) => sample.sessionId === session.id)
  const avgBpm = samples.length === 0
    ? null
    : Math.round(samples.reduce((total, sample) => total + sample.bpm, 0) / samples.length)

  return (
    <Wrapper>
      <STop>
        <STitleRow>
          <SDot style={{ backgroundColor: TableDot[session.tableType] }} />
          <STitle>{tableTypeLabel(session.tableType, t)}</STitle>
        </STitleRow>
        {watchLabel != null ? (
          <SWatchPill>
            <Ionicons name='watch-outline' size={12} color={Colors.Seafoam} />
            <SWatchPillText>{watchLabel}</SWatchPillText>
          </SWatchPill>
        ) : (
          <SWhen>{formatDay(session.day)}</SWhen>
        )}
      </STop>
      <SMetaRow>
        <SMeta>
          {watchLabel != null ? t('sessionItem.dayWatch', { day: formatDay(session.day) }) : ''}
          {t('sessionItem.rounds', { count: session.roundsCompleted })}
        </SMeta>
        <STimes>
          {t('sessionItem.holdRest', {
            hold: formatSeconds(session.holdSeconds),
            rest: formatSeconds(session.restSeconds),
          })}
        </STimes>
      </SMetaRow>
      <SFooter>
        {avgBpm == null ? null : (
          <SFact>
            <Ionicons name='heart' size={13} color={Colors.Seafoam} />
            <SFactText>{t('sessionItem.avgHr', { bpm: avgBpm })}</SFactText>
          </SFact>
        )}
        <SFact>
          <Ionicons
            name={logged > 0 ? 'alert-circle-outline' : 'water-outline'}
            size={13}
            color={logged > 0 ? Colors.TextMuted : Colors.Aquamarine}
          />
          <SFactText>
            {logged > 0 ? contractionLabel(logged, t) : t('sessionItem.zeroContractions')}
          </SFactText>
        </SFact>
        {session.steps == null ? null : (
          <SFact>
            <Ionicons name='walk-outline' size={13} color={Colors.Aquamarine} />
            <SFactText>{t('sessionItem.steps', { count: session.steps })}</SFactText>
          </SFact>
        )}
        {onDelete ? (
          <SDelete onPress={onDelete}>
            <SDeleteText>{t('sessionItem.delete')}</SDeleteText>
          </SDelete>
        ) : null}
      </SFooter>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  margin: 0 ${Space.screen}px 10px;
  padding: ${Space.md}px;
  border-radius: 12px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: 1;
`

const STop = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${Space.sm}px;
`

const STitleRow = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: ${Space.sm}px;
`

const SDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
`

const STitle = styled.Text`
  flex-shrink: 1;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SWhen = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SWatchPill = styled.View`
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SWatchPillText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
`

const SMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${Space.sm}px;
  margin-top: 6px;
`

const SMeta = styled.Text`
  flex: 1;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  color: ${Colors.TextMuted};
`

const STimes = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XXSmall};
  font-weight: 500;
  font-variant: tabular-nums;
  color: ${Colors.Text};
`

const SFooter = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${Space.md}px;
  margin-top: ${Space.sm}px;
  padding-top: ${Space.sm}px;
  border-top-width: 1px;
  border-top-color: ${Colors.Hairline};
`

const SFact = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`

const SFactText = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SDelete = styled.Pressable`
  flex-shrink: 0;
  margin-left: auto;
  min-height: ${Layout.MinControl}px;
  justify-content: center;
`

const SDeleteText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Alert};
`
