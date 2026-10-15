import { englishTranslate } from '@/i18n/translate'
import { Translate } from '@/i18n/types'

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
  if (input.kind !== 'hold') return 'ignore'
  return 'log'
}

export function contractionOffset(phaseSeconds: number, remainingSeconds: number): number {
  const elapsed = phaseSeconds - remainingSeconds
  if (!Number.isFinite(elapsed)) return 0
  return Math.max(0, Math.min(phaseSeconds, Math.floor(elapsed)))
}

export function contractionLabel(count: number, t: Translate = englishTranslate): string {
  return count === 1 ? t('contraction.one') : t('contraction.other', { count })
}

export function contractionsInRound(
  items: LoggedContraction[],
  roundIndex: number | null,
  kind: PhaseKind | null,
): number {
  if (kind !== 'hold' || roundIndex == null) return 0
  return items.reduce((count, item) => count + (item.roundIndex === roundIndex ? 1 : 0), 0)
}

export function sessionResultNote(
  count: number,
  saveFailed: boolean,
  t: Translate = englishTranslate,
): string {
  const lead = count > 0 ? t('contraction.lead', { label: contractionLabel(count, t) }) : ''
  const tail = saveFailed ? t('contraction.failed') : t('contraction.saved')
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

function firstContractionOffsets(items: LoggedContraction[]): number[] {
  const byRound = new Map<number, number>()
  for (const item of items) {
    const current = byRound.get(item.roundIndex)
    if (current == null || item.offsetSeconds < current) {
      byRound.set(item.roundIndex, item.offsetSeconds)
    }
  }
  return [...byRound.values()]
}

export function averageFirstContractionSeconds(
  sessions: readonly { contractions?: string | null }[],
  current: readonly LoggedContraction[] = [],
): number | null {
  const firsts = [
    ...sessions.flatMap((session) => firstContractionOffsets(parseContractions(session.contractions))),
    ...firstContractionOffsets([...current]),
  ]
  if (firsts.length === 0) return null
  return Math.round(firsts.reduce((total, seconds) => total + seconds, 0) / firsts.length)
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
