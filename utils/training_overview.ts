import { BaselineTest, Session, Setting } from '@/db/schema'


export type TrainingOverview = {
  trainedDays: number
  totalApneaSeconds: number
  bestApneaSeconds: number | null
  bestContractionSeconds: number | null
}

function recordedHolds(tests: BaselineTest[], settings: Setting): { hold: number; contraction: number | null }[] {
  if (tests.length > 0) {
    return tests.map((test) => ({
      hold: test.maxHoldSeconds,
      contraction: test.contractionSeconds,
    }))
  }
  if (settings.baselineMaxHoldSeconds == null) {
    return []
  }
  return [{
    hold: settings.baselineMaxHoldSeconds,
    contraction: settings.baselineContractionSeconds,
  }]
}

export function trainingOverview(
  sessions: Session[],
  tests: BaselineTest[],
  settings: Setting,
): TrainingOverview {
  const holds = recordedHolds(tests, settings)
  const contractions = holds
    .map((hold) => hold.contraction)
    .filter((seconds): seconds is number => seconds != null)
  const apneaTimes = [
    ...sessions.map((session) => session.holdSeconds),
    ...holds.map((hold) => hold.hold),
  ]

  return {
    trainedDays: new Set(sessions.map((session) => session.day)).size,
    totalApneaSeconds: sessions.reduce(
      (total, session) => total + session.holdSeconds * session.roundsCompleted,
      0,
    ),
    bestApneaSeconds: apneaTimes.length === 0 ? null : Math.max(...apneaTimes),
    bestContractionSeconds: contractions.length === 0 ? null : Math.max(...contractions),
  }
}
