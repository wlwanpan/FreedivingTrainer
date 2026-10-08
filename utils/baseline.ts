const GRID_SECONDS = 5
const TABLE_ROUNDS = 8
const MIN_TABLE_ROUNDS = 3
const MIN_HOLD_SECONDS = 15
const MIN_REST_SECONDS = 15
const MIN_OPENING_REST_SECONDS = 90
const O2_REST_FLOOR_SECONDS = 120

/** Shortest maximum that can size a CO2 hold inside the 50–60% band. */
export const MIN_BASELINE_SECONDS = 30

export type Co2HoldReason = 'contraction' | 'below-band' | 'above-band' | 'midpoint'

export type BaselineInput = {
  maxHoldSeconds: number
  contractionSeconds: number | null
}

export type BaselinePlan = {
  co2HoldSeconds: number
  co2RestStartSeconds: number
  co2RestStepSeconds: number
  co2Rounds: number
  o2HoldStartSeconds: number
  o2HoldStepSeconds: number
  o2RestSeconds: number
  o2Rounds: number
  co2HoldReason: Co2HoldReason
}

export type TableSettingsUpdate = Omit<BaselinePlan, 'co2HoldReason'>

function snap(value: number, grid = GRID_SECONDS): number {
  return Math.round(value / grid) * grid
}

function holdOnGrid(target: number, low: number, high: number): number {
  const clamped = Math.min(high, Math.max(low, target))
  const snapped = snap(clamped)
  if (snapped >= low && snapped <= high) return snapped

  const options = [Math.floor(clamped / GRID_SECONDS) * GRID_SECONDS, Math.ceil(clamped / GRID_SECONDS) * GRID_SECONDS]
    .filter((value, index, list) => value >= low && value <= high && list.indexOf(value) === index)
  if (options.length === 0) return Math.max(GRID_SECONDS, snapped)

  options.sort((a, b) => Math.abs(a - clamped) - Math.abs(b - clamped))
  return options[0]
}

function co2Hold(maxHoldSeconds: number, contractionSeconds: number | null): { seconds: number; reason: Co2HoldReason } {
  const low = maxHoldSeconds * 0.5
  const high = maxHoldSeconds * 0.6
  if (contractionSeconds == null) {
    return { seconds: holdOnGrid((low + high) / 2, low, high), reason: 'midpoint' }
  }
  if (contractionSeconds < low) {
    return { seconds: holdOnGrid(low, low, high), reason: 'below-band' }
  }
  if (contractionSeconds > high) {
    return { seconds: holdOnGrid(high, low, high), reason: 'above-band' }
  }
  return { seconds: holdOnGrid(contractionSeconds, low, high), reason: 'contraction' }
}

function co2Rest(maxHoldSeconds: number): { start: number; step: number } {
  const gaps = TABLE_ROUNDS - 1
  const start = Math.max(MIN_OPENING_REST_SECONDS, snap(maxHoldSeconds))
  const targetLast = Math.max(MIN_REST_SECONDS, snap(start * 0.2))
  let step = snap((start - targetLast) / gaps)
  if (step < GRID_SECONDS) step = GRID_SECONDS
  if (start - step * gaps < MIN_REST_SECONDS) {
    step = Math.max(GRID_SECONDS, Math.floor((start - MIN_REST_SECONDS) / gaps / GRID_SECONDS) * GRID_SECONDS)
  }
  while (start - step * gaps < MIN_REST_SECONDS && step > GRID_SECONDS) {
    step -= GRID_SECONDS
  }
  return { start, step }
}

function o2Table(maxHoldSeconds: number): Pick<BaselinePlan, 'o2HoldStartSeconds' | 'o2HoldStepSeconds' | 'o2RestSeconds' | 'o2Rounds'> {
  const o2RestSeconds = Math.max(O2_REST_FLOOR_SECONDS, snap(maxHoldSeconds * 0.5, 15))
  const endLimit = Math.floor((maxHoldSeconds * 0.85) / GRID_SECONDS) * GRID_SECONDS
  let end = Math.min(snap(maxHoldSeconds * 0.8), endLimit)
  end = Math.min(end, Math.floor(maxHoldSeconds / GRID_SECONDS) * GRID_SECONDS)
  end = Math.max(end, MIN_HOLD_SECONDS)

  const preferredStart = Math.max(MIN_HOLD_SECONDS, snap(maxHoldSeconds * 0.4))

  for (let rounds = TABLE_ROUNDS; rounds >= MIN_TABLE_ROUNDS; rounds -= 1) {
    const gaps = rounds - 1
    let step = snap((end - preferredStart) / gaps)
    if (step < GRID_SECONDS) step = GRID_SECONDS
    let start = end - step * gaps

    if (start < MIN_HOLD_SECONDS) {
      start = Math.max(MIN_HOLD_SECONDS, Math.min(preferredStart, end - GRID_SECONDS))
      step = Math.floor((end - start) / gaps / GRID_SECONDS) * GRID_SECONDS
      if (step < GRID_SECONDS) continue
    }

    const producedEnd = start + step * gaps
    if (producedEnd > maxHoldSeconds || producedEnd > endLimit) continue

    return {
      o2HoldStartSeconds: start,
      o2HoldStepSeconds: step,
      o2RestSeconds,
      o2Rounds: rounds,
    }
  }

  const start = MIN_HOLD_SECONDS
  const room = Math.max(GRID_SECONDS, end - start)
  const rounds = Math.max(2, Math.min(TABLE_ROUNDS, 1 + Math.floor(room / GRID_SECONDS)))
  return {
    o2HoldStartSeconds: start,
    o2HoldStepSeconds: GRID_SECONDS,
    o2RestSeconds,
    o2Rounds: rounds,
  }
}

/**
 * Sizes CO2 and O2 tables from one maximum static.
 * The CO2 hold stays inside 50–60% of that maximum (the contraction time, when it lands there).
 * CO2 rests open at the maximum hold and step down each round.
 * O2 holds climb from about 40% toward 80%, with a fixed recovery rest.
 */
export function generateTablesFromBaseline(input: BaselineInput): BaselinePlan {
  const maxHoldSeconds = Math.max(1, Math.floor(input.maxHoldSeconds))
  const contractionSeconds = input.contractionSeconds == null
    ? null
    : Math.min(maxHoldSeconds, Math.max(0, Math.floor(input.contractionSeconds)))

  const hold = co2Hold(maxHoldSeconds, contractionSeconds)
  const rest = co2Rest(maxHoldSeconds)
  const o2 = o2Table(maxHoldSeconds)

  return {
    co2HoldSeconds: hold.seconds,
    co2RestStartSeconds: rest.start,
    co2RestStepSeconds: rest.step,
    co2Rounds: TABLE_ROUNDS,
    co2HoldReason: hold.reason,
    ...o2,
  }
}

export function tableSettingsFromPlan(plan: BaselinePlan): TableSettingsUpdate {
  return {
    co2HoldSeconds: plan.co2HoldSeconds,
    co2RestStartSeconds: plan.co2RestStartSeconds,
    co2RestStepSeconds: plan.co2RestStepSeconds,
    co2Rounds: plan.co2Rounds,
    o2HoldStartSeconds: plan.o2HoldStartSeconds,
    o2HoldStepSeconds: plan.o2HoldStepSeconds,
    o2RestSeconds: plan.o2RestSeconds,
    o2Rounds: plan.o2Rounds,
  }
}
