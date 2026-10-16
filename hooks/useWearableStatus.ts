import { Translate } from '@/i18n/types'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { formatSyncClock, syncStatusLabel } from '@/utils/watch_sync'
import { englishTranslate } from '@/i18n/translate'
import { useSyncExternalStore } from 'react'


export type WearableKind = 'apple-watch' | 'garmin' | 'heart-rate'

export type WearableStatus = {
  kind: WearableKind | null
  connected: boolean
  paired: boolean
  appleConnected: boolean
  applePaired: boolean
  garminConnected: boolean
  garminPaired: boolean
  heartRateActive: boolean
  watchTraining: boolean
  trainingKind: WearableKind | null
  syncedAt: number | null
  syncLabel: string | null
}

type WearableLinkLive = {
  connected: boolean
  paired: boolean
  watchTraining: boolean
  pendingCount: number | null
  contextPublished: boolean
  syncedAt: number | null
}

type WearableLive = {
  apple: WearableLinkLive
  garmin: WearableLinkLive
  heartRateActive: boolean
}

const idleLink: WearableLinkLive = {
  connected: false,
  paired: false,
  watchTraining: false,
  pendingCount: null,
  contextPublished: false,
  syncedAt: null,
}

const idleLive: WearableLive = {
  apple: idleLink,
  garmin: idleLink,
  heartRateActive: false,
}

let wearableLiveState = idleLive
const wearableLiveListeners = new Set<() => void>()

function sameLink(current: WearableLinkLive, next: WearableLinkLive): boolean {
  return current.connected === next.connected
    && current.paired === next.paired
    && current.watchTraining === next.watchTraining
    && current.pendingCount === next.pendingCount
    && current.contextPublished === next.contextPublished
    && current.syncedAt === next.syncedAt
}

function sameLive(current: WearableLive, next: WearableLive): boolean {
  return current.heartRateActive === next.heartRateActive
    && sameLink(current.apple, next.apple)
    && sameLink(current.garmin, next.garmin)
}

export function publishWatchTraining(running: boolean) {
  publishWearableLive({ watchTraining: running })
}

export function withWatchTrainingLoss(message: string, t: Translate = englishTranslate): string {
  if (!wearableLiveState.apple.watchTraining && !wearableLiveState.garmin.watchTraining) {
    return message
  }
  return `${message} ${t('settings.eraseWatchLoss')}`
}

export function publishWearableLive(next: Partial<WearableLinkLive> & {
  source?: WearableKind
  heartRateActive?: boolean
}) {
  const source = next.source === 'garmin' ? 'garmin' : 'apple'
  const currentLink = wearableLiveState[source]
  const nextLink: WearableLinkLive = {
    connected: next.connected ?? currentLink.connected,
    paired: next.paired ?? currentLink.paired,
    watchTraining: next.watchTraining ?? currentLink.watchTraining,
    pendingCount: next.pendingCount === undefined ? currentLink.pendingCount : next.pendingCount,
    contextPublished: next.contextPublished ?? currentLink.contextPublished,
    syncedAt: next.syncedAt === undefined ? currentLink.syncedAt : next.syncedAt,
  }
  const merged: WearableLive = {
    apple: source === 'apple' ? nextLink : wearableLiveState.apple,
    garmin: source === 'garmin' ? nextLink : wearableLiveState.garmin,
    heartRateActive: next.heartRateActive ?? wearableLiveState.heartRateActive,
  }
  if (sameLive(wearableLiveState, merged)) return
  wearableLiveState = merged
  wearableLiveListeners.forEach((listener) => listener())
}

export function watchBlocksPhoneStart(status: Pick<WearableStatus, 'watchTraining'>): boolean {
  return status.watchTraining
}

function subscribeWearableLive(listener: () => void) {
  wearableLiveListeners.add(listener)
  return () => wearableLiveListeners.delete(listener)
}

function wearableKind(value: string | null | undefined): WearableKind | null {
  if (value === 'apple-watch' || value === 'garmin') return value
  return null
}

function liveLink(kind: WearableKind | null, live: WearableLive): WearableLinkLive {
  if (kind === 'garmin') return live.garmin
  return live.apple
}

export default function useWearableStatus(): WearableStatus {
  const { settings } = useSQLContext()
  const { t } = useI18n()
  const live = useSyncExternalStore(subscribeWearableLive, () => wearableLiveState, () => idleLive)
  const preference = wearableKind(settings.wearable)
  const kind = preference
    ?? (live.apple.connected || live.apple.paired
      ? 'apple-watch'
      : live.garmin.connected || live.garmin.paired
        ? 'garmin'
        : null)
  const link = liveLink(kind, live)
  const watchTraining = live.apple.watchTraining || live.garmin.watchTraining
  const trainingKind = live.garmin.watchTraining && !live.apple.watchTraining
    ? 'garmin'
    : live.apple.watchTraining
      ? 'apple-watch'
      : live.garmin.watchTraining
        ? 'garmin'
        : null
  const syncedAt = link.syncedAt ?? settings.watchSyncedAt?.getTime() ?? null
  return {
    kind,
    connected: link.connected,
    paired: link.paired,
    appleConnected: live.apple.connected,
    applePaired: live.apple.paired,
    garminConnected: live.garmin.connected,
    garminPaired: live.garmin.paired,
    heartRateActive: live.heartRateActive,
    watchTraining,
    trainingKind,
    syncedAt,
    syncLabel: syncStatusLabel({
      paired: link.paired,
      reachable: link.connected,
      pendingCount: link.pendingCount,
      contextPublished: link.contextPublished,
      syncedAt,
      now: Date.now(),
    }, t),
  }
}

export function wearableLabel(status: WearableStatus, t: Translate = englishTranslate): string {
  if (status.watchTraining) {
    return status.trainingKind === 'garmin'
      ? t('wearable.trainingOnGarmin')
      : t('wearable.trainingOnWatch')
  }
  if (status.heartRateActive) return t('wearable.hrActive')
  if (status.kind === 'apple-watch') {
    return status.connected ? t('wearable.appleConnected') : t('wearable.appleDisconnected')
  }
  if (status.kind === 'garmin') {
    return status.connected ? t('wearable.garminConnected') : t('wearable.garminDisconnected')
  }
  return t('wearable.noDevice')
}

export function wearableLive(status: WearableStatus): boolean {
  return status.heartRateActive || status.watchTraining || (status.connected && status.kind != null)
}

export function lastSyncLabel(
  status: Pick<WearableStatus, 'syncedAt' | 'syncLabel'>,
  t: Translate = englishTranslate,
): string {
  if (status.syncedAt == null) {
    return status.syncLabel === t('wearable.syncing') ? t('wearable.syncing') : t('wearable.notSynced')
  }
  return formatSyncClock(status.syncedAt, Date.now(), t)
}
