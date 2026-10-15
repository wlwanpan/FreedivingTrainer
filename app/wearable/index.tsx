import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SessionListItem from '@/components/SessionListItem'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import useWearableStatus, { lastSyncLabel, wearableLabel, wearableLive } from '@/hooks/useWearableStatus'
import { useSQLContext } from '@/providers/sql'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function WearableScreen() {
  const router = useRouter()
  const { sessions } = useSQLContext()
  const wearable = useWearableStatus()
  const live = wearableLive(wearable)
  const watchSessions = [...sessions]
    .filter((session) => session.source === 'watch')
    .sort((a, b) => {
      const byTime = b.createdAt.getTime() - a.createdAt.getTime()
      if (byTime !== 0) return byTime
      return b.id - a.id
    })

  return (
    <WrapperScreen scrollable sheet>
      <HeaderWithBtn
        headerText='Wearables'
        leftText='Close'
        leftOnClick={() => router.back()}
        right={(
          <SAdd
            onPress={() => router.push('/wearable/add')}
            accessibilityRole='button'
            accessibilityLabel='Add and connect more devices'
          >
            {({ pressed }) => (
              <Ionicons
                name='add'
                size={22}
                color={pressed ? Colors.TextMuted : Colors.Seafoam}
              />
            )}
          </SAdd>
        )}
      />
      <SCard>
        <SCardTitle>Status</SCardTitle>
        <SStatusRow>
          <SDot $live={live} />
          <SStatus $live={live}>{wearableLabel(wearable)}</SStatus>
        </SStatusRow>
        <SFact>
          <SFactLabel>Last sync</SFactLabel>
          <SFactValue>{lastSyncLabel(wearable)}</SFactValue>
        </SFact>
        {wearable.syncLabel === 'Syncing…' && wearable.syncedAt != null ? (
          <SNote>Syncing with your watch…</SNote>
        ) : null}
      </SCard>
      <SSection>Sessions from watch</SSection>
      {watchSessions.length === 0 ? (
        <EmptyListPlaceholder message='Finish a table on your watch to see it here.' />
      ) : (
        watchSessions.map((session) => (
          <SessionListItem key={session.id} session={session} />
        ))
      )}
    </WrapperScreen>
  )
}

const SAdd = styled.Pressable`
  flex-shrink: 0;
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  border-radius: ${Layout.MinControl / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.HairlineStrong};
`

const SCard = styled.View`
  margin: 8px ${Space.screen}px 12px;
  padding: 16px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SCardTitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SStatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`

const SDot = styled.View<{ $live: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => props.$live ? Colors.Seafoam : Colors.TextDisabled};
`

const SStatus = styled.Text<{ $live: boolean }>`
  flex: 1;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${(props) => props.$live ? Colors.Seafoam : Colors.TextMuted};
`

const SFact = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${Space.sm}px;
  margin-top: 12px;
  padding-top: 12px;
  border-top-width: 1px;
  border-top-color: ${Colors.Hairline};
`

const SFactLabel = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SFactValue = styled.Text`
  flex-shrink: 1;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.Small};
  font-weight: 500;
  font-variant: tabular-nums;
  color: ${Colors.Text};
`

const SNote = styled.Text`
  margin-top: 8px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  color: ${Colors.TextMuted};
`

const SSection = styled.Text`
  margin: 10px ${Space.screen}px 8px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`
