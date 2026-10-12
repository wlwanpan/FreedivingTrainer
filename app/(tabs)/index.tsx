import Button from '@/components/Button'
import ScreenHeader from '@/components/ScreenHeader'
import TableRoundRow from '@/components/TableRoundRow'
import TableTypeSwitch from '@/components/TableTypeSwitch'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { TableType, TableTypeDescription } from '@/constants/tables'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import useCurrentPlanWeek from '@/hooks/useCurrentPlanWeek'
import useTablePlan from '@/hooks/useTablePlan'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { sessionRounds } from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function TablesScreen() {
  const router = useRouter()
  const { settings } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const [tableType, setTableType] = useState<TableType>('co2')
  const [pickedTable, setPickedTable] = useState(0)
  const planWeek = useCurrentPlanWeek()
  const storedRounds = useTablePlan(tableType)
  const session = planWeek == null
    ? null
    : planWeek.sessions[Math.min(pickedTable, planWeek.sessions.length - 1)] ?? null
  const rounds = session == null ? storedRounds : sessionRounds(session)

  const startTraining = () => {
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    if (rounds.length === 0) {
      showWarning(ErrorTitles.Input, 'Add at least one round before training.')
      return
    }
    router.push({
      pathname: '/train',
      params: session == null
        ? { type: tableType }
        : {
          type: session.tableType,
          name: session.name,
          hold: String(session.holdSeconds),
          holdStep: String(session.holdStepSeconds),
          restStart: String(session.restStartSeconds),
          restStep: String(session.restStepSeconds),
          rounds: String(session.rounds),
        },
    })
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title='Tables' />
      {planWeek == null ? (
        <>
          <TableTypeSwitch value={tableType} onChange={setTableType} />
          <SHint>{TableTypeDescription[tableType]}</SHint>
        </>
      ) : (
        <>
          <SHint>
            {`${planWeek.planName} · week ${planWeek.week} of ${planWeek.weeks}`}
          </SHint>
          <SHint>{planWeek.frequency}</SHint>
        </>
      )}
      <SHint>Breathe-up {formatSeconds(settings.breatheUpSeconds)}</SHint>
      {settings.baselineMaxHoldSeconds != null ? (
        <SHint>Baseline max {formatSeconds(settings.baselineMaxHoldSeconds)}</SHint>
      ) : null}
      {planWeek?.retestDue ? (
        <SLink onPress={() => router.push('/baseline')}>
          Retake your baseline this week so the intervals can move.
        </SLink>
      ) : null}
      {session != null ? <SHint>{session.note}</SHint> : null}
      {planWeek != null && planWeek.sessions.length > 1 ? (
        <SChoices>
          {planWeek.sessions.map((item, index) => (
            <SSession
              key={`${item.kind}-${index}`}
              $selected={index === Math.min(pickedTable, planWeek.sessions.length - 1)}
              onPress={() => setPickedTable(index)}
            >
              <SSessionLabel $selected={index === Math.min(pickedTable, planWeek.sessions.length - 1)}>
                {item.name}
              </SSessionLabel>
            </SSession>
          ))}
        </SChoices>
      ) : null}
      <SCard>
        <SRounds>
          {rounds.map((round) => (
            <TableRoundRow key={round.index} round={round} />
          ))}
        </SRounds>
      </SCard>
      <Footer aboveTabs>
        <Button
          title='Start Training'
          onPress={startTraining}
        />
      </Footer>
    </WrapperScreen>
  )
}

const SHint = styled.Text`
  margin: 4px 20px 0;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SLink = styled.Text`
  margin: 8px 20px 0;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  line-height: 20px;
  color: ${Colors.TealPrimary};
`

const SChoices = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 20px 0;
`

const SSession = styled.Pressable<{ $selected: boolean }>`
  flex-grow: 1;
  flex-basis: 46%;
  padding: 10px 8px;
  border-radius: 10px;
  align-items: center;
  background-color: ${(props) => props.$selected ? Colors.TealPrimary : Colors.GreyBackground};
`

const SSessionLabel = styled.Text<{ $selected: boolean }>`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${(props) => props.$selected ? Colors.White : Colors.DeepPrimary};
`

const SCard = styled.View`
  flex: 1;
  margin: 12px 20px 0;
  border-radius: 16px;
  background-color: ${Colors.White};
  border-width: 1px;
  border-color: ${Colors.GreyDivider};
  overflow: hidden;
`

const SRounds = styled.ScrollView`
  flex: 1;
`
