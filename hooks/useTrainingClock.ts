import { ErrorTitles } from '@/constants/errors'
import { TableType } from '@/constants/tables'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import { todayDate } from '@/utils/date'
import { TableRound } from '@/utils/table'
import { useEffect, useRef, useState } from 'react'
import { AppState, Vibration } from 'react-native'
import useTablePlan from './useTablePlan'


export type TrainPhaseKind = 'breathe' | 'hold' | 'rest'

type TrainPhase = {
  kind: TrainPhaseKind
  seconds: number
  roundIndex: number | null
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

export default function useTrainingClock(tableType: TableType | null) {
  const sql = useSQLContext()
  const { showWarning } = useWarningModal()
  const rounds = useTablePlan(tableType ?? 'co2')
  const phases = tableType == null
    ? []
    : buildPhases(sql.settings.breatheUpSeconds, rounds)

  const startedAtRef = useRef(Date.now())
  const announcedIndex = useRef(0)
  const saveStarted = useRef(false)
  const [now, setNow] = useState(startedAtRef.current)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const elapsedSeconds = Math.floor((now - startedAtRef.current) / 1000)
  const location = locate(phases, elapsedSeconds)
  const phase = phases[location.index] ?? null
  const done = phases.length > 0 && location.done
  const next = done ? null : phases[location.index + 1] ?? null

  useEffect(() => {
    if (done || phases.length === 0) return
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 200)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick()
    })
    return () => {
      clearInterval(id)
      sub.remove()
    }
  }, [done, phases.length])

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
        ? sql.settings.co2RestStartSeconds
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
    done,
    saving,
    saved,
    saveFailed,
    kind: phase?.kind ?? 'breathe',
    remainingSeconds: location.remaining,
    roundIndex: phase?.roundIndex ?? null,
    roundCount: rounds.length,
    nextKind: next?.kind ?? null,
    nextSeconds: next?.seconds ?? null,
    retry,
  }
}
