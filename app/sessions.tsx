import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SessionListItem from '@/components/SessionListItem'
import TrainingCalendar from '@/components/TrainingCalendar'
import WrapperScreen from '@/components/WrapperScreen'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Layout, Space } from '@/design/styles'
import { Session } from '@/db/schema'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { planCopy } from '@/i18n/labels'
import { groupSessionsByPlanWeek, trainedDays } from '@/utils/session_log'
import { trainingPlanFromSettings } from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function SessionsScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { sessions, settings } = useSQLContext()
  const { formatDay } = useFormatterContext()
  const paddingBottom = useBottomControlInset(false)
  const plan = trainingPlanFromSettings(settings)
  const days = trainedDays(sessions)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const groups = groupSessionsByPlanWeek(
    sessions,
    plan == null ? null : planCopy(plan.id, 'name', t),
    settings.trainingPlanStartedAt,
    t,
  )
  const daySessions = selectedDay == null ? [] : sessionsOnDay(sessions, selectedDay)

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn headerText={t('log.title')} leftBack leftOnClick={() => router.back()} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <TrainingCalendar
          trainedDays={days}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay((current) => current === day ? null : day)}
        />
        {selectedDay != null ? (
          <SGroup>
            <SSectionRow>
              <SHeading>{formatDay(selectedDay)}</SHeading>
              <SShowAll
                onPress={() => setSelectedDay(null)}
                accessibilityRole='button'
                accessibilityLabel={t('log.showAllA11y')}
              >
                <SShowAllText>{t('log.showAll')}</SShowAllText>
              </SShowAll>
            </SSectionRow>
            {daySessions.length === 0 ? (
              <EmptyListPlaceholder message={t('log.emptyDay')} />
            ) : (
              daySessions.map((session) => (
                <SessionListItem key={session.id} session={session} />
              ))
            )}
          </SGroup>
        ) : groups.length === 0 ? (
          <EmptyListPlaceholder message={t('log.empty')} />
        ) : (
          groups.map((group) => (
            <SGroup key={group.key}>
              <SSection>{group.title}</SSection>
              {group.sessions.map((session) => (
                <SessionListItem key={session.id} session={session} />
              ))}
            </SGroup>
          ))
        )}
      </SScroll>
    </WrapperScreen>
  )
}

function sessionsOnDay(sessions: readonly Session[], day: string): Session[] {
  return [...sessions]
    .filter((session) => session.day === day)
    .sort((a, b) => {
      const byTime = b.createdAt.getTime() - a.createdAt.getTime()
      if (byTime !== 0) return byTime
      return b.id - a.id
    })
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SGroup = styled.View`
  margin-top: ${Space.sm}px;
`

const SSectionRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: ${Space.md}px ${Space.screen}px 8px;
  min-height: ${Layout.MinControl}px;
`

const SHeading = styled.Text`
  flex-shrink: 1;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Text};
`

const SSection = styled(SHeading)`
  margin: ${Space.md}px ${Space.screen}px 8px;
`

const SShowAll = styled.Pressable`
  min-height: ${Layout.MinControl}px;
  justify-content: center;
`

const SShowAllText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  color: ${Colors.Seafoam};
`
