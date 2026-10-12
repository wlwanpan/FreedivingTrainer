import { TableType, TableTypes } from '@/constants/tables'
import { ErrorTitles } from '@/constants/errors'
import { publishWearableLive } from '@/hooks/useWearableStatus'
import { WatchConnectivity } from '@/hooks/watchConnectivity'
import useTrainingOutline, { nextTrainingSession } from '@/hooks/useTrainingOutline'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { sessionRounds } from '@/utils/training_plan'
import { useEffect, useRef } from 'react'


type CompletedSession = {
  tableType: TableType
  holdSeconds: number
  restSeconds: number
  roundsCompleted: number
  roundsPlanned: number
  completedAt: number
  heartRates: { bpm: number; recordedAt: Date }[]
}

function wholeNumber(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  const rounded = Math.round(parsed)
  if (rounded < min || rounded > max) return null
  return rounded
}

function tableType(value: unknown): TableType | null {
  if (typeof value !== 'string') return null
  return (TableTypes as readonly string[]).includes(value) ? value as TableType : null
}

function dayStamp(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function readRates(value: unknown): { bpm: number; recordedAt: Date }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (item == null || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const bpm = wholeNumber(record.bpm, 30, 230)
    const at = wholeNumber(record.at, 1, Number.MAX_SAFE_INTEGER)
    if (bpm == null || at == null) return []
    return [{ bpm, recordedAt: new Date(at) }]
  })
}

function readCompleted(payload: Record<string, unknown>): CompletedSession | null {
  if (payload.type !== 'sessionComplete') return null
  const kind = tableType(payload.tableType)
  const holdSeconds = wholeNumber(payload.holdSeconds, 1, 3600)
  const restSeconds = wholeNumber(payload.restSeconds, 0, 3600)
  const roundsCompleted = wholeNumber(payload.roundsCompleted, 1, 40)
  const roundsPlanned = wholeNumber(payload.roundsPlanned, 1, 40)
  const completedAt = wholeNumber(payload.completedAt, 1, Number.MAX_SAFE_INTEGER)
  if (
    kind == null
    || holdSeconds == null
    || restSeconds == null
    || roundsCompleted == null
    || roundsPlanned == null
    || completedAt == null
  ) return null
  return {
    tableType: kind,
    holdSeconds,
    restSeconds,
    roundsCompleted,
    roundsPlanned,
    completedAt,
    heartRates: readRates(payload.heartRates),
  }
}

function publishConnection() {
  const state = WatchConnectivity.sessionState
  publishWearableLive({
    connected: state.isPaired && state.isWatchAppInstalled && state.isReachable,
  })
}

export default function useWatchBridge() {
  const { settings, sessions, insertSession, insertHeartRates } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const outline = useTrainingOutline()
  const savedRef = useRef(new Set<number>())
  const sessionsRef = useRef(sessions)
  const insertSessionRef = useRef(insertSession)
  const insertHeartRatesRef = useRef(insertHeartRates)
  const warnRef = useRef(showWarning)
  sessionsRef.current = sessions
  insertSessionRef.current = insertSession
  insertHeartRatesRef.current = insertHeartRates
  warnRef.current = showWarning

  const next = nextTrainingSession(outline)
  const rounds = next == null ? [] : sessionRounds(next)
  const context = subscription.freeLimitReached
    ? { type: 'nextSession', locked: true, loggedCount: sessions.length }
    : next == null || rounds.length === 0
      ? { type: 'nextSession', loggedCount: sessions.length }
      : {
        type: 'nextSession',
        loggedCount: sessions.length,
        name: next.name,
        tableType: next.tableType,
        breatheUpSeconds: settings.breatheUpSeconds,
        holdSeconds: next.holdSeconds,
        restSeconds: next.restStartSeconds,
        rounds: rounds.map((round) => ({
          hold: round.holdSeconds,
          rest: round.restSeconds,
        })),
      }
  const contextKey = JSON.stringify(context)
  const contextRef = useRef(context)
  contextRef.current = context

  useEffect(() => {
    if (!WatchConnectivity.isSupported) return
    let cancelled = false
    const save = async (payload: Record<string, unknown>) => {
      const completed = readCompleted(payload)
      if (completed == null) return
      const duplicate = savedRef.current.has(completed.completedAt)
        || sessionsRef.current.some((session) => (
          session.tableType === completed.tableType
          && session.holdSeconds === completed.holdSeconds
          && session.roundsCompleted === completed.roundsCompleted
          && Math.abs(session.createdAt.getTime() - completed.completedAt) < 2000
        ))
      if (duplicate) {
        savedRef.current.add(completed.completedAt)
        return
      }
      savedRef.current.add(completed.completedAt)
      const createdAt = new Date(completed.completedAt)
      const result = await insertSessionRef.current({
        tableType: completed.tableType,
        day: dayStamp(createdAt),
        roundsCompleted: completed.roundsCompleted,
        roundsPlanned: completed.roundsPlanned,
        holdSeconds: completed.holdSeconds,
        restSeconds: completed.restSeconds,
        createdAt,
        updatedAt: createdAt,
      })
      const sessionId = result.insertionID
      if (result.error || sessionId == null) {
        savedRef.current.delete(completed.completedAt)
        if (result.error) warnRef.current(ErrorTitles.Sql, result.error.message)
        return
      }
      if (completed.heartRates.length === 0) return
      const rates = await insertHeartRatesRef.current(completed.heartRates.map((sample) => ({
        ...sample,
        sessionId,
      })))
      if (rates.error) warnRef.current(ErrorTitles.Sql, rates.error.message)
    }
    const subscriptions = [
      WatchConnectivity.addMessageListener((event) => { void save(event.message) }),
      WatchConnectivity.addUserInfoListener((event) => { void save(event.userInfo) }),
      WatchConnectivity.addReachabilityListener(() => publishConnection()),
    ]
    void (async () => {
      if (WatchConnectivity.sessionState.activationState !== 'activated') {
        await WatchConnectivity.activate()
      }
      if (cancelled) return
      publishConnection()
    })()
    return () => {
      cancelled = true
      subscriptions.forEach((item) => item.remove())
    }
  }, [])

  useEffect(() => {
    if (!WatchConnectivity.isSupported) return
    let cancelled = false
    void (async () => {
      if (WatchConnectivity.sessionState.activationState !== 'activated') {
        await WatchConnectivity.activate()
      }
      if (cancelled) return
      await WatchConnectivity.updateApplicationContext(contextRef.current).catch(() => undefined)
    })()
    return () => {
      cancelled = true
    }
  }, [contextKey])
}
