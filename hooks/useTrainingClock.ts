import { TableType } from '@/constants/tables'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import {
  canLogContraction,
  contractionOffset,
  ContractionTap,
  LoggedContraction,
  serializeContractions,
} from '@/utils/contractions'
import { todayDate } from '@/utils/date'
import { buildCo2Table, buildO2Table, TableRound } from '@/utils/table'
import { playTrainingHaptic } from '@/utils/training_haptic'
import { playTrainingSound } from '@/utils/training_sound'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { publishPhoneTraining } from './phoneTraining'
import { recordCompletedSession } from './recordCompletedSession'
import useSessionHeartRate from './useSessionHeartRate'
import useTablePlan from './useTablePlan'


export type TrainPhaseKind = 'breathe' | 'hold' | 'rest'

export type TrainStep = {
  index: number
  kind: TrainPhaseKind
  seconds: number
  roundIndex: number | null
}

type TrainPhase = {
  kind: TrainPhaseKind
  seconds: number
  roundIndex: number | null
}

export type TrainTable = {
  holdSeconds: number
  holdStepSeconds: number
  restStartSeconds: number
  restStepSeconds: number
  rounds: number
}

export type TrainPlanSlot = {
  week: number
  index: number
}

type Location = {
  index: number
  remaining: number
  done: boolean
}

function roundsFromTable(tableType: TableType, table: TrainTable): TableRound[] {
  if (tableType === 'o2') {
    return buildO2Table({
      co2Rounds: 1,
      co2HoldSeconds: 0,
      co2RestStartSeconds: 0,
      co2RestStepSeconds: 0,
      o2Rounds: table.rounds,
      o2HoldStartSeconds: table.holdSeconds,
      o2HoldStepSeconds: table.holdStepSeconds,
      o2RestSeconds: table.restStartSeconds,
    })
  }
  return buildCo2Table({
    co2Rounds: table.rounds,
    co2HoldSeconds: table.holdSeconds,
    co2RestStartSeconds: table.restStartSeconds,
    co2RestStepSeconds: table.restStepSeconds,
    o2Rounds: 1,
    o2HoldStartSeconds: 0,
    o2HoldStepSeconds: 0,
    o2RestSeconds: 0,
  })
}

function buildPhases(breatheUpSeconds: number, rounds: TableRound[]): TrainPhase[] {
  const phases: TrainPhase[] = []
  if (breatheUpSeconds > 0) {
    phases.push({ kind: 'breathe', seconds: breatheUpSeconds, roundIndex: null })
  }
  for (const round of rounds) {
    if (round.holdSeconds > 0) {
      phases.push({ kind: 'hold', seconds: round.holdSeconds, roundIndex: round.index })
    }
    if (round.restSeconds > 0) {
      phases.push({ kind: 'rest', seconds: round.restSeconds, roundIndex: round.index })
    }
  }
  return phases
}

function locate(phases: TrainPhase[], elapsedSeconds: number): Location {
  let cursor = elapsedSeconds
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index]
    if (cursor < phase.seconds) {
      return { index, remaining: phase.seconds - cursor, done: false }
    }
    cursor -= phase.seconds
  }
  return { index: Math.max(0, phases.length - 1), remaining: 0, done: true }
}

