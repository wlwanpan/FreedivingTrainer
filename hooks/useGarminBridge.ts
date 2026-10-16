import {
  addGarminListener,
  buildAck,
  getStatus,
  handleOpenURL,
  initialize,
  isGarminModuleAvailable,
  parseWatchMessage,
  sendAck,
  sendNextSession,
  slimNextSession,
  type NextSessionMessage,
} from 'expo-garmin-connect-iq'
import { ingestWatchCompletion } from '@/hooks/ingestWatchCompletion'
import { publishWearableLive, subscribeWearableSyncRequest } from '@/hooks/useWearableStatus'
import { useI18n } from '@/providers/i18n'
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
import * as Linking from 'expo-linking'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'


function garminLink(status: { connected: boolean; devices: unknown[] }) {
  return {
    paired: status.devices.length > 0,
    reachable: status.connected,
  }
}

async function publishGarminLink(
  pairedRef: { current: boolean },
  reachableRef: { current: boolean },
) {
  const status = await getStatus()
  const link = garminLink(status)
  pairedRef.current = link.paired
  reachableRef.current = link.reachable
  publishWearableLive({
    source: 'garmin',
    paired: link.paired,
    connected: link.reachable,
  })
  return link
}

function garminUrl(url: string | null): boolean {
  if (url == null) return false
  return url.startsWith('freedivingtrainer:')
}

export default function useGarminBridge() {
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
  const syncedAtRef = useRef(syncedAt)
  syncedAtRef.current = syncedAt
  const sessionsRef = useRef(sessions)
  const heartRatesRef = useRef(heartRates)
  const insertHeartRatesRef = useRef(insertHeartRates)
  const warnRef = useRef<(description: string) => void>(() => {})
  const settingsRef = useRef(settings)
  const updateSettingsRef = useRef(updateSettings)
  const syncStateRef = useRef(initialWatchSyncState)
  const pairedRef = useRef(false)
  const reachableRef = useRef(false)
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
    reachableRef.current = result.state.reachable
    publishWearableLive({
      source: 'garmin',
      paired: pairedRef.current || result.state.reachable,
      connected: result.state.reachable,
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
    if (!isGarminModuleAvailable()) return
    let cancelled = false
    let queue = Promise.resolve()
    let staleTimer: ReturnType<typeof setTimeout> | undefined
    let lastPayload: Record<string, unknown> | null = null

    const takeSnapshot = async (payload: Record<string, unknown>) => {
      if (payload.type !== 'watchTraining') return
      lastPayload = payload
      const link = await publishGarminLink(pairedRef, reachableRef)
      if (cancelled) return
      applySyncRef.current({
        type: 'snapshot',
        payload,
        now: Date.now(),
        reachable: link.reachable,
      })
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
          reachable: reachableRef.current,
        })
      }, Math.max(0, delay + 50))
    }

    const ack = async (completedAt: number) => {
      const nextSynced = syncedAtRef.current.includes(completedAt)
        ? syncedAtRef.current
        : [...syncedAtRef.current, completedAt].slice(-20)
      try {
        await sendAck(buildAck(completedAt, nextSynced))
      } catch {
        return
      }
    }

    const saveCompletion = async (payload: Record<string, unknown>) => {
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
      if (result.saved && result.completedAt != null) {
        await ack(result.completedAt)
      }
    }

    const onMessage = (event: Record<string, unknown>) => {
      const parsed = parseWatchMessage(event.message)
      if (parsed == null) return
      if (parsed.type === 'heartRate') return
      if (parsed.type === 'watchTraining') {
        void takeSnapshot(parsed)
        return
      }
      queue = queue.then(() => saveCompletion(parsed)).catch(() => undefined)
    }

    const onStatus = () => {
      void (async () => {
        const link = await publishGarminLink(pairedRef, reachableRef)
        if (cancelled) return
        applySyncRef.current({
          type: 'reachability',
          reachable: link.reachable,
          now: Date.now(),
        })
      })()
    }

    const receiveUrl = async (url: string | null) => {
      if (!garminUrl(url) || url == null) return
      try {
        const devices = await handleOpenURL(url)
        if (cancelled || devices.length === 0) return
        const current = settingsRef.current
        if (current.id > 0 && current.wearable !== 'garmin') {
          void updateSettingsRef.current({
            ...current,
            wearable: 'garmin',
            updatedAt: new Date(),
          })
        }
        await publishGarminLink(pairedRef, reachableRef)
      } catch {
        return
      }
    }

    const subscriptions = [
      addGarminListener('onMessage', onMessage),
      addGarminListener('onDeviceStatus', onStatus),
      addGarminListener('onReady', onStatus),
    ]
    const linking = Linking.addEventListener('url', (event) => {
      void receiveUrl(event.url)
    })

    void (async () => {
      try {
        await initialize()
      } catch {
        return
      }
      if (cancelled) return
      await publishGarminLink(pairedRef, reachableRef)
      await receiveUrl(await Linking.getInitialURL())
    })()

    return () => {
      cancelled = true
      if (staleTimer != null) clearTimeout(staleTimer)
      subscriptions.forEach((remove) => remove())
      linking.remove()
    }
  }, [])

  useEffect(() => {
    if (!ready || !isGarminModuleAvailable()) return
    let cancelled = false
    const publish = (manual = false) => {
      void (async () => {
        const status = await getStatus()
        if (cancelled || status.devices.length === 0) return
        if (manual) {
          applySyncRef.current({
            type: 'requested',
            now: Date.now(),
            reachable: status.connected,
          })
        }
        const payload = slimNextSession(contextRef.current as NextSessionMessage)
        try {
          const result = await sendNextSession(payload as Record<string, unknown>)
          if (cancelled || result === 'notConnected') return
        } catch {
          return
        }
        applySyncRef.current({
          type: 'published',
          now: Date.now(),
          reachable: status.connected,
        })
      })()
    }
    const removeStatus = addGarminListener('onDeviceStatus', () => publish())
    const removeSync = subscribeWearableSyncRequest(() => publish(true))
    publish()
    return () => {
      cancelled = true
      removeStatus()
      removeSync()
    }
  }, [contextKey, ready])
}
