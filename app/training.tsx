import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import PlanProgress from '@/components/PlanProgress'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { useBottomControlInset } from '@/design/chrome'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import useTrainingOutline from '@/hooks/useTrainingOutline'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import { trainParamsFromSession } from '@/utils/train_route'
import { sessionRounds, WeekSession } from '@/utils/training_plan'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function TrainingScreen() {
  const router = useRouter()
  const { settings } = useSQLContext()
  const { showWarning } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const outline = useTrainingOutline()
  const paddingBottom = useBottomControlInset(false)

  const open = (session: WeekSession, week: number, locked: boolean) => {
    if (locked) return
    if (sessionRounds(session).length === 0) {
      showWarning(ErrorTitles.Input, 'Add at least one round before training.')
      return
    }
    router.push({
      pathname: '/prepare',
      params: trainParamsFromSession(session, week),
    })
  }

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn headerText='Training' leftText='Back' leftOnClick={() => router.back()} />
      {outline == null ? (
        <>
          <SEmpty>
            <SEmptyTitle>No plan yet</SEmptyTitle>
            <SEmptyCopy>
              {settings.baselineMaxHoldSeconds == null
                ? 'A baseline test sizes the plan you choose.'
                : 'Choose a plan, or build your own. Keep CO2 and O2 on different days.'}
            </SEmptyCopy>
          </SEmpty>
          <Footer>
            <Button
              title={settings.baselineMaxHoldSeconds == null ? 'Take baseline test' : 'Choose a plan'}
              onPress={() => router.push(settings.baselineMaxHoldSeconds == null ? '/baseline' : '/plan')}
            />
          </Footer>
        </>
      ) : (
        <SScroll
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          <PlanProgress
            outline={outline}
            onRetest={() => router.push('/baseline')}
          />
          {outline.schedule.map((entry) => (
            <SWeek key={entry.week} $current={entry.current}>
              <SWeekHeader>
                <SWeekTitle>{`Week ${entry.week}`}</SWeekTitle>
                {entry.sessions.length > 0 && entry.sessions.every((session) => session.completed) ? (
                  <SBadge>Complete</SBadge>
                ) : entry.current ? <SBadge>This week</SBadge> : null}
                {entry.locked ? <SLockedBadge>Locked</SLockedBadge> : null}
              </SWeekHeader>
              {entry.locked ? (
                <SLockNote>{`Finish week ${outline.week} to start these.`}</SLockNote>
              ) : null}
              {entry.sessions.map((session) => (
                <STraining
                  key={`${entry.week}-${session.kind}-${session.index}`}
                  disabled={entry.locked}
                  $locked={entry.locked}
                  onPress={() => open(session, entry.week, entry.locked)}
                >
                  <STrainingBody>
                    <SNameRow>
                      <STrainingName $locked={entry.locked}>{session.name}</STrainingName>
                      {session.completed ? <SDone>Done</SDone> : null}
                    </SNameRow>
                    <STrainingMeta $locked={entry.locked}>{sessionSummary(session, formatSeconds)}</STrainingMeta>
                    <STrainingNote>{session.note}</STrainingNote>
                  </STrainingBody>
                  <STrail>
                    {entry.locked ? (
                      <SLockedText>Locked</SLockedText>
                    ) : (
                      <Ionicons name='chevron-forward' size={18} color={Colors.Seafoam} />
                    )}
                  </STrail>
                </STraining>
              ))}
            </SWeek>
          ))}
        </SScroll>
      )}
    </WrapperScreen>
  )
}

function sessionSummary(
  session: WeekSession,
  formatSeconds: (seconds: number) => string,
): string {
  const hold = session.tableType === 'o2'
    ? `Holds from ${formatSeconds(session.holdSeconds)}`
    : `Hold ${formatSeconds(session.holdSeconds)}`
  return `${hold} · ${session.rounds} rounds`
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SWeek = styled.View<{ $current: boolean }>`
  margin: 12px ${Space.screen}px 0;
  border-radius: ${Radii.Card}px;
  border-width: 1px;
  border-color: ${(props) => props.$current ? Colors.Seafoam : Colors.Hairline};
  background-color: ${Colors.Card};
  overflow: hidden;
`

const SWeekHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 4px;
`

const SWeekTitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SBadge = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
`

const SLockedBadge = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SLockNote = styled.Text`
  padding: 0 16px 8px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const STraining = styled.Pressable<{ $locked: boolean }>`
  flex-direction: row;
  align-items: center;
  min-height: ${Layout.MinControl}px;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: ${Colors.Hairline};
  opacity: ${(props) => props.$locked ? 0.55 : 1};
`

const STrainingBody = styled.View`
  flex: 1;
  padding-right: 12px;
`

const SNameRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`

const STrainingName = styled.Text<{ $locked: boolean }>`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${(props) => props.$locked ? Colors.TextMuted : Colors.Text};
`

const SDone = styled.Text`
  font-size: ${FontSizes.XSmall};
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
`

const STrainingMeta = styled.Text<{ $locked: boolean }>`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${(props) => props.$locked ? Colors.TextMuted : Colors.Seafoam};
`

const STrainingNote = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const STrail = styled.View`
  min-width: ${Layout.MinControl}px;
  min-height: ${Layout.MinControl}px;
  align-items: flex-end;
  justify-content: center;
`

const SLockedText = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 800;
  color: ${Colors.TextMuted};
`

const SEmpty = styled.View`
  flex: 1;
  justify-content: center;
  padding: 24px;
`

const SEmptyTitle = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XLarge};
  font-weight: 700;
  color: ${Colors.Text};
`

const SEmptyCopy = styled.Text`
  margin-top: 8px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`
