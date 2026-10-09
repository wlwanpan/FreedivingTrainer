import { ErrorTitles } from '@/constants/errors'
import { TableType } from '@/constants/tables'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import { todayDate } from '@/utils/date'
import { buildCo2Table, TableRound } from '@/utils/table'
import { useEffect, useRef, useState } from 'react'
import { AppState, Vibration } from 'react-native'
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
  restStartSeconds: number
  restStepSeconds: number
  rounds: number
}

type Location = {
  index: number
  remaining: number
  done: boolean
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

export default function useTrainingClock(tableType: TableType | null, table: TrainTable | null = null) {
  const sql = useSQLContext()
  const { showWarning } = useWarningModal()
  const plannedRounds = useTablePlan(tableType ?? 'co2')
  const rounds = tableType === 'co2' && table != null
    ? buildCo2Table({
      ...sql.settings,
      co2HoldSeconds: table.holdSeconds,
      co2RestStartSeconds: table.restStartSeconds,
      co2RestStepSeconds: table.restStepSeconds,
      co2Rounds: table.rounds,
    })
    : plannedRounds
  const phases = tableType == null
    ? []
    : buildPhases(sql.settings.breatheUpSeconds, rounds)

  const startedAtRef = useRef(Date.now())
  const pausedAtRef = useRef<number | null>(null)
  const announcedIndex = useRef(0)
  const saveStarted = useRef(false)
  const [now, setNow] = useState(startedAtRef.current)
  const [paused, setPaused] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const elapsedSeconds = Math.floor((now - startedAtRef.current) / 1000)
  const location = locate(phases, elapsedSeconds)
  const done = phases.length > 0 && location.done
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

  const togglePause = () => {
    if (done) return
    if (!paused) {
      pausedAtRef.current = Date.now()
      setPaused(true)
      return
    }
    const pausedAt = pausedAtRef.current
    if (pausedAt != null) {
      startedAtRef.current += Date.now() - pausedAt
    }
    pausedAtRef.current = null
    setNow(Date.now())
    setPaused(false)
  }

  useEffect(() => {
    if (location.index === announcedIndex.current) return
    announcedIndex.current = location.index
    Vibration.vibrate(20)
  }, [location.index])

  useEffect(() => {
    if (!done) return
    Vibration.vibrate(40)
  }, [done])

  const persist = async () => {
    if (tableType == null || saved || saving) return
    const first = rounds[0]
    if (!first) return

    setSaving(true)
    setSaveFailed(false)
    const createdAt = new Date()
    const res = await sql.insertSession({
      tableType,
      day: todayDate(),
      roundsCompleted: rounds.length,
      roundsPlanned: rounds.length,
      holdSeconds: first.holdSeconds,
      restSeconds: tableType === 'co2'
        ? table?.restStartSeconds ?? sql.settings.co2RestStartSeconds
        : sql.settings.o2RestSeconds,
      createdAt,
      updatedAt: createdAt,
    })
    setSaving(false)
    if (res.error) {
      setSaveFailed(true)
      showWarning(ErrorTitles.Sql, res.error.message)
      return
    }
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
    roundCount: rounds.length,
    previous,
    current,
    next,
    retry,
    togglePause,
  }
}
