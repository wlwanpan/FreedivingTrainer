import { useSQLContext } from '@/providers/sql'
import { formatSyncClock, syncStatusLabel } from '@/utils/watch_sync'
import { useSyncExternalStore } from 'react'


export type WearableKind = 'apple-watch' | 'garmin' | 'heart-rate'

export type WearableStatus = {
  kind: WearableKind | null
  connected: boolean
  paired: boolean
  heartRateActive: boolean
  watchTraining: boolean
  syncedAt: number | null
  syncLabel: string | null
}

type WearableLive = {
  connected: boolean
  paired: boolean
  heartRateActive: boolean
  watchTraining: boolean
  pendingCount: number | null
  contextPublished: boolean
  syncedAt: number | null
}

const idleLive: WearableLive = {
  connected: false,
  paired: false,
  heartRateActive: false,
  watchTraining: false,
  pendingCount: null,
  contextPublished: false,
  syncedAt: null,
}
let wearableLiveState = idleLive
const wearableLiveListeners = new Set<() => void>()

function sameLive(current: WearableLive, next: WearableLive): boolean {
  return current.connected === next.connected
    && current.paired === next.paired
    && current.heartRateActive === next.heartRateActive
    && current.watchTraining === next.watchTraining
    && current.pendingCount === next.pendingCount
    && current.contextPublished === next.contextPublished
    && current.syncedAt === next.syncedAt
}

export function publishWatchTraining(running: boolean) {
  publishWearableLive({ watchTraining: running })
}

export function withWatchTrainingLoss(message: string): string {
  if (!wearableLiveState.watchTraining) return message
  return `${message} The training on your Apple Watch will be lost.`
}

export function publishWearableLive(next: Partial<WearableLive>) {
  const merged = { ...wearableLiveState, ...next }
  if (sameLive(wearableLiveState, merged)) return
  wearableLiveState = merged
  wearableLiveListeners.forEach((listener) => listener())
}

export function watchBlocksPhoneStart(status: Pick<WearableStatus, 'connected' | 'watchTraining'>): boolean {
  return status.connected && status.watchTraining
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
  const kind = live.connected || live.heartRateActive || live.paired ? 'apple-watch' : preference
  const syncedAt = live.syncedAt ?? settings.watchSyncedAt?.getTime() ?? null
  return {
    kind,
    connected: live.connected,
    paired: live.paired,
    heartRateActive: live.heartRateActive,
    watchTraining: live.watchTraining,
    syncedAt,
    syncLabel: syncStatusLabel({
      paired: live.paired,
      reachable: live.connected,
      pendingCount: live.pendingCount,
      contextPublished: live.contextPublished,
      syncedAt,
      now: Date.now(),
    }),
  }
}

export function wearableLabel(status: WearableStatus): string {
  if (status.connected && status.watchTraining) return 'Training on Apple Watch'
  if (status.heartRateActive) return 'Heart Rate Sensor: Active'
  if (status.kind === 'apple-watch') {
    return status.connected ? 'Apple Watch: Connected' : 'Apple Watch: Not connected'
  }
  if (status.kind === 'garmin') {
    return status.connected ? 'Garmin: Connected' : 'Garmin: Not connected'
  }
  return 'No device connected'
}

export function wearableLive(status: WearableStatus): boolean {
  return status.heartRateActive || status.watchTraining || (status.connected && status.kind != null)
}

export function lastSyncLabel(status: Pick<WearableStatus, 'syncedAt' | 'syncLabel'>): string {
  if (status.syncedAt == null) {
    return status.syncLabel === 'Syncing…' ? 'Syncing…' : 'Not synced yet'
  }
  return formatSyncClock(status.syncedAt, Date.now())
}
