import HeaderWithBtn from '@/components/HeaderWithBtn'
import WearableDeviceRow from '@/components/WearableDeviceRow'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import useWearableStatus from '@/hooks/useWearableStatus'
import { Translate } from '@/i18n/types'
import { useI18n } from '@/providers/i18n'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function AddWearableScreen() {
  const { t } = useI18n()
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
        headerText={t('wearable.addDevice')}
        leftBack
        leftOnClick={() => router.back()}
      />
      <SSection>{t('wearable.supported')}</SSection>
      <SCard>
        <WearableDeviceRow
          title={t('settings.appleWatch')}
          subtitle={appleWatchSubtitle(wearable.connected, wearable.paired, t)}
          icon='watch'
          selected={wearable.kind === 'apple-watch'}
          loading={saving}
          onPress={() => { void selectAppleWatch() }}
        />
        <WearableDeviceRow
          title={t('sessions.garmin')}
          subtitle={t('wearable.garminComing')}
          icon='watch-outline'
          comingSoon
          last
        />
      </SCard>
    </WrapperScreen>
  )
}

function appleWatchSubtitle(connected: boolean, paired: boolean, t: Translate): string {
  if (connected) return t('wearable.appleConnectedDetail')
  if (paired) return t('wearable.applePaired')
  return t('wearable.appleInstall')
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