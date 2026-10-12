import { TableType } from '@/constants/tables'
import { buildCo2Table, buildO2Table, TableRound } from '@/utils/table'


export type TrainingPlanId = 'beginner' | 'intermediate' | 'advanced'

export type TrainingPlan = {
  id: TrainingPlanId
  name: string
  level: string
  weeks: number
  frequency: string
  focus: string
  method: string
  setsO2: boolean
  retestAtWeek: number | null
  recommended: boolean
}

export const TrainingPlans: readonly TrainingPlan[] = [
  {
    id: 'beginner',
    name: '4-week plan',
    level: 'Beginner · CO2 acclimation',
    weeks: 4,
    frequency: '2–3 CO2 sessions a week',
    focus: 'Delay the urge to breathe.',
    method: 'A no-contraction table: the hold stays at your first contraction for 7 rounds, and rest steps from 2:00 to 0:30. After week 2 the hold adds 15–20 seconds.',
    setsO2: false,
    retestAtWeek: null,
    recommended: true,
  },
  {
    id: 'intermediate',
    name: '8-week plan',
    level: 'Intermediate · Hypoxic introduction',
    weeks: 8,
    frequency: '3–4 sessions a week, on separate days',
    focus: 'Keep building CO2 tolerance, and add O2 tables.',
    method: 'CO2 holds sit at 60–75% of your maximum. O2 rest stays at 2:00 while holds climb to 80%. Retake the baseline in week 4.',
    setsO2: true,
    retestAtWeek: 4,
    recommended: false,
  },
  {
    id: 'advanced',
    name: '12-week plan',
    level: 'Advanced · Lactic tolerance',
    weeks: 12,
    frequency: '4 sessions a week, with a full day off',
    focus: 'Peak adaptation, and a way through a plateau.',
    method: 'Alternate standard CO2 and O2 with one-breath tables at about 40% of your best, plus dry apnea walks.',
    setsO2: true,
    retestAtWeek: null,
    recommended: false,
  },
]

const GRID_SECONDS = 5
const MIN_HOLD_SECONDS = 15
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const BEGINNER_ROUNDS = 7
const BEGINNER_REST_START_SECONDS = 120
const BEGINNER_REST_STEP_SECONDS = 15
const ONE_BREATH_REST_SECONDS = 5
const WALK_REST_SECONDS = 90

const LegacyPlanIds: Record<string, TrainingPlanId> = {
  short: 'beginner',
  medium: 'intermediate',
  long: 'advanced',
}

export type SessionKind = 'co2' | 'o2' | 'one-breath' | 'walk'

export type WeekSession = {
  index: number
  name: string
  kind: SessionKind
  tableType: TableType
  holdSeconds: number
  holdStepSeconds: number
  restStartSeconds: number
  restStepSeconds: number
  rounds: number
  note: string
}

export function trainingPlanById(id: string | null | undefined): TrainingPlan | null {
  if (id == null) return null
  const resolved = LegacyPlanIds[id] ?? id
  return TrainingPlans.find((plan) => plan.id === resolved) ?? null
}

export function currentPlanWeek(startedAt: Date, now: Date, weeks: number): number {
  const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / WEEK_MS)
  return Math.min(weeks, Math.max(1, elapsed + 1))
}

export function baselineRetestDue(
  plan: TrainingPlan,
  startedAt: Date,
  testedAt: Date | null,
  now: Date,
): boolean {
  if (plan.retestAtWeek == null || testedAt == null) return false
  const week = currentPlanWeek(startedAt, now, plan.weeks)
  if (week < plan.retestAtWeek) return false
  const dueAt = startedAt.getTime() + (plan.retestAtWeek - 1) * WEEK_MS
  return testedAt.getTime() < dueAt
}

export function weeklySessions(input: {
  baselineMaxSeconds: number
  contractionSeconds: number | null
  plan: TrainingPlan
  week: number
}): WeekSession[] {
  const baseline = Math.max(1, Math.floor(input.baselineMaxSeconds))
  const contraction = input.contractionSeconds == null
    ? null
    : Math.min(baseline, Math.max(0, Math.floor(input.contractionSeconds)))
  const week = Math.min(input.plan.weeks, Math.max(1, input.week))

  const sessions = input.plan.id === 'beginner'
    ? [beginnerSession(baseline, contraction, week)]
    : input.plan.id === 'intermediate'
      ? intermediateSessions(baseline)
      : advancedSessions(baseline)

  return sessions.map((session, index) => ({ ...session, index: index + 1 }))
}

