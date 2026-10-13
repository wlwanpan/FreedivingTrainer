import AnalyticsOverview from '@/components/AnalyticsOverview'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import HeartRateChart from '@/components/HeartRateChart'
import HoldHistoryChart from '@/components/HoldHistoryChart'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType, TableTypeLabel, TableTypes } from '@/constants/tables'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, FontSizes } from '@/design/styles'
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
  margin: 22px 20px 8px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`

const SEmpty = styled.Text`
  margin: 0 20px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.GreyPrimary};
`

const SCard = styled.View`
  margin: 0 20px;
  border-radius: 16px;
  border-width: 1px;
  border-color: ${Colors.GreyDivider};
  background-color: ${Colors.White};
  overflow: hidden;
`

const SRow = styled.View<{ $last: boolean }>`
  padding: 14px 16px;
  border-bottom-width: ${(props) => props.$last ? 0 : 1}px;
  border-bottom-color: ${Colors.GreyDivider};
`

const SName = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.DeepPrimary};
`

const SMeta = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`
