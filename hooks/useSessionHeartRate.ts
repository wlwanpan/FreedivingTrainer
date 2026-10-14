import { HeartRateSampleInsert } from '@/db/schema'
import { publishWearableLive } from '@/hooks/useWearableStatus'
import { ensureWatchSession, WatchConnectivity } from '@/hooks/watchConnectivity'
import { useSQLContext } from '@/providers/sql'
import { useCallback, useEffect, useRef, useState } from 'react'


const MinBpm = 30
const MaxBpm = 230

type Sample = Pick<HeartRateSampleInsert, 'bpm' | 'recordedAt'>

function readSample(payload: Record<string, unknown>): Sample | null {
  if (payload.type !== 'heartRate') return null
  const bpm = Math.round(Number(payload.bpm))
  const at = Math.round(Number(payload.at))
  if (!Number.isInteger(bpm) || bpm < MinBpm || bpm > MaxBpm) return null
  if (!Number.isFinite(at) || at <= 0) return null
  return { bpm, recordedAt: new Date(at) }
}

function tellWatch(action: 'startSession' | 'stopSession') {
  if (!WatchConnectivity.isSupported) return
  if (WatchConnectivity.sessionState.activationState !== 'activated') return
  if (!WatchConnectivity.sessionState.isReachable) return
  WatchConnectivity.sendMessage({ action, at: Date.now() }).catch(() => undefined)
}

function watchIsConnected(): boolean {
  if (!WatchConnectivity.isSupported) return false
  const state = WatchConnectivity.sessionState
  return state.isPaired && state.isWatchAppInstalled && state.isReachable
}

export default function useSessionHeartRate(enabled: boolean) {
  const { insertHeartRates } = useSQLContext()
  const insertRef = useRef(insertHeartRates)
  const bufferRef = useRef<Sample[]>([])
  const seenRef = useRef(new Set<number>())
  const sessionIdRef = useRef<number | null>(null)
  const flushingRef = useRef(false)
  const trackingRef = useRef(false)
  const [bpm, setBpm] = useState<number | null>(null)
  insertRef.current = insertHeartRates

  const publish = useCallback((heartRateActive?: boolean) => {
    if (heartRateActive != null) trackingRef.current = heartRateActive
    publishWearableLive({
      connected: watchIsConnected(),
      heartRateActive: trackingRef.current,
    })
  }, [])

  const flush = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (sessionId == null || flushingRef.current || bufferRef.current.length === 0) return
    flushingRef.current = true
    const batch = bufferRef.current.splice(0)
    const result = await insertRef.current(batch.map((sample) => ({ ...sample, sessionId })))
    flushingRef.current = false
    if (result.error) {
      bufferRef.current = [...batch, ...bufferRef.current]
      return
    }
    if (bufferRef.current.length > 0) void flush()
  }, [])

  const record = useCallback((payload: Record<string, unknown>) => {
    const sample = readSample(payload)
    if (sample == null) return
    const at = sample.recordedAt.getTime()
    if (seenRef.current.has(at)) return
    seenRef.current.add(at)
    bufferRef.current.push(sample)
    setBpm(sample.bpm)
    publish(true)
    void flush()
  }, [flush, publish])

  const attach = useCallback((sessionId: number) => {
    sessionIdRef.current = sessionId
    void flush()
  }, [flush])

  useEffect(() => {
    if (!enabled || !WatchConnectivity.isSupported) return
    let cancelled = false
    const subscriptions = [
      WatchConnectivity.addMessageListener((event) => record(event.message)),
      WatchConnectivity.addUserInfoListener((event) => record(event.userInfo)),
      WatchConnectivity.addReachabilityListener(() => publish()),
    ]
    void (async () => {
      const activated = await ensureWatchSession()
      if (cancelled || !activated) return
      publish(false)
      tellWatch('startSession')
    })()
    return () => {
      cancelled = true
      subscriptions.forEach((subscription) => subscription.remove())
      tellWatch('stopSession')
      trackingRef.current = false
      publishWearableLive({ connected: watchIsConnected(), heartRateActive: false })
    }
  }, [enabled, publish, record])

  return { attach, bpm }
}
