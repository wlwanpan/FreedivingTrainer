import AnalyticsOverview from '@/components/AnalyticsOverview'
import Button from '@/components/Button'
import DashboardSafety from '@/components/DashboardSafety'
import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import PlanProgress from '@/components/PlanProgress'
import ScreenHeader from '@/components/ScreenHeader'
import SessionListItem from '@/components/SessionListItem'
import WatchHeaderButton from '@/components/WatchHeaderButton'
import WrapperScreen from '@/components/WrapperScreen'
import { useBottomControlInset } from '@/design/chrome'
import { holdLabel, sessionDisplayName } from '@/i18n/labels'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import useTrainingOutline, { nextTrainingSession } from '@/hooks/useTrainingOutline'
import useWearableStatus, { watchBlocksPhoneStart, wearableLabel } from '@/hooks/useWearableStatus'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { practiceFromValue } from '@/utils/practice'
import { trainParamsFromSession } from '@/utils/train_route'
import { baselineFollowsPlan, sessionRounds, WeekSession } from '@/utils/training_plan'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


const LatestCount = 3

export default function HomeScreen() {
  const router = useRouter()
  const { settings, sessions } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const { t } = useI18n()
  const outline = useTrainingOutline()
  const wearable = useWearableStatus()
  const watchBusy = watchBlocksPhoneStart(wearable)
  const paddingBottom = useBottomControlInset(true)
  const latest = [...sessions]
    .sort((a, b) => {
      const byTime = b.createdAt.getTime() - a.createdAt.getTime()
      if (byTime !== 0) return byTime
      return b.id - a.id
    })
    .slice(0, LatestCount)

  const nextSession = nextTrainingSession(outline)
  const planStartedAt = settings.trainingPlanStartedAt
  const offerBaseline = outline != null
    && outline.progress === 1
    && nextSession == null
    && planStartedAt != null
    && !baselineFollowsPlan(settings.baselineTestedAt, sessions, planStartedAt)

  const start = (session: WeekSession & { week: number }) => {
    if (watchBusy) return
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    if (!session.openHold && sessionRounds(session).length === 0) {
      showWarning(t('errors.input'), t('home.addRound'))
      return
    }
    const mermaid = practiceFromValue(settings.practice) === 'mermaid'
    router.push({
      pathname: mermaid ? '/prepare' : '/train',
      params: trainParamsFromSession(session, session.week),
    })
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader
        title={t('home.title')}
        right={(
          <WatchHeaderButton
            connected={wearable.connected}
            accessibilityLabel={wearableLabel(wearable, t)}
            onPress={() => router.push('/wearable')}
          />
        )}
      />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <AnalyticsOverview onPress={() => router.push('/analytics')} />
        {outline == null ? (
          <SPlan>
            <SPlanName>{t('home.noPlan')}</SPlanName>
            <SMeta>
              {settings.baselineMaxHoldSeconds == null
                ? t('home.noPlanNeedBaseline')
                : t('home.noPlanChoose')}
            </SMeta>
            <Button
              title={settings.baselineMaxHoldSeconds == null ? t('settings.takeBaseline') : t('baseline.choosePlan')}
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
              <SDrill>
                <SDrillHead>
                  <SDrillIcon>
                    <Ionicons name='reload' size={18} color={Colors.Seafoam} />
                  </SDrillIcon>
                  <SDrillCopy>
                    <SDrillKicker>{t('home.upcomingDrill')}</SDrillKicker>
                    <SDrillName>{t('home.retakeBaseline')}</SDrillName>
                  </SDrillCopy>
                </SDrillHead>
                <SDrillMeta>{t('home.retakeMeta')}</SDrillMeta>
                <Button title={t('home.startSession')} onPress={() => router.push('/baseline')} style={{ marginBottom: 0 }} />
              </SDrill>
            ) : nextSession == null ? (
              <SDrill>
                <SDrillHead>
                  <SDrillIcon>
                    <Ionicons name='checkmark' size={18} color={Colors.Seafoam} />
                  </SDrillIcon>
                  <SDrillCopy>
                    <SDrillKicker>{t('home.thisWeek')}</SDrillKicker>
                    <SDrillName>{t('home.weekComplete')}</SDrillName>
                  </SDrillCopy>
                </SDrillHead>
                <SDrillMeta>{finishedSummary(outline, formatSeconds, t)}</SDrillMeta>
              </SDrill>
            ) : (
              <SDrill>
                <SDrillHead>
                  <SDrillIcon>
                    <Ionicons name='alarm-outline' size={18} color={Colors.Seafoam} />
                  </SDrillIcon>
                  <SDrillCopy>
                    <SDrillKicker>{t('home.upcomingDrill')}</SDrillKicker>
                    <SDrillName>{nextSession.name}</SDrillName>
                  </SDrillCopy>
                </SDrillHead>
                <SChips>
                  {nextSession.openHold ? (
                    <SChip>{t('home.openWalk')}</SChip>
                  ) : (
                    <>
                      <SChip>{holdChip(nextSession, formatSeconds, t)}</SChip>
                      <SChip>{t('home.restChip', { time: formatSeconds(nextSession.restStartSeconds) })}</SChip>
                      <SRounds>{t('home.roundsTotal', { count: nextSession.rounds })}</SRounds>
                    </>
                  )}
                </SChips>
                <Button
                  title={watchBusy ? t('home.onWatch') : t('home.startSession')}
                  disabled={watchBusy}
                  onPress={() => start(nextSession)}
                  style={{ marginBottom: 0 }}
                />
              </SDrill>
            )}
          </PlanProgress>
        )}
        <SSectionRow>
          <SSection>{t('home.latestSessions')}</SSection>
          {sessions.length > 0 ? (
            <SSeeAll onPress={() => router.push('/sessions')}>
              <SSeeAllText>{t('home.seeAll')}</SSeeAllText>
              <Ionicons name='chevron-forward' size={15} color={Colors.Seafoam} />
            </SSeeAll>
          ) : null}
        </SSectionRow>
        {latest.length === 0 ? (
          <EmptyListPlaceholder message={t('home.empty')} card />
        ) : (
          latest.map((session) => (
            <SessionListItem key={session.id} session={session} />
          ))
        )}
        <DashboardSafety />
      </SScroll>
    </WrapperScreen>
  )
}

