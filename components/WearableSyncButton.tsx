import GlassIconButton from '@/components/GlassIconButton'
import { Colors } from '@/design/styles'
import useWearableStatus, { requestWearableSync } from '@/hooks/useWearableStatus'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'


export default function WearableSyncButton() {
  const { t } = useI18n()
  const status = useWearableStatus()
  const [busy, setBusy] = useState(false)
  const syncing = busy || status.syncLabel === t('wearable.syncing')

  useEffect(() => {
    if (!busy) return
    const limit = setTimeout(() => setBusy(false), 8000)
    return () => clearTimeout(limit)
  }, [busy])

  useEffect(() => {
    if (!busy || status.syncLabel === t('wearable.syncing')) return
    const settle = setTimeout(() => setBusy(false), 600)
    return () => clearTimeout(settle)
  }, [busy, status.syncLabel, t])

  return (
    <GlassIconButton
      accessibilityLabel={t('wearable.syncA11y')}
      disabled={syncing}
      onPress={() => {
        setBusy(true)
        requestWearableSync()
      }}
    >
      {syncing ? (
        <ActivityIndicator size='small' color={Colors.Seafoam} />
      ) : (
        <Ionicons name='sync-outline' size={18} color={Colors.Seafoam} />
      )}
    </GlassIconButton>
  )
}