export function planDetail(input: {
  plan: TrainingPlan
  week: number
  contractionSeconds: number | null
  retestDue: boolean
}): string {
  const head = `${input.plan.name} · week ${input.week} of ${input.plan.weeks}. ${input.plan.frequency}.`
  if (input.plan.id === 'beginner') {
    return `${head} ${beginnerProgress(input.week, input.contractionSeconds)}`
  }
  if (input.plan.id === 'intermediate') {
    const retest = input.retestDue
      ? ' Retake the baseline this week so the intervals can move.'
      : input.week < 4
        ? ' Retake the baseline in week 4.'
        : ''
    return `${head}${retest}`
  }
  return `${head} CO2, a one-breath table, O2, and a dry apnea walk — each on its own day.`
}

export function sessionRounds(session: WeekSession): TableRound[] {
  if (session.tableType === 'o2') {
    return buildO2Table({
      co2Rounds: 1,
      co2HoldSeconds: 0,
      co2RestStartSeconds: 0,
      co2RestStepSeconds: 0,
      o2Rounds: session.rounds,
      o2HoldStartSeconds: session.holdSeconds,
      o2HoldStepSeconds: session.holdStepSeconds,
      o2RestSeconds: session.restStartSeconds,
    })
  }
  return buildCo2Table({
    co2Rounds: session.rounds,
    co2HoldSeconds: session.holdSeconds,
    co2RestStartSeconds: session.restStartSeconds,
    co2RestStepSeconds: session.restStepSeconds,
    o2Rounds: 1,
    o2HoldStartSeconds: 0,
    o2HoldStepSeconds: 0,
    o2RestSeconds: 0,
  })
}

export function beginnerBaseHold(baselineSeconds: number, contractionSeconds: number | null): number {
  if (contractionSeconds != null && usesMarkedContraction(contractionSeconds)) {
    return contractionSeconds
  }
  return Math.max(MIN_HOLD_SECONDS, Math.round(baselineSeconds * 0.5))
}

export function usesMarkedContraction(contractionSeconds: number | null): boolean {
  return contractionSeconds != null && contractionSeconds >= MIN_HOLD_SECONDS
}

function beginnerSession(
  baseline: number,
  contraction: number | null,
  week: number,
): WeekSession {
  const extra = week <= 2 ? 0 : week === 3 ? 15 : 20
  return {
    index: 1,
    name: 'CO2',
    kind: 'co2',
    tableType: 'co2',
    holdSeconds: beginnerBaseHold(baseline, contraction) + extra,
    holdStepSeconds: 0,
    restStartSeconds: BEGINNER_REST_START_SECONDS,
    restStepSeconds: BEGINNER_REST_STEP_SECONDS,
    rounds: BEGINNER_ROUNDS,
    note: beginnerProgress(week, contraction),
  }
}

function beginnerProgress(week: number, contraction: number | null): string {
  const marked = usesMarkedContraction(contraction)
  if (!marked && week <= 2) {
    return 'No contraction was marked, so the hold starts at half your maximum. Rest steps from 2:00 to 0:30.'
  }
  if (!marked && week === 3) {
    return 'No contraction was marked. The hold is 15 seconds past half your maximum.'
  }
  if (!marked) {
    return 'No contraction was marked. The hold is 20 seconds past half your maximum.'
  }
  if (week <= 2) {
    return 'No-contraction table. The hold is your first contraction, and rest steps from 2:00 to 0:30.'
  }
  if (week === 3) return 'The hold is 15 seconds past your first contraction.'
  return 'The hold is 20 seconds past your first contraction.'
}

function intermediateSessions(baseline: number): WeekSession[] {
  return [
    standardCo2(baseline, 'CO2 1'),
    o2Session(baseline, 'O2'),
    standardCo2(baseline, 'CO2 2'),
  ]
}

function advancedSessions(baseline: number): WeekSession[] {
  return [
    standardCo2(baseline, 'CO2'),
    oneBreathSession(baseline),
    o2Session(baseline, 'O2'),
    walkSession(baseline),
  ]
}