export default function useTrainingClock(
  tableType: TableType | null,
  table: TrainTable | null = null,
  slot: TrainPlanSlot | null = null,
  name = '',
) {
  const sql = useSQLContext()
  const { t } = useI18n()
  const { showWarning } = useWarningModal()
  const plannedRounds = useTablePlan(tableType ?? 'co2')
  const rounds = table != null && tableType != null
    ? roundsFromTable(tableType, table)
    : plannedRounds
  const phases = tableType == null
    ? []
    : buildPhases(sql.settings.breatheUpSeconds, rounds)

  const wallStartedAtRef = useRef(Date.now())
  const startedAtRef = useRef(wallStartedAtRef.current)
  const intro = sql.updatedAt != null && !sql.settings.trainingGesturesSeen
  const pausedAtRef = useRef<number | null>(intro ? startedAtRef.current : null)
  const announcedIndex = useRef(0)
  const hapticRef = useRef(sql.settings.trainingHaptic)
  hapticRef.current = sql.settings.trainingHaptic
  const soundRef = useRef(sql.settings.trainingSound)
  soundRef.current = sql.settings.trainingSound
  const saveStarted = useRef(false)
  const [now, setNow] = useState(startedAtRef.current)
  const [paused, setPaused] = useState(intro)
  const [contractions, setContractions] = useState<LoggedContraction[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const elapsedSeconds = Math.floor((now - startedAtRef.current) / 1000)
  const location = locate(phases, elapsedSeconds)
  const totalSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0)
  const elapsedTotalSeconds = Math.min(totalSeconds, Math.max(0, elapsedSeconds))
  const done = phases.length > 0 && location.done
  const heartRate = useSessionHeartRate(tableType != null && !done)
  const stepAt = (index: number): TrainStep | null => {
    const phase = phases[index]
    if (!phase) return null
    return {
      index,
      kind: phase.kind,
      seconds: phase.seconds,
      roundIndex: phase.roundIndex,
    }
  }
  const previous = done
    ? stepAt(location.index)
    : location.index > 0
      ? stepAt(location.index - 1)
      : null
  const current = done ? null : stepAt(location.index)
  const next = done ? null : stepAt(location.index + 1)

  useEffect(() => {
    if (done || paused || phases.length === 0) return
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 200)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick()
    })
    return () => {
      clearInterval(id)
      sub.remove()
    }
  }, [done, paused, phases.length])

  const doneRef = useRef(done)
  const pausedRef = useRef(paused)
  const kindRef = useRef(current?.kind ?? null)
  const roundRef = useRef(current?.roundIndex ?? null)
  const phaseSecondsRef = useRef(current?.seconds ?? 0)
  const remainingRef = useRef(location.remaining)
  const contractionsRef = useRef(contractions)
  const touchRef = useRef<{
    at: number
    kind: TrainPhaseKind | null
    roundIndex: number | null
    phaseSeconds: number
    remaining: number
    paused: boolean
    done: boolean
  } | null>(null)
  doneRef.current = done
  pausedRef.current = paused
  kindRef.current = current?.kind ?? null
  roundRef.current = current?.roundIndex ?? null
  phaseSecondsRef.current = current?.seconds ?? 0
  remainingRef.current = location.remaining
  contractionsRef.current = contractions

  const togglePause = () => {
    if (doneRef.current) return
    if (!pausedRef.current) {
      pausedAtRef.current = Date.now()
      pausedRef.current = true
      setPaused(true)
      return
    }
    const pausedAt = pausedAtRef.current
    if (pausedAt != null) {
      startedAtRef.current += Date.now() - pausedAt
    }
    pausedAtRef.current = null
    pausedRef.current = false
    setNow(Date.now())
    setPaused(false)
  }

  const rememberTap = useCallback(() => {
    touchRef.current = {
      at: Date.now(),
      kind: kindRef.current,
      roundIndex: roundRef.current,
      phaseSeconds: phaseSecondsRef.current,
      remaining: remainingRef.current,
      paused: pausedRef.current,
      done: doneRef.current,
    }
  }, [])

  const logContraction = useCallback((): ContractionTap => {
    const touch = touchRef.current
    const sample = touch != null ? touch : {
      kind: kindRef.current,
      roundIndex: roundRef.current,
      phaseSeconds: phaseSecondsRef.current,
      remaining: remainingRef.current,
      paused: pausedRef.current,
      done: doneRef.current,
    }
    const decision = canLogContraction({
      done: sample.done,
      paused: sample.paused,
      kind: sample.kind,
    })
    if (decision !== 'log') return { kind: decision }
    const roundIndex = sample.roundIndex
    if (roundIndex == null) return { kind: 'ignore' }
    const offsetSeconds = contractionOffset(sample.phaseSeconds, sample.remaining)
    setContractions((currentItems) => [...currentItems, { roundIndex, offsetSeconds }])
    playTrainingHaptic(hapticRef.current, 'tap')
    return { kind: 'logged', offsetSeconds }
  }, [])

  useEffect(() => {
    if (tableType == null || saved) {
      publishPhoneTraining(null)
      return
    }
    publishPhoneTraining({
      running: true,
      paused,
      name,
      phase: current?.kind ?? '',
      startedAt: wallStartedAtRef.current,
    })
  }, [tableType, saved, paused, name, current?.kind])

  useEffect(() => () => publishPhoneTraining(null), [])

  useEffect(() => {
    if (location.index === announcedIndex.current) return
    announcedIndex.current = location.index
    playTrainingHaptic(hapticRef.current, 'step')
    playTrainingSound(soundRef.current)
  }, [location.index])

  useEffect(() => {
    if (!done) return
    playTrainingHaptic(hapticRef.current, 'done')
    playTrainingSound(soundRef.current)
  }, [done])

  const persist = async () => {
    if (tableType == null || saved || saving) return
    const first = rounds[0]
    if (!first) return

    setSaving(true)
    setSaveFailed(false)
    const createdAt = new Date()
    const res = await recordCompletedSession({
      tableType,
      day: todayDate(),
      roundsCompleted: rounds.length,
      roundsPlanned: rounds.length,
      holdSeconds: first.holdSeconds,
      restSeconds: table?.restStartSeconds
        ?? (tableType === 'o2' ? sql.settings.o2RestSeconds : sql.settings.co2RestStartSeconds),
      contractions: serializeContractions(contractionsRef.current),
      planWeek: slot?.week ?? null,
      planSession: slot?.index ?? null,
      startedAt: new Date(wallStartedAtRef.current),
      source: 'phone',
      createdAt,
      updatedAt: createdAt,
    }, sql.settings.trainingPlanStartedAt)
    setSaving(false)
    if (res.error) {
      setSaveFailed(true)
      showWarning(t('errors.sql'), res.error.message)
      return
    }
    if (res.insertionID != null) heartRate.attach(res.insertionID)
    setSaved(true)
  }

  const persistRef = useRef(persist)
  persistRef.current = persist

  useEffect(() => {
    if (!done || saveStarted.current) return
    saveStarted.current = true
    void persistRef.current()
  }, [done])

  const retry = () => {
    if (!saveFailed || saving) return
    void persist()
  }

  return {
    ready: phases.length > 0,
    paused,
    done,
    saving,
    saved,
    saveFailed,
    remainingSeconds: location.remaining,
    elapsedTotalSeconds,
    totalSeconds,
    stepCount: phases.length,
    roundCount: rounds.length,
    heartRateBpm: heartRate.bpm,
    previous,
    current,
    next,
    contractions,
    retry,
    togglePause,
    rememberTap,
    logContraction,
  }
}
