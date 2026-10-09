import { ErrorTitles } from '@/constants/errors'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import {
  BaselinePlan,
  generateTablesFromBaseline,
  MIN_BASELINE_SECONDS,
  tableSettingsFromPlan,
} from '@/utils/baseline'
import { TrainingPlanId, trainingPlanById, weeklyCo2Tables } from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { AppState, Vibration } from 'react-native'


export type BaselineStage = 'prep' | 'hold' | 'result' | 'plan'

export type BaselineOutcome = {
  maxHoldSeconds: number
  contractionSeconds: number | null
  tooShort: boolean
  plan: BaselinePlan | null
}

const CONTROL_DELAY_MS = 400

export default function useBaselineTest(finishToHome: boolean) {
  const sql = useSQLContext()
  const router = useRouter()
  const { showWarning } = useWarningModal()
  const [stage, setStage] = useState<BaselineStage>('prep')
  const [now, setNow] = useState(() => Date.now())
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [contractionAt, setContractionAt] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<BaselineOutcome | null>(null)
  const [saving, setSaving] = useState(false)
  const [entering, setEntering] = useState(false)

  const startedAtRef = useRef<number | null>(null)
  const contractionAtRef = useRef<number | null>(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (stage !== 'hold') return
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 200)
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') tick()
    })
    return () => {
      clearInterval(id)
      sub.remove()
    }
  }, [stage])

  const createdAtMs = sql.settings.createdAt?.getTime() ?? null

  useEffect(() => {
    if (!entering || createdAtMs == null) return
    router.replace('/')
  }, [entering, createdAtMs, router])

  const elapsedSeconds = startedAt == null ? 0 : Math.floor((now - startedAt) / 1000)
  const contractionSeconds = startedAt == null || contractionAt == null
    ? null
    : Math.max(0, Math.floor((contractionAt - startedAt) / 1000))
  const controlsReady = startedAt != null && now - startedAt >= CONTROL_DELAY_MS

  const start = () => {
    const t = Date.now()
    finishedRef.current = false
    startedAtRef.current = t
    contractionAtRef.current = null
    setStartedAt(t)
    setContractionAt(null)
    setOutcome(null)
    setNow(t)
    setStage('hold')
  }

  const markContraction = () => {
    const started = startedAtRef.current
    if (started == null || finishedRef.current) return
    if (Date.now() - started < CONTROL_DELAY_MS) return
    if (contractionAtRef.current != null) {
      contractionAtRef.current = null
      setContractionAt(null)
      return
    }
    const t = Date.now()
    contractionAtRef.current = t
    setContractionAt(t)
    Vibration.vibrate(20)
  }

  const finish = () => {
    const started = startedAtRef.current
    if (started == null || finishedRef.current) return
    if (Date.now() - started < CONTROL_DELAY_MS) return
    finishedRef.current = true
    const ended = Date.now()
    const maxHoldSeconds = Math.max(1, Math.floor((ended - started) / 1000))
    const marked = contractionAtRef.current == null
      ? null
      : Math.min(maxHoldSeconds, Math.max(0, Math.floor((contractionAtRef.current - started) / 1000)))
    const tooShort = maxHoldSeconds < MIN_BASELINE_SECONDS
    setNow(ended)
    setOutcome({
      maxHoldSeconds,
      contractionSeconds: marked,
      tooShort,
      plan: tooShort ? null : generateTablesFromBaseline({
        maxHoldSeconds,
        contractionSeconds: marked,
      }),
    })
    setStage(tooShort ? 'result' : 'plan')
    Vibration.vibrate(40)
  }

  const reset = () => {
    finishedRef.current = false
    startedAtRef.current = null
    contractionAtRef.current = null
    setStartedAt(null)
    setContractionAt(null)
    setOutcome(null)
    setStage('prep')
  }

  const showPlan = () => {
    if (outcome?.plan == null) return
    setStage('plan')
  }

  const save = async (planId: TrainingPlanId) => {
    if (saving || outcome?.plan == null) return
    const plan = trainingPlanById(planId)
    const weekTables = plan == null
      ? []
      : weeklyCo2Tables({
        baselineMaxSeconds: outcome.maxHoldSeconds,
        contractionSeconds: outcome.contractionSeconds,
        plan,
        week: 1,
      })
    const storedTable = weekTables.find((table) => table.name === 'Full table') ?? weekTables[0]
    if (plan == null || storedTable == null) return
    setSaving(true)
    const nowDate = new Date()
    const res = await sql.updateSettings({
      ...sql.settings,
      ...tableSettingsFromPlan(outcome.plan),
      co2HoldSeconds: storedTable.holdSeconds,
      co2RestStartSeconds: storedTable.restStartSeconds,
      co2RestStepSeconds: storedTable.restStepSeconds,
      co2Rounds: storedTable.rounds,
      baselineMaxHoldSeconds: outcome.maxHoldSeconds,
      baselineContractionSeconds: outcome.contractionSeconds,
      baselineTestedAt: nowDate,
      trainingPlan: plan.id,
      trainingPlanStartedAt: nowDate,
      createdAt: sql.settings.createdAt ?? nowDate,
      updatedAt: nowDate,
    })
    if (res.error) {
      setSaving(false)
      showWarning(ErrorTitles.Sql, res.error.message)
      return
    }
    if (finishToHome) {
      setEntering(true)
      return
    }
    router.back()
  }

  return {
    stage,
    elapsedSeconds,
    contractionSeconds,
    controlsReady,
    outcome,
    saving,
    start,
    markContraction,
    finish,
    cancel: reset,
    retake: reset,
    showPlan,
    save,
  }
}