function standardCo2(baseline: number, name: string): WeekSession {
  return {
    index: 1,
    name,
    kind: 'co2',
    tableType: 'co2',
    holdSeconds: holdInBand(baseline, 0.7, 0.6, 0.75),
    holdStepSeconds: 0,
    restStartSeconds: 120,
    restStepSeconds: 15,
    rounds: 8,
    note: 'Hold stays in the 60–75% band. Rest steps down. Keep this on a different day from O2.',
  }
}

function o2Session(baseline: number, name: string): WeekSession {
  const climb = o2Climb(baseline)
  return {
    index: 1,
    name,
    kind: 'o2',
    tableType: 'o2',
    holdSeconds: climb.start,
    holdStepSeconds: climb.step,
    restStartSeconds: 120,
    restStepSeconds: 0,
    rounds: climb.rounds,
    note: 'Rest stays at 2:00. Holds climb, and the last one stays at or under 80% of your maximum.',
  }
}

function oneBreathSession(baseline: number): WeekSession {
  return {
    index: 1,
    name: 'One breath',
    kind: 'one-breath',
    tableType: 'one-breath',
    holdSeconds: Math.max(MIN_HOLD_SECONDS, snap(baseline * 0.4)),
    holdStepSeconds: 0,
    restStartSeconds: ONE_BREATH_REST_SECONDS,
    restStepSeconds: 0,
    rounds: 8,
    note: 'About 40% of your best. Take one recovery breath, then hold again.',
  }
}

function walkSession(baseline: number): WeekSession {
  return {
    index: 1,
    name: 'Dry walk',
    kind: 'walk',
    tableType: 'walk',
    holdSeconds: Math.max(MIN_HOLD_SECONDS, snap(baseline * 0.4)),
    holdStepSeconds: 0,
    restStartSeconds: WALK_REST_SECONDS,
    restStepSeconds: 0,
    rounds: 6,
    note: 'Walk during each hold. Stand still while you recover.',
  }
}

function o2Climb(maxHoldSeconds: number): { start: number; step: number; rounds: number } {
  const cap = Math.max(GRID_SECONDS, Math.floor((maxHoldSeconds * 0.8) / GRID_SECONDS) * GRID_SECONDS)
  const preferredStart = Math.max(MIN_HOLD_SECONDS, snap(maxHoldSeconds * 0.4))

  for (let rounds = 8; rounds >= 3; rounds -= 1) {
    const gaps = rounds - 1
    let step = snap((cap - preferredStart) / gaps)
    if (step < GRID_SECONDS) step = GRID_SECONDS
    let start = cap - step * gaps

    if (start < MIN_HOLD_SECONDS) {
      start = Math.max(MIN_HOLD_SECONDS, Math.min(preferredStart, cap - GRID_SECONDS))
      step = Math.floor((cap - start) / gaps / GRID_SECONDS) * GRID_SECONDS
      if (step < GRID_SECONDS) continue
    }

    const end = start + step * gaps
    if (end > cap || end > maxHoldSeconds) continue
    return { start, step, rounds }
  }

  const start = MIN_HOLD_SECONDS
  const rounds = Math.max(2, Math.min(8, 1 + Math.floor(Math.max(0, cap - start) / GRID_SECONDS)))
  return { start, step: GRID_SECONDS, rounds }
}

function holdInBand(max: number, ratio: number, lowRatio: number, highRatio: number): number {
  const low = max * lowRatio
  const high = max * highRatio
  const target = max * ratio
  const snapped = snap(Math.min(high, Math.max(low, target)))
  if (snapped >= low && snapped <= high) return Math.max(GRID_SECONDS, snapped)

  const options = [Math.floor(target / GRID_SECONDS) * GRID_SECONDS, Math.ceil(target / GRID_SECONDS) * GRID_SECONDS]
    .filter((value, index, list) => value >= low && value <= high && list.indexOf(value) === index)
  if (options.length === 0) return Math.max(GRID_SECONDS, snapped)
  options.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
  return options[0]
}

function snap(value: number): number {
  return Math.round(value / GRID_SECONDS) * GRID_SECONDS
}