function finishedSummary(
  outline: NonNullable<ReturnType<typeof useTrainingOutline>>,
  formatSeconds: (seconds: number) => string,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const current = outline.schedule.find((entry) => entry.current)
  const finished = current?.sessions.filter((session) => session.completed) ?? []
  if (finished.length === 1) return sessionSummary(finished[0], formatSeconds, t)
  return t('home.weekDone')
}

function sessionSummary(
  session: WeekSession,
  formatSeconds: (seconds: number) => string,
  t: ReturnType<typeof useI18n>['t'],
): string {
  if (session.openHold) {
    return t('home.sessionSummaryOpen', { name: sessionDisplayName(session.name, t) })
  }
  return t('home.sessionSummary', {
    name: sessionDisplayName(session.name, t),
    hold: holdLabel(session.tableType, formatSeconds(session.holdSeconds), t),
    count: session.rounds,
  })
}

function holdChip(
  session: WeekSession,
  formatSeconds: (seconds: number) => string,
  t: ReturnType<typeof useI18n>['t'],
): string {
  return holdLabel(session.tableType, formatSeconds(session.holdSeconds), t)
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SPlan = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 20px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-opacity: 0.06;
  shadow-radius: 12px;
  shadow-offset: 0px 8px;
  elevation: 2;
`

const SPlanName = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Large};
  font-weight: 700;
  color: ${Colors.Text};
`

const SMeta = styled.Text`
  margin-top: 4px;
  margin-bottom: ${Space.sm}px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SDrill = styled.View`
  margin-top: ${Space.md}px;
  padding: ${Space.md}px;
  border-radius: 12px;
  background-color: ${Colors.Telemetry};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SDrillHead = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`

const SDrillIcon = styled.View`
  width: 32px;
  height: 32px;
  border-radius: ${Radii.Control}px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SDrillCopy = styled.View`
  flex: 1;
`

const SDrillKicker = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 700;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SDrillName = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SDrillMeta = styled.Text`
  margin-top: 8px;
  margin-bottom: 4px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SChips = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${Space.sm}px;
  margin-top: 12px;
  margin-bottom: 12px;
`

const SChip = styled.Text`
  padding: 4px 10px;
  border-radius: ${Radii.Control}px;
  overflow: hidden;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  font-variant: tabular-nums;
  color: ${Colors.Text};
  background-color: ${Colors.Canvas};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SRounds = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  color: ${Colors.Seafoam};
`

const SSectionRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: 22px ${Space.screen}px 8px;
  min-height: ${Layout.MinControl}px;
`

const SSection = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SSeeAll = styled.Pressable`
  flex-direction: row;
  align-items: center;
  min-height: ${Layout.MinControl}px;
`

const SSeeAllText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  color: ${Colors.Seafoam};
`
