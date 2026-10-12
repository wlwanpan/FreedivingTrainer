import AnalyticsOverview from '@/components/AnalyticsOverview'
import Button from '@/components/Button'
import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import ScreenHeader from '@/components/ScreenHeader'
import SessionListItem from '@/components/SessionListItem'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, FontSizes } from '@/design/styles'
import useTrainingOutline from '@/hooks/useTrainingOutline'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { sessionRounds, WeekSession } from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function HomeScreen() {
  const router = useRouter()
  const { settings, sessions } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const outline = useTrainingOutline()
  const paddingBottom = useBottomControlInset(true)
  const logged = [...sessions].sort((a, b) => {
    const byTime = a.createdAt.getTime() - b.createdAt.getTime()
    if (byTime !== 0) return byTime
    return a.id - b.id
  })

  const currentWeek = outline?.schedule.find((entry) => entry.current) ?? null
  const incomplete = currentWeek?.sessions.find((session) => !session.completed) ?? null
  const nextWeek = outline?.schedule.find((entry) => outline != null && entry.week > outline.week && !entry.locked) ?? null
  const nextSession = incomplete ?? nextWeek?.sessions[0] ?? currentWeek?.sessions[0] ?? null
  const continuing = (currentWeek?.sessions.some((session) => session.completed) ?? false) || incomplete == null

  const start = (session: WeekSession) => {
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    if (sessionRounds(session).length === 0) {
      showWarning(ErrorTitles.Input, 'Add at least one round before training.')
      return
    }
    router.push({
      pathname: '/train',
      params: {
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
      <ScreenHeader title='Home' />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <AnalyticsOverview />
        <SPlan>
          {outline == null || nextSession == null ? (
            <>
              <SPlanName>No plan yet</SPlanName>
              <SMeta>
                {settings.baselineMaxHoldSeconds == null
                  ? 'A baseline test sizes the plan you choose.'
                  : 'Choose a plan, or build your own.'}
              </SMeta>
              <Button
                title={settings.baselineMaxHoldSeconds == null ? 'Take baseline test' : 'Choose a plan'}
                onPress={() => router.push(settings.baselineMaxHoldSeconds == null ? '/baseline' : '/plan')}
              />
            </>
          ) : (
            <>
              <SPlanName>{outline.planName}</SPlanName>
              <SMeta>{outline.level}</SMeta>
              <SWeek>{`Week ${outline.week} of ${outline.weeks}`}</SWeek>
              <SMeta>{sessionSummary(nextSession, formatSeconds)}</SMeta>
              <Button
                title={continuing ? 'Continue' : 'Start'}
                onPress={() => start(nextSession)}
              />
            </>
          )}
        </SPlan>
        <SSection>Latest sessions</SSection>
        {logged.length === 0 ? (
          <EmptyListPlaceholder message='Finish a table to see it here.' />
        ) : (
          logged.map((session) => (
            <SessionListItem key={session.id} session={session} />
          ))
        )}
      </SScroll>
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
  return `${session.name} · ${hold} · ${session.rounds} rounds`
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SPlan = styled.View`
  margin: 12px 20px 0;
  padding: 16px 16px 8px;
  border-radius: 16px;
  background-color: ${Colors.TealBackground};
`

const SPlanName = styled.Text`
  font-size: ${FontSizes.Large};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SMeta = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SWeek = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SSection = styled.Text`
  margin: 22px 20px 4px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`
