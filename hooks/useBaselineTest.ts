import { ErrorTitles } from '@/constants/errors'
import { withWatchTrainingLoss } from '@/hooks/useWearableStatus'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import {
  BaselinePlan,
  generateTablesFromBaseline,
  MIN_BASELINE_SECONDS,
  tableSettingsFromPlan,
} from '@/utils/baseline'
import {
  currentPlanWeek,
  isCurrentPlanChoice,
  PlanChoice,
  planFromChoice,
  planSwitchWarning,
  serializeCustomPlan,
  trainingPlanFromSettings,
  weeklySessions,
} from '@/utils/training_plan'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { AppState, Vibration } from 'react-native'


export type BaselineStage = 'prep' | 'hold' | 'manual' | 'result' | 'plan'

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
  const { showConfirmation, showWarning } = useWarningModal()
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

  const complete = (maxHoldSeconds: number, contractionSeconds: number | null) => {
    const hold = Math.max(1, Math.floor(maxHoldSeconds))
    const marked = contractionSeconds == null
      ? null
      : Math.min(hold, Math.max(0, Math.floor(contractionSeconds)))
    const tooShort = hold < MIN_BASELINE_SECONDS
    setOutcome({
      maxHoldSeconds: hold,
      contractionSeconds: marked,
      tooShort,
      plan: tooShort ? null : generateTablesFromBaseline({
        maxHoldSeconds: hold,
        contractionSeconds: marked,
      }),
    })
    setStage(tooShort ? 'result' : 'plan')
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
    setNow(ended)
    complete(maxHoldSeconds, marked)
    Vibration.vibrate(40)
  }

  const submitManual = (input: { maxHoldSeconds: number; contractionSeconds: number | null }) => {
    finishedRef.current = true
    complete(input.maxHoldSeconds, input.contractionSeconds)
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

  const save = async (choice: PlanChoice) => {
    if (saving || outcome?.plan == null) return
    const plan = planFromChoice(choice)
    if (plan == null) return
    const nowDate = new Date()
    const currentPlan = trainingPlanFromSettings(sql.settings)
    const priorStart = sql.settings.trainingPlanStartedAt
    const continuing = isCurrentPlanChoice(sql.settings, choice) && priorStart != null
    if (currentPlan != null && !continuing) {
      const week = priorStart == null
        ? null
        : currentPlanWeek(priorStart, nowDate, currentPlan.weeks)
      const confirmed = await showConfirmation(
        'Change plan?',
        withWatchTrainingLoss(planSwitchWarning(currentPlan.name, week)),
      )
      if (!confirmed) return
    }
    const startedAt = continuing ? priorStart : nowDate
    const sessions = weeklySessions({
      baselineMaxSeconds: outcome.maxHoldSeconds,
      contractionSeconds: outcome.contractionSeconds,
      plan,
      week: currentPlanWeek(startedAt, nowDate, plan.weeks),
    })
    const storedTable = sessions.find((session) => session.kind === 'co2') ?? null
    const o2Table = sessions.find((session) => session.kind === 'o2') ?? null
    if (sessions.length === 0) return
    setSaving(true)
    const priorAt = sql.settings.baselineTestedAt?.getTime() ?? null
    const priorStored = priorAt != null && sql.baselineTests.some((test) => test.testedAt.getTime() === priorAt)
    if (
      sql.settings.baselineMaxHoldSeconds != null
      && sql.settings.baselineTestedAt != null
      && !priorStored
    ) {
      const prior = await sql.insertBaselineTest({
        maxHoldSeconds: sql.settings.baselineMaxHoldSeconds,
        contractionSeconds: sql.settings.baselineContractionSeconds,
        testedAt: sql.settings.baselineTestedAt,
      })
      if (prior.error) {
        setSaving(false)
        showWarning(ErrorTitles.Sql, prior.error.message)
        return
      }
    }
    const recorded = await sql.insertBaselineTest({
      maxHoldSeconds: outcome.maxHoldSeconds,
      contractionSeconds: outcome.contractionSeconds,
      testedAt: nowDate,
    })
    if (recorded.error) {
      setSaving(false)
      showWarning(ErrorTitles.Sql, recorded.error.message)
      return
    }
    const res = await sql.updateSettings({
      ...sql.settings,
      ...tableSettingsFromPlan(outcome.plan),
      ...(storedTable == null ? {} : {
        co2HoldSeconds: storedTable.holdSeconds,
        co2RestStartSeconds: storedTable.restStartSeconds,
        co2RestStepSeconds: storedTable.restStepSeconds,
        co2Rounds: storedTable.rounds,
      }),
      ...(o2Table == null ? {} : {
        o2HoldStartSeconds: o2Table.holdSeconds,
        o2HoldStepSeconds: o2Table.holdStepSeconds,
        o2RestSeconds: o2Table.restStartSeconds,
        o2Rounds: o2Table.rounds,
      }),
      baselineMaxHoldSeconds: outcome.maxHoldSeconds,
      baselineContractionSeconds: outcome.contractionSeconds,
      baselineTestedAt: nowDate,
      trainingPlan: plan.id,
      customPlan: choice.custom == null ? sql.settings.customPlan : serializeCustomPlan(choice.custom),
      trainingPlanStartedAt: startedAt,
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
    manualDefaults: {
      maxHoldSeconds: Math.max(MIN_BASELINE_SECONDS, sql.settings.baselineMaxHoldSeconds ?? 120),
      contractionSeconds: sql.settings.baselineContractionSeconds,
    },
    start,
    openManual: () => setStage('manual'),
    submitManual,
    markContraction,
    finish,
    cancel: reset,
    retake: reset,
    showPlan,
    save,
  }
}
