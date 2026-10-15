import HeaderWithBtn from '@/components/HeaderWithBtn'
import WearableDeviceRow from '@/components/WearableDeviceRow'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import useWearableStatus from '@/hooks/useWearableStatus'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function AddWearableScreen() {
  const router = useRouter()
  const wearable = useWearableStatus()
  const updateSetting = useUpdateSetting()
  const [saving, setSaving] = useState(false)

  const selectAppleWatch = async () => {
    if (saving) return
    setSaving(true)
    await updateSetting({ wearable: 'apple-watch' })
    setSaving(false)
    router.back()
  }

  return (
    <WrapperScreen scrollable sheet>
      <HeaderWithBtn
        headerText='Add device'
        leftText='Back'
        leftOnClick={() => router.back()}
      />
      <SSection>Supported watches</SSection>
      <SCard>
        <WearableDeviceRow
          title='Apple Watch'
          subtitle={appleWatchSubtitle(wearable.connected, wearable.paired)}
          icon='watch'
          selected={wearable.kind === 'apple-watch'}
          loading={saving}
          onPress={() => { void selectAppleWatch() }}
        />
        <WearableDeviceRow
          title='Garmin'
          subtitle='Garmin watches will connect here.'
          icon='watch-outline'
          comingSoon
          last
        />
      </SCard>
      <SNote>
        Finish a table on a connected watch to see it on Wearables.
      </SNote>
    </WrapperScreen>
  )
}

function appleWatchSubtitle(connected: boolean, paired: boolean): string {
  if (connected) return 'Connected. Syncs tables and heart rate.'
  if (paired) return 'Watch app installed. Open it to connect.'
  return 'Install the watch app, then connect from here.'
}

const SSection = styled.Text`
  margin: 10px ${Space.screen}px 8px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SCard = styled.View`
  margin: 0 ${Space.screen}px 12px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  overflow: hidden;
`

const SNote = styled.Text`
  margin: 0 ${Space.screen}px 16px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`
