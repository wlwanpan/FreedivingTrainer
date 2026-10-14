import { BaselineTest, Session, Setting } from '@/db/schema'


export type TrainingOverview = {
  trainedDays: number
  trainedStreak: number
  totalApneaSeconds: number
  bestApneaSeconds: number | null
  bestContractionSeconds: number | null
}

const DayMs = 86_400_000

function trainedStreak(sessions: Session[]): number {
  const days = [...new Set(sessions.map((session) => session.day))].sort().reverse()
  if (days.length === 0) return 0
  let streak = 1
  for (let index = 0; index < days.length - 1; index += 1) {
    const newer = new Date(`${days[index]}T00:00:00`).getTime()
    const older = new Date(`${days[index + 1]}T00:00:00`).getTime()
    if (newer - older !== DayMs) break
    streak += 1
  }
  return streak
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
    trainedStreak: trainedStreak(sessions),
    totalApneaSeconds: sessions.reduce(
      (total, session) => total + session.holdSeconds * session.roundsCompleted,
      0,
    ),
    bestApneaSeconds: apneaTimes.length === 0 ? null : Math.max(...apneaTimes),
    bestContractionSeconds: contractions.length === 0 ? null : Math.max(...contractions),
  }
}
