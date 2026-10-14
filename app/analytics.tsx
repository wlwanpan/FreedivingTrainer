import AnalyticsOverview from '@/components/AnalyticsOverview'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import HeartRateChart from '@/components/HeartRateChart'
import HoldHistoryChart from '@/components/HoldHistoryChart'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType, TableTypeLabel, TableTypes } from '@/constants/tables'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { Session } from '@/db/schema'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function AnalyticsScreen() {
  const router = useRouter()
  const { sessions } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const paddingBottom = useBottomControlInset(false)
  const totals = sessionTotals(sessions)

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn headerText='Analytics' leftText='Back' leftOnClick={() => router.back()} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <AnalyticsOverview />
        <HoldHistoryChart />
        <HeartRateChart />
        <SSection>Sessions</SSection>
        {totals.length === 0 ? (
          <SEmpty>Finish a table to see it here.</SEmpty>
        ) : (
          <SCard>
            {totals.map((row, index) => (
              <SRow key={row.type} $last={index === totals.length - 1}>
                <SName>{TableTypeLabel[row.type]}</SName>
                <SMeta>
                  {`${row.count} ${row.count === 1 ? 'session' : 'sessions'} · ${formatSeconds(row.apnea)}`}
                </SMeta>
              </SRow>
            ))}
          </SCard>
        )}
      </SScroll>
    </WrapperScreen>
  )
}

function sessionTotals(sessions: Session[]): { type: TableType; count: number; apnea: number }[] {
  const byType = new Map<TableType, { count: number; apnea: number }>()
  for (const session of sessions) {
    const current = byType.get(session.tableType) ?? { count: 0, apnea: 0 }
    current.count += 1
    current.apnea += session.holdSeconds * session.roundsCompleted
    byType.set(session.tableType, current)
  }
  return TableTypes.flatMap((type) => {
    const total = byType.get(type)
    return total == null ? [] : [{ type, ...total }]
  })
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SSection = styled.Text`
  margin: 22px ${Space.screen}px 8px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SEmpty = styled.Text`
  margin: 0 ${Space.screen}px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`

const SCard = styled.View`
  margin: 0 ${Space.screen}px;
  border-radius: ${Radii.Card}px;
  border-width: 1px;
  border-color: ${Colors.Hairline};
  background-color: ${Colors.Card};
  overflow: hidden;
`

const SRow = styled.View<{ $last: boolean }>`
  padding: 14px 16px;
  border-bottom-width: ${(props) => props.$last ? 0 : 1}px;
  border-bottom-color: ${Colors.Hairline};
`

const SName = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SMeta = styled.Text`
  margin-top: 2px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  color: ${Colors.TextMuted};
`
