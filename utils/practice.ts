export const Practices = ['freediver', 'mermaid'] as const

export type Practice = (typeof Practices)[number]

export type SafetyNotice = {
  key: string
  alert?: boolean
}

export type SafetySurface = 'plan' | 'static' | 'walk' | 'distance'

export function practiceFromValue(value: string | null | undefined): Practice {
  return value === 'mermaid' ? 'mermaid' : 'freediver'
}

export function practiceNotices(practice: Practice, surface: SafetySurface): SafetyNotice[] {
  if (practice !== 'mermaid') return []
  const calm: SafetyNotice[] = [
    { key: 'plan.mermaid.notCardio' },
    { key: 'plan.mermaid.noHyperventilation' },
  ]
  if (surface === 'plan') return calm
  if (surface === 'static') return [...calm, { key: 'plan.mermaid.eyesClosed' }]
  if (surface === 'walk') return [...calm, { key: 'plan.mermaid.softSurface' }]
  return [
    ...calm,
    { key: 'plan.mermaid.softSurface' },
    { key: 'plan.mermaid.spotter', alert: true },
  ]
}

export function sessionSurface(session: { openHold?: boolean; kind: string }): SafetySurface {
  if (session.openHold === true || session.kind === 'distance') return 'distance'
  if (session.kind === 'walk') return 'walk'
  return 'static'
}
