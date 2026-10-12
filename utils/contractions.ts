type PhaseKind = 'breathe' | 'hold' | 'rest'

export type LoggedContraction = {
  roundIndex: number
  offsetSeconds: number
}

export type ContractionTap =
  | { kind: 'logged'; offsetSeconds: number }
  | { kind: 'hold-only' }
  | { kind: 'ignore' }

type StoredContraction = {
  round: number
  at: number
}

export function canLogContraction(input: {
  done: boolean
  paused: boolean
  kind: PhaseKind | null
}): 'log' | 'hold-only' | 'ignore' {
  if (input.done || input.paused || input.kind == null) return 'ignore'
  if (input.kind !== 'hold') return 'hold-only'
  return 'log'
}

export function contractionOffset(phaseSeconds: number, remainingSeconds: number): number {
  const elapsed = phaseSeconds - remainingSeconds
  if (!Number.isFinite(elapsed)) return 0
  return Math.max(0, Math.min(phaseSeconds, Math.floor(elapsed)))
}

export function contractionLabel(count: number): string {
  return count === 1 ? '1 contraction' : `${count} contractions`
}

export function contractionsInRound(
  items: LoggedContraction[],
  roundIndex: number | null,
  kind: PhaseKind | null,
): number {
  if (kind !== 'hold' || roundIndex == null) return 0
  return items.reduce((count, item) => count + (item.roundIndex === roundIndex ? 1 : 0), 0)
}

export function sessionResultNote(count: number, saveFailed: boolean): string {
  const lead = count > 0 ? `${contractionLabel(count)} logged. ` : ''
  const tail = saveFailed
    ? 'The session did not save.'
    : 'This session is saved on this device.'
  return `${lead}${tail}`
}

export function serializeContractions(items: LoggedContraction[]): string | null {
  if (items.length === 0) return null
  const stored: StoredContraction[] = items.map((item) => ({
    round: item.roundIndex,
    at: item.offsetSeconds,
  }))
  return JSON.stringify(stored)
}

export function parseContractions(raw: string | null | undefined): LoggedContraction[] {
  if (raw == null || raw === '') return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap((item) => {
    if (item == null || typeof item !== 'object') return []
    const round = (item as { round?: unknown }).round
    const at = (item as { at?: unknown }).at
    if (typeof round !== 'number' || typeof at !== 'number') return []
    if (!Number.isInteger(round) || !Number.isInteger(at) || round < 1 || at < 0) return []
    return [{ roundIndex: round, offsetSeconds: at }]
  })
}
