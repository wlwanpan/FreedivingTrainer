import { englishTranslate } from '@/i18n/translate'
import { Translate } from '@/i18n/types'

export const WatchTrainingStaleMs = 45_000

export type PhoneTraining = {
  running: true
  paused: boolean
  name: string
  phase: string
  startedAt: number
}

export type PhoneTrainingContext = PhoneTraining | { running: false }

export type WatchSyncState = {
  watchRunning: boolean
  pendingCount: number | null
  contextPublished: boolean
  reachable: boolean
  syncedAt: number | null
}

export const initialWatchSyncState: WatchSyncState = {
  watchRunning: false,
  pendingCount: null,
  contextPublished: false,
  reachable: false,
  syncedAt: null,
}

export type WatchSyncEvent =
  | { type: 'reachability'; reachable: boolean; now: number }
  | { type: 'snapshot'; payload: Record<string, unknown>; now: number; reachable: boolean }
  | { type: 'published'; now: number; reachable: boolean }
  | { type: 'requested'; now: number; reachable: boolean }
  | { type: 'completion'; completedAt: number; savedCreatedAt: readonly number[] }

export type WatchSyncResult = {
  state: WatchSyncState
  ack: boolean
  insert: boolean
  stamp: number | null
}

function wholeNumber(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  const rounded = Math.round(parsed)
  if (rounded < min || rounded > max) return null
  return rounded
}

function flag(value: unknown): boolean {
  return value === true || value === 1
}

function settled(state: WatchSyncState): boolean {
  return state.reachable && state.contextPublished && state.pendingCount === 0
}

function unchanged(state: WatchSyncState): WatchSyncResult {
  return { state, ack: false, insert: false, stamp: null }
}

function withStamp(prev: WatchSyncState, next: WatchSyncState, now: number): WatchSyncResult {
  const stamp = settled(next) && !settled(prev) ? now : null
  return {
    state: stamp == null ? next : { ...next, syncedAt: stamp },
    ack: false,
    insert: false,
    stamp,
  }
}

export function readWatchSnapshot(payload: Record<string, unknown>): {
  running: boolean
  updatedAt: number | null
  pendingCount: number | null
} | null {
  if (payload.type !== 'watchTraining') return null
  const pendingCount = payload.pendingCount == null
    ? null
    : wholeNumber(payload.pendingCount, 0, 1000)
  return {
    running: flag(payload.running),
    updatedAt: wholeNumber(payload.updatedAt, 1, Number.MAX_SAFE_INTEGER),
    pendingCount,
  }
}

function liveRunning(
  snapshot: { running: boolean; updatedAt: number | null },
  now: number,
  reachable: boolean,
): boolean {
  if (!reachable || !snapshot.running || snapshot.updatedAt == null) return false
  return now - snapshot.updatedAt <= WatchTrainingStaleMs
}

export function phoneTrainingContext(training: PhoneTraining | null): PhoneTrainingContext {
  if (training == null) return { running: false }
  return training
}

export function completionAlreadySaved(
  savedCreatedAt: readonly number[],
  completedAt: number,
): boolean {
  const completedSecond = Math.floor(completedAt / 1000)
  return savedCreatedAt.some((createdAt) => Math.floor(createdAt / 1000) === completedSecond)
}

export function reduceWatchSync(state: WatchSyncState, event: WatchSyncEvent): WatchSyncResult {
  if (event.type === 'completion') {
    const already = completionAlreadySaved(event.savedCreatedAt, event.completedAt)
    return { state, ack: already, insert: !already, stamp: null }
  }
  if (event.type === 'reachability') {
    const reconnected = event.reachable && !state.reachable
    return withStamp(state, {
      ...state,
      reachable: event.reachable,
      watchRunning: event.reachable ? state.watchRunning : false,
      pendingCount: event.reachable && !reconnected ? state.pendingCount : null,
      contextPublished: event.reachable && !reconnected ? state.contextPublished : false,
    }, event.now)
  }
  if (event.type === 'requested') {
    return withStamp(state, {
      ...state,
      reachable: event.reachable,
      contextPublished: false,
      pendingCount: event.reachable ? null : state.pendingCount,
      watchRunning: event.reachable ? state.watchRunning : false,
    }, event.now)
  }
  if (event.type === 'published') {
    return withStamp(state, {
      ...state,
      contextPublished: true,
      reachable: event.reachable,
      watchRunning: event.reachable ? state.watchRunning : false,
    }, event.now)
  }
  const snapshot = readWatchSnapshot(event.payload)
  if (snapshot == null) return unchanged(state)
  return withStamp(state, {
    ...state,
    reachable: event.reachable,
    watchRunning: liveRunning(snapshot, event.now, event.reachable),
    pendingCount: snapshot.pendingCount == null ? state.pendingCount : snapshot.pendingCount,
  }, event.now)
}

export function formatSyncClock(at: number, now: number, t: Translate = englishTranslate): string {
  const date = new Date(at)
  const current = new Date(now)
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const suffix = hours >= 12 ? t('calendar.pm') : t('calendar.am')
  const hour = hours % 12 || 12
  const time = `${hour}:${minutes} ${suffix}`
  const sameDay = date.getFullYear() === current.getFullYear()
    && date.getMonth() === current.getMonth()
    && date.getDate() === current.getDate()
  if (sameDay) return time
  const yesterday = new Date(current)
  yesterday.setDate(current.getDate() - 1)
  const isYesterday = date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate()
  if (isYesterday) return t('calendar.yesterdayTime', { time })
  return t('calendar.monthDayTime', {
    month: t(`calendar.monthShort.${date.getMonth()}`),
    day: date.getDate(),
    time,
  })
}

export function syncStatusLabel(input: {
  paired: boolean
  reachable: boolean
  pendingCount: number | null
  contextPublished: boolean
  syncedAt: number | null
  now: number
}, t: Translate = englishTranslate): string | null {
  const ready = input.reachable && input.pendingCount === 0 && input.contextPublished
  if (input.reachable && !ready) return t('wearable.syncing')
  if (ready && input.syncedAt != null) return t('wearable.synced', { time: formatSyncClock(input.syncedAt, input.now, t) })
  if (input.reachable) return t('wearable.syncing')
  if (input.syncedAt != null) return t('wearable.lastSyncAt', { time: formatSyncClock(input.syncedAt, input.now, t) })
  if (input.paired) return t('wearable.notSynced')
  return null
}
