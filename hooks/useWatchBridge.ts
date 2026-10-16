import { ingestWatchCompletion } from '@/hooks/ingestWatchCompletion'
import { publishWearableLive, subscribeWearableSyncRequest } from '@/hooks/useWearableStatus'
import { useI18n } from '@/providers/i18n'
import { ensureWatchSession, WatchConnectivity } from '@/hooks/watchConnectivity'
import useTrainingOutline, { nextTrainingSession } from '@/hooks/useTrainingOutline'
import { readPhoneTraining, subscribePhoneTraining } from '@/hooks/phoneTraining'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { buildWatchContext, watchPlanKey } from '@/utils/watch_context'
import {
  initialWatchSyncState,
  reduceWatchSync,
  WatchSyncEvent,
  WatchTrainingStaleMs,
} from '@/utils/watch_sync'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

function sessionLink() {
  const state = WatchConnectivity.sessionState
  return {
    paired: state.isPaired && state.isWatchAppInstalled,
    reachable: state.isPaired && state.isWatchAppInstalled && state.isReachable,
  }
}

function publishLink() {
  const link = sessionLink()
  publishWearableLive({
    source: 'apple-watch',
    paired: link.paired,
    connected: link.reachable,
  })
}

export default function useWatchBridge() {
  const {
    settings,
    sessions,
    updatedAt,
    heartRates,
    insertHeartRates,
    updateSettings,
  } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { t, language } = useI18n()
  const { showWarning } = useWarningModal()
  const outline = useTrainingOutline()
  const phoneTraining = useSyncExternalStore(subscribePhoneTraining, readPhoneTraining, () => null)
  const [syncedAt, setSyncedAt] = useState<number[]>([])
  const savedRef = useRef(new Set<number>())
  const rememberSyncRef = useRef<(completedAt: number) => void>(() => {})
  rememberSyncRef.current = (completedAt: number) => {
    setSyncedAt((current) => (
      current.includes(completedAt) ? current : [...current, completedAt].slice(-20)
    ))
  }
  const sessionsRef = useRef(sessions)
  const heartRatesRef = useRef(heartRates)
  const insertHeartRatesRef = useRef(insertHeartRates)
  const warnRef = useRef<(description: string) => void>(() => {})
  const settingsRef = useRef(settings)
  const updateSettingsRef = useRef(updateSettings)
  const syncStateRef = useRef(initialWatchSyncState)
  sessionsRef.current = sessions
  heartRatesRef.current = heartRates
  insertHeartRatesRef.current = insertHeartRates
  warnRef.current = (description: string) => showWarning(t('errors.sql'), description)
  settingsRef.current = settings
  updateSettingsRef.current = updateSettings

  const applySyncRef = useRef<(event: WatchSyncEvent) => void>(() => {})
  applySyncRef.current = (event) => {
    const result = reduceWatchSync(syncStateRef.current, event)
    syncStateRef.current = result.state
    const link = sessionLink()
    publishWearableLive({
      source: 'apple-watch',
      paired: link.paired,
      connected: link.reachable,
      watchTraining: result.state.watchRunning,
      pendingCount: result.state.pendingCount,
      contextPublished: result.state.contextPublished,
      syncedAt: result.state.syncedAt,
    })
    if (result.stamp == null) return
    const current = settingsRef.current
    if (current.id <= 0 || current.watchSyncedAt?.getTime() === result.stamp) return
    void updateSettingsRef.current({
      ...current,
      watchSyncedAt: new Date(result.stamp),
      updatedAt: new Date(),
    })
  }

  const next = nextTrainingSession(outline)
  const planKey = watchPlanKey(settings)
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
  const context = buildWatchContext({
    settings,
    sessionsCount: sessions.length,
    planKey,
    sync: syncRef.current,
    syncedAt,
    language,
    t,
    outline,
    next,
    phoneTraining,
    freeLimitReached: subscription.freeLimitReached,
  })
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
    let staleTimer: ReturnType<typeof setTimeout> | undefined
    let lastPayload: Record<string, unknown> | null = null
    const takeSnapshot = (payload: Record<string, unknown>) => {
      if (payload.type !== 'watchTraining') return
      lastPayload = payload
      const reachable = sessionLink().reachable
      applySyncRef.current({ type: 'snapshot', payload, now: Date.now(), reachable })
      if (staleTimer != null) clearTimeout(staleTimer)
      const updatedAtMs = typeof payload.updatedAt === 'number' ? payload.updatedAt : null
      const running = payload.running === true || payload.running === 1
      if (!running || updatedAtMs == null) return
      const delay = updatedAtMs + WatchTrainingStaleMs - Date.now()
      staleTimer = setTimeout(() => {
        if (lastPayload == null) return
        applySyncRef.current({
          type: 'snapshot',
          payload: lastPayload,
          now: Date.now(),
          reachable: sessionLink().reachable,
        })
      }, Math.max(0, delay + 50))
    }
    const save = (payload: Record<string, unknown>, replyId?: string) => {
      if (payload.type === 'watchTraining') {
        takeSnapshot(payload)
        return
      }
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
      const result = await ingestWatchCompletion({
        payload,
        planKey: activePlanKeyRef.current,
        planStartedAt: planStartedRef.current,
        sessions: sessionsRef.current,
        heartRates: heartRatesRef.current,
        savedCompletions: savedRef.current,
        rememberSync: rememberSyncRef.current,
        insertHeartRates: (samples) => insertHeartRatesRef.current(samples),
        warn: warnRef.current,
      })
      return result.saved
    }
    const subscriptions = [
      WatchConnectivity.addMessageListener((event) => { save(event.message, event.replyId) }),
      WatchConnectivity.addUserInfoListener((event) => { save(event.userInfo) }),
      WatchConnectivity.addApplicationContextListener((event) => {
        takeSnapshot(event.applicationContext)
      }),
      WatchConnectivity.addReachabilityListener((event) => {
        publishLink()
        applySyncRef.current({
          type: 'reachability',
          reachable: event.isReachable && sessionLink().paired,
          now: Date.now(),
        })
      }),
    ]
    void (async () => {
      if (WatchConnectivity.sessionState.activationState !== 'activated') {
        await WatchConnectivity.activate()
      }
      if (cancelled) return
      publishLink()
      takeSnapshot(WatchConnectivity.receivedApplicationContext)
    })()
    return () => {
      cancelled = true
      if (staleTimer != null) clearTimeout(staleTimer)
      subscriptions.forEach((item) => item.remove())
    }
  }, [])

  useEffect(() => {
    if (!ready || !WatchConnectivity.isSupported) return
    let cancelled = false
    const publish = (manual = false) => {
      void (async () => {
        const activated = await ensureWatchSession()
        if (cancelled || !activated) return
        const reachable = sessionLink().reachable
        if (manual) {
          applySyncRef.current({ type: 'requested', now: Date.now(), reachable })
        }
        try {
          await WatchConnectivity.updateApplicationContext(contextRef.current)
        } catch {
          if (!manual) return
        }
        if (cancelled) return
        if (reachable) {
          const payload = manual
            ? { ...contextRef.current, type: 'requestSync' }
            : {
              type: 'phoneTraining',
              ...(contextRef.current.phoneTraining as Record<string, unknown>),
            }
          try {
            await WatchConnectivity.sendMessage(payload)
          } catch {
            if (!manual) {
              applySyncRef.current({ type: 'published', now: Date.now(), reachable })
              return
            }
          }
        }
        if (cancelled) return
        applySyncRef.current({
          type: 'published',
          now: Date.now(),
          reachable: sessionLink().reachable,
        })
      })()
    }
    const subscriptions = [
      WatchConnectivity.addActivationListener((event) => {
        if (event.activationState === 'activated') publish()
      }),
      WatchConnectivity.addReachabilityListener(() => publish()),
      { remove: subscribeWearableSyncRequest(() => publish(true)) },
    ]
    publish()
    return () => {
      cancelled = true
      subscriptions.forEach((item) => item.remove())
    }
  }, [contextKey, ready])
}
