import HeaderWithBtn from '@/components/HeaderWithBtn'
import WearableDeviceRow from '@/components/WearableDeviceRow'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import useWearableStatus from '@/hooks/useWearableStatus'
import { Translate } from '@/i18n/types'
import { useI18n } from '@/providers/i18n'
import { useWarningModal } from '@/providers/warning_modal'
import { getStatus, isGarminModuleAvailable, showDeviceSelection } from 'expo-garmin-connect-iq'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function AddWearableScreen() {
  const { t } = useI18n()
  const router = useRouter()
  const wearable = useWearableStatus()
  const updateSetting = useUpdateSetting()
  const { showWarning } = useWarningModal()
  const [saving, setSaving] = useState<'apple-watch' | 'garmin' | null>(null)

  const selectAppleWatch = async () => {
    if (saving) return
    setSaving('apple-watch')
    await updateSetting({ wearable: 'apple-watch' })
    setSaving(null)
    router.back()
  }

  const selectGarmin = async () => {
    if (saving) return
    setSaving('garmin')
    try {
      if (!isGarminModuleAvailable()) {
        showWarning(t('errors.navigation'), t('wearable.garminUnavailable'))
        return
      }
      const status = await getStatus()
      if (status.devices.length === 0) {
        await showDeviceSelection()
        return
      }
      await updateSetting({ wearable: 'garmin' })
      router.back()
    } catch {
      showWarning(t('errors.navigation'), t('wearable.garminPairFailed'))
    } finally {
      setSaving(null)
    }
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
          subtitle={appleWatchSubtitle(wearable.appleConnected, wearable.applePaired, t)}
          icon='watch'
          selected={wearable.kind === 'apple-watch'}
          loading={saving === 'apple-watch'}
          onPress={() => { void selectAppleWatch() }}
        />
        <WearableDeviceRow
          title={t('sessions.garmin')}
          subtitle={garminSubtitle(wearable.garminConnected, wearable.garminPaired, t)}
          icon='watch-outline'
          selected={wearable.kind === 'garmin'}
          loading={saving === 'garmin'}
          badge={t('wearable.beta')}
          last
          onPress={() => { void selectGarmin() }}
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

function garminSubtitle(connected: boolean, paired: boolean, t: Translate): string {
  if (connected) return t('wearable.garminConnectedDetail')
  if (paired) return t('wearable.garminPaired')
  return t('wearable.garminInstall')
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
