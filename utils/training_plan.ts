import { generateTablesFromBaseline } from './baseline'


export type TrainingPlanId = 'short' | 'medium' | 'long'

export type TrainingPlan = {
  id: TrainingPlanId
  name: string
  weeks: number
  tablesPerWeek: 2 | 3
  gainRatio: number
  minimumGainSeconds: number
  recommended: boolean
}

export const TrainingPlans: readonly TrainingPlan[] = [
  {
    id: 'short',
    name: 'Short',
    weeks: 4,
    tablesPerWeek: 2,
    gainRatio: 0.1,
    minimumGainSeconds: 5,
    recommended: false,
  },
  {
    id: 'medium',
    name: 'Medium',
    weeks: 8,
    tablesPerWeek: 3,
    gainRatio: 0.2,
    minimumGainSeconds: 10,
    recommended: false,
  },
  {
    id: 'long',
    name: 'Long-term',
    weeks: 12,
    tablesPerWeek: 3,
    gainRatio: 0.35,
    minimumGainSeconds: 15,
    recommended: true,
  },
]

const GRID_SECONDS = 5
const MIN_REST_SECONDS = 15
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type HoldProjection = {
  projectedSeconds: number
  gainSeconds: number
}

export type WeekTable = {
  index: number
  name: string
  holdSeconds: number
  restStartSeconds: number
  restStepSeconds: number
  rounds: number
}

export function trainingPlanById(id: string | null | undefined): TrainingPlan | null {
  return TrainingPlans.find((plan) => plan.id === id) ?? null
}

function snap(value: number): number {
  return Math.round(value / GRID_SECONDS) * GRID_SECONDS
}

export function projectHold(baselineSeconds: number, plan: TrainingPlan): HoldProjection {
  const baseline = Math.max(1, Math.floor(baselineSeconds))
  const projectedSeconds = Math.max(
    snap(baseline * (1 + plan.gainRatio)),
    baseline + plan.minimumGainSeconds,
  )
  return { projectedSeconds, gainSeconds: projectedSeconds - baseline }
}

export function currentPlanWeek(startedAt: Date, now: Date, weeks: number): number {
  const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / WEEK_MS)
  return Math.min(weeks, Math.max(1, elapsed + 1))
}

function workingMax(baseline: number, projected: number, week: number, weeks: number): number {
  const clampedWeek = Math.min(weeks, Math.max(1, week))
  return baseline + (projected - baseline) * (clampedWeek / weeks)
}

export function weeklyCo2Tables(input: {
  baselineMaxSeconds: number
  contractionSeconds: number | null
  plan: TrainingPlan
  week: number
}): WeekTable[] {
  const baseline = Math.max(1, Math.floor(input.baselineMaxSeconds))
  const projection = projectHold(baseline, input.plan)
  const working = Math.max(
    baseline,
    Math.round(workingMax(baseline, projection.projectedSeconds, input.week, input.plan.weeks)),
  )
  const contraction = input.contractionSeconds == null
    ? null
    : Math.min(working, Math.max(0, Math.round(working * (input.contractionSeconds / baseline))))
  const generated = generateTablesFromBaseline({
    maxHoldSeconds: working,
    contractionSeconds: contraction,
  })
  const full: WeekTable = {
    index: 1,
    name: 'Full table',
    holdSeconds: generated.co2HoldSeconds,
    restStartSeconds: generated.co2RestStartSeconds,
    restStepSeconds: generated.co2RestStepSeconds,
    rounds: generated.co2Rounds,
  }
  const shortRounds = Math.max(4, full.rounds - 3)
  const shortTable: WeekTable = { ...full, name: 'Short table', rounds: shortRounds }
  const push = pushedHold(full, working)

  const tables = input.plan.tablesPerWeek === 3
    ? [shortTable, full, push ?? midTable(full, shortRounds)]
    : [full, push ?? shortTable]

  return tables.map((table, index) => ({ ...table, index: index + 1 }))
}

function pushedHold(full: WeekTable, workingSeconds: number): WeekTable | null {
  const holdSeconds = full.holdSeconds + GRID_SECONDS
  const cap = Math.floor(workingSeconds * 0.65)
  if (holdSeconds > cap || holdSeconds >= workingSeconds) return null
  if (lastRest(full.restStartSeconds, full.restStepSeconds, full.rounds) < MIN_REST_SECONDS) return null
  return { ...full, name: 'Longer hold', holdSeconds }
}

function midTable(full: WeekTable, shortRounds: number): WeekTable {
  const rounds = Math.min(full.rounds - 1, Math.max(shortRounds + 1, full.rounds - 2))
  return { ...full, name: 'Middle table', rounds }
}

function lastRest(start: number, step: number, rounds: number): number {
  return start - step * Math.max(0, rounds - 1)
}
