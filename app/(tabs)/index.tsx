import AnalyticsOverview from '@/components/AnalyticsOverview'
import Button from '@/components/Button'
import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import PlanProgress from '@/components/PlanProgress'
import ScreenHeader from '@/components/ScreenHeader'
import SessionListItem from '@/components/SessionListItem'
import WearableStatus from '@/components/WearableStatus'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, FontSizes, Layout } from '@/design/styles'
import useTrainingOutline, { nextTrainingSession } from '@/hooks/useTrainingOutline'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { baselineFollowsPlan, sessionRounds, WeekSession } from '@/utils/training_plan'
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

  const nextSession = nextTrainingSession(outline)
  const planStartedAt = settings.trainingPlanStartedAt
  const offerBaseline = outline != null
    && outline.progress === 1
    && nextSession == null
    && planStartedAt != null
    && !baselineFollowsPlan(settings.baselineTestedAt, sessions, planStartedAt)
  const openingSession = outline?.schedule.find((entry) => entry.week === 1)?.sessions[0] ?? null
  const sessionTitle = nextSession != null
    && nextSession.week === 1
    && nextSession.index === openingSession?.index
    && !nextSession.completed
    ? 'Start session'
    : 'Next session'

  const start = (session: WeekSession & { week: number }) => {
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
        week: String(session.week),
        session: String(session.index),
      },
    })
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title='Home' />
      <WearableStatus />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <AnalyticsOverview onPress={() => router.push('/analytics')} />
        {outline == null ? (
          <SPlan>
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
          </SPlan>
        ) : (
          <PlanProgress
            outline={outline}
            onPress={() => router.push('/training')}
            onRetest={() => router.push('/baseline')}
          >
            {offerBaseline ? (
              <SNext onPress={() => router.push('/baseline')}>
                <SNextBody>
                  <SNextTitle>Retake baseline</SNextTitle>
                  <SNextMeta>A new maximum hold readjusts the tables.</SNextMeta>
                </SNextBody>
                <SStart>Start</SStart>
              </SNext>
            ) : nextSession == null ? (
              <SDoneRow>
                <SNextBody>
                  <SNextTitle>Week complete</SNextTitle>
                  <SNextMeta>{finishedSummary(outline, formatSeconds)}</SNextMeta>
                </SNextBody>
                <SDone>Done</SDone>
              </SDoneRow>
            ) : (
              <SNext onPress={() => start(nextSession)}>
                <SNextBody>
                  <SNextTitle>{sessionTitle}</SNextTitle>
                  <SNextMeta>{sessionSummary(nextSession, formatSeconds)}</SNextMeta>
                </SNextBody>
                <SStart>Start</SStart>
              </SNext>
            )}
          </PlanProgress>
        )}
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

function finishedSummary(
  outline: NonNullable<ReturnType<typeof useTrainingOutline>>,
  formatSeconds: (seconds: number) => string,
): string {
  const current = outline.schedule.find((entry) => entry.current)
  const finished = current?.sessions.filter((session) => session.completed) ?? []
  if (finished.length === 1) return sessionSummary(finished[0], formatSeconds)
  return 'Every session this week is done.'
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
  margin: 8px 20px 0;
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
  margin-bottom: 8px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SNext = styled.Pressable`
  flex-direction: row;
  align-items: center;
  margin: 12px -16px -16px;
  padding: 12px 16px;
  min-height: ${Layout.MinControl}px;
  border-top-width: 1px;
  border-top-color: ${Colors.GreyDivider};
`

const SNextBody = styled.View`
  flex: 1;
  padding-right: 12px;
`

const SNextTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SNextMeta = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.TealPrimary};
`

const SStart = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 800;
  color: ${Colors.TealPrimary};
`

const SDoneRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 12px -16px -16px;
  padding: 12px 16px;
  min-height: ${Layout.MinControl}px;
  border-top-width: 1px;
  border-top-color: ${Colors.GreyDivider};
`

const SDone = styled.Text`
  font-size: ${FontSizes.XSmall};
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.TealPrimary};
`

const SSection = styled.Text`
  margin: 22px 20px 4px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`
