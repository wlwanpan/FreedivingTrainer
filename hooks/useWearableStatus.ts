import { useSQLContext } from '@/providers/sql'


export type WearableKind = 'apple-watch' | 'garmin' | 'heart-rate'

export type WearableStatus = {
  kind: WearableKind | null
  connected: boolean
  heartRateActive: boolean
}

function wearableKind(value: string | null | undefined): WearableKind | null {
  if (value === 'apple-watch' || value === 'garmin') return value
  return null
}

export default function useWearableStatus(): WearableStatus {
  const { settings } = useSQLContext()
  const kind = wearableKind(settings.wearable)
  return {
    kind,
    connected: false,
    heartRateActive: false,
  }
}

export function wearableLabel(status: WearableStatus): string {
  if (status.heartRateActive) return 'Heart Rate Sensor: Active'
  if (status.kind === 'apple-watch') {
    return status.connected ? 'Apple Watch: Connected' : 'Apple Watch: Not connected'
  }
  if (status.kind === 'garmin') {
    return status.connected ? 'Garmin: Connected' : 'Garmin: Not connected'
  }
  return 'Apple Watch: Not connected'
}

export function wearableLive(status: WearableStatus): boolean {
  return status.heartRateActive || (status.connected && status.kind != null)
}
