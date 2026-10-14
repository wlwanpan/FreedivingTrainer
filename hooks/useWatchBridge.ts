import { ErrorTitles } from '@/constants/errors'
import { publishWatchTraining, publishWearableLive } from '@/hooks/useWearableStatus'
import { ensureWatchSession, WatchConnectivity } from '@/hooks/watchConnectivity'
import useTrainingOutline, { nextTrainingSession } from '@/hooks/useTrainingOutline'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { recordCompletedSession } from '@/hooks/recordCompletedSession'
import { sessionRounds } from '@/utils/training_plan'
import { dayStamp, readWatchCompletion } from '@/utils/watch_completion'
import { watchTablesFromSettings } from '@/utils/watch_tables'
import { useEffect, useRef, useState } from 'react'

function publishConnection() {
  const state = WatchConnectivity.sessionState
  publishWearableLive({
    connected: state.isPaired && state.isWatchAppInstalled && state.isReachable,
  })
}

export default function useWatchBridge() {
  const {
    settings,
    sessions,
    updatedAt,
    insertHeartRates,
  } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const outline = useTrainingOutline()
  const [syncedAt, setSyncedAt] = useState<number[]>([])
  const savedRef = useRef(new Set<number>())
  const rememberSyncRef = useRef<(completedAt: number) => void>(() => {})
  rememberSyncRef.current = (completedAt: number) => {
    setSyncedAt((current) => (
      current.includes(completedAt) ? current : [...current, completedAt].slice(-20)
    ))
  }
  const sessionsRef = useRef(sessions)
  const insertHeartRatesRef = useRef(insertHeartRates)
  const warnRef = useRef(showWarning)
  sessionsRef.current = sessions
  insertHeartRatesRef.current = insertHeartRates
  warnRef.current = showWarning

  const next = nextTrainingSession(outline)
  const rounds = next == null ? [] : sessionRounds(next)
  const planKey = settings.trainingPlan == null || settings.trainingPlanStartedAt == null
    ? ''
    : `${settings.trainingPlan}:${settings.trainingPlanStartedAt.getTime()}:${settings.customPlan ?? ''}`
  const planKeyRef = useRef<string | null>(null)
  const syncRef = useRef('')
  const ready = updatedAt != null
  if (ready && planKeyRef.current !== planKey) {
    syncRef.current = planKeyRef.current == null
      ? ''
      : planKey === ''
        ? 'erase'
        : 'plan'
    planKeyRef.current = planKey
  }
  const sync = syncRef.current
  const tables = watchTablesFromSettings(settings)
  const shared = {
    type: 'nextSession' as const,
    loggedCount: sessions.length,
    planKey,
    sync,
    syncedAt,
    tables,
  }
  const context = subscription.freeLimitReached
    ? { ...shared, locked: true }
    : outline != null && next == null
      ? { ...shared, complete: true }
      : next == null || rounds.length === 0
        ? shared
        : {
          ...shared,
          name: next.name,
          week: next.week,
          sessionIndex: next.index,
          planWeek: outline?.week ?? next.week,
          planWeeks: outline?.weeks ?? 1,
          progress: Math.round((outline?.progress ?? 0) * 100),
          planName: outline?.planName ?? '',
          schedule: (outline?.schedule ?? []).map((entry) => ({
            week: entry.week,
            current: entry.current,
            locked: entry.locked,
            sessions: entry.sessions.map((session) => ({
              index: session.index,
              name: session.name,
              tableType: session.tableType,
              holdSeconds: session.holdSeconds,
              restSeconds: session.restStartSeconds,
              rounds: session.rounds,
              completed: session.completed,
              note: session.note,
            })),
          })),
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
  const activePlanKeyRef = useRef(planKey)
  const planStartedRef = useRef(settings.trainingPlanStartedAt)
  contextRef.current = context
  activePlanKeyRef.current = planKey
  planStartedRef.current = settings.trainingPlanStartedAt

  useEffect(() => {
    if (!WatchConnectivity.isSupported) return
    let cancelled = false
    let queue = Promise.resolve()
    const save = (payload: Record<string, unknown>, replyId?: string) => {
      queue = queue.then(async () => {
        const saved = await saveCompletion(payload)
        if (replyId != null && payload.type === 'sessionComplete') {
          WatchConnectivity.replyToMessage(replyId, { saved })
        }
      }).catch(() => {
        if (replyId != null && payload.type === 'sessionComplete') {
          WatchConnectivity.replyToMessage(replyId, { saved: false })
        }
      })
    }
    const saveCompletion = async (payload: Record<string, unknown>): Promise<boolean> => {
      if (payload.type === 'watchTraining') {
        publishWatchTraining(payload.running === true || payload.running === 1)
        return false
      }
      const completed = readWatchCompletion(payload, activePlanKeyRef.current)
      if (completed == null) return false
      const duplicate = savedRef.current.has(completed.completedAt)
        || (completed.planWeek == null && sessionsRef.current.some((session) => (
          session.tableType === completed.tableType
          && session.holdSeconds === completed.holdSeconds
          && session.roundsCompleted === completed.roundsCompleted
          && Math.abs(session.createdAt.getTime() - completed.completedAt) < 2000
        )))
      if (duplicate) {
        savedRef.current.add(completed.completedAt)
        rememberSyncRef.current(completed.completedAt)
        return true
      }
      savedRef.current.add(completed.completedAt)
      const createdAt = new Date(completed.completedAt)
      const result = await recordCompletedSession({
        tableType: completed.tableType,
        day: dayStamp(createdAt),
        roundsCompleted: completed.roundsCompleted,
        roundsPlanned: completed.roundsPlanned,
        holdSeconds: completed.holdSeconds,
        restSeconds: completed.restSeconds,
        planWeek: completed.planWeek,
        planSession: completed.planSession,
        startedAt: completed.startedAt == null ? null : new Date(completed.startedAt),
        source: 'watch',
        watchDetail: completed.watchDetail,
        createdAt,
        updatedAt: createdAt,
      }, planStartedRef.current)
      const sessionId = result.insertionID
      if (result.skipped) {
        rememberSyncRef.current(completed.completedAt)
        return true
      }
      if (sessionId == null) {
        savedRef.current.delete(completed.completedAt)
        if (result.error) warnRef.current(ErrorTitles.Sql, result.error.message)
        return false
      }
      rememberSyncRef.current(completed.completedAt)
      if (result.error) warnRef.current(ErrorTitles.Sql, result.error.message)
      if (completed.heartRates.length === 0) return true
      const rates = await insertHeartRatesRef.current(completed.heartRates.map((sample) => ({
        ...sample,
        sessionId,
      })))
      if (rates.error) warnRef.current(ErrorTitles.Sql, rates.error.message)
      return true
    }
    const subscriptions = [
      WatchConnectivity.addMessageListener((event) => { save(event.message, event.replyId) }),
      WatchConnectivity.addUserInfoListener((event) => { save(event.userInfo) }),
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
    if (!ready || !WatchConnectivity.isSupported) return
    let cancelled = false
    const publish = () => {
      void (async () => {
        const activated = await ensureWatchSession()
        if (cancelled || !activated) return
        await WatchConnectivity.updateApplicationContext(contextRef.current).catch(() => undefined)
      })()
    }
    const subscriptions = [
      WatchConnectivity.addActivationListener((event) => {
        if (event.activationState === 'activated') publish()
      }),
      WatchConnectivity.addReachabilityListener(() => publish()),
    ]
    publish()
    return () => {
      cancelled = true
      subscriptions.forEach((item) => item.remove())
    }
  }, [contextKey, ready])
}
