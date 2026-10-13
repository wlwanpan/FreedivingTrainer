import { useSQLContext } from '@/providers/sql'
import { useSyncExternalStore } from 'react'


export type WearableKind = 'apple-watch' | 'garmin' | 'heart-rate'

export type WearableStatus = {
  kind: WearableKind | null
  connected: boolean
  heartRateActive: boolean
}

type WearableLive = {
  connected: boolean
  heartRateActive: boolean
}

const idleLive: WearableLive = { connected: false, heartRateActive: false }
let wearableLiveState = idleLive
const wearableLiveListeners = new Set<() => void>()

let watchTraining = false

export function publishWatchTraining(running: boolean) {
  watchTraining = running
}

export function withWatchTrainingLoss(message: string): string {
  if (!watchTraining) return message
  return `${message} The training on your Apple Watch will be lost.`
}

export function publishWearableLive(next: Partial<WearableLive>) {
  const merged = { ...wearableLiveState, ...next }
  if (
    wearableLiveState.connected === merged.connected
    && wearableLiveState.heartRateActive === merged.heartRateActive
  ) return
  wearableLiveState = merged
  wearableLiveListeners.forEach((listener) => listener())
}

function subscribeWearableLive(listener: () => void) {
  wearableLiveListeners.add(listener)
  return () => wearableLiveListeners.delete(listener)
}

function wearableKind(value: string | null | undefined): WearableKind | null {
  if (value === 'apple-watch' || value === 'garmin') return value
  return null
}

export default function useWearableStatus(): WearableStatus {
  const { settings } = useSQLContext()
  const live = useSyncExternalStore(subscribeWearableLive, () => wearableLiveState, () => idleLive)
  const preference = wearableKind(settings.wearable)
  const kind = live.connected || live.heartRateActive ? 'apple-watch' : preference
  return {
    kind,
    connected: live.connected,
    heartRateActive: live.heartRateActive,
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
