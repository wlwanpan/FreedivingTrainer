import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SessionListItem from '@/components/SessionListItem'
import TrainingCalendar from '@/components/TrainingCalendar'
import WrapperScreen from '@/components/WrapperScreen'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Space } from '@/design/styles'
import { useSQLContext } from '@/providers/sql'
import { groupSessionsByPlanWeek, trainedDays } from '@/utils/session_log'
import { trainingPlanFromSettings } from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function SessionsScreen() {
  const router = useRouter()
  const { sessions, settings } = useSQLContext()
  const paddingBottom = useBottomControlInset(false)
  const plan = trainingPlanFromSettings(settings)
  const days = trainedDays(sessions)
  const groups = groupSessionsByPlanWeek(
    sessions,
    plan?.name ?? null,
    settings.trainingPlanStartedAt,
  )

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn headerText='Sessions' leftText='Back' leftOnClick={() => router.back()} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <TrainingCalendar trainedDays={days} />
        {groups.length === 0 ? (
          <EmptyListPlaceholder message='Finish a table to see it here.' />
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

const SScroll = styled.ScrollView`
  flex: 1;
`

const SGroup = styled.View`
  margin-top: ${Space.sm}px;
`

const SSection = styled.Text`
  margin: ${Space.md}px ${Space.screen}px 8px;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Text};
`
