import { HeartRateSample, HeartRateSampleInsert, Session } from '@/db/schema'
import { BaseResults } from '@/providers/types'
import { WatchCompletedSession } from './watch_completion'


export function resolveWatchSessionId(
  completed: Pick<
    WatchCompletedSession,
    'completedAt' | 'tableType' | 'holdSeconds' | 'roundsCompleted' | 'planWeek' | 'planSession'
  >,
  sessions: Session[],
): number | null {
  const completedSecond = Math.floor(completed.completedAt / 1000)
  const exact = sessions.find((session) => (
    Math.floor(session.createdAt.getTime() / 1000) === completedSecond
  ))
  if (exact != null) return exact.id

  if (completed.planWeek != null && completed.planSession != null) {
    const slotted = sessions.find((session) => (
      session.planWeek === completed.planWeek
      && session.planSession === completed.planSession
      && Math.abs(session.createdAt.getTime() - completed.completedAt) < 60_000
    ))
    if (slotted != null) return slotted.id
  }

  if (completed.planWeek == null) {
    const loose = sessions.find((session) => (
      session.tableType === completed.tableType
      && session.holdSeconds === completed.holdSeconds
      && session.roundsCompleted === completed.roundsCompleted
      && Math.abs(session.createdAt.getTime() - completed.completedAt) < 2000
    ))
    if (loose != null) return loose.id
  }

  return null
}

export async function attachCompletionHeartRates(input: {
  completed: Pick<WatchCompletedSession, 'completedAt' | 'heartRates' | 'tableType' | 'holdSeconds' | 'roundsCompleted' | 'planWeek' | 'planSession'>
  sessions: Session[]
  existingSamples: HeartRateSample[]
  insertHeartRates: (samples: HeartRateSampleInsert[]) => Promise<BaseResults>
  sessionId?: number
}): Promise<BaseResults> {
  const { completed, sessions, existingSamples, insertHeartRates, sessionId } = input
  if (completed.heartRates.length === 0) return {}
  const id = sessionId ?? resolveWatchSessionId(completed, sessions)
  if (id == null) return {}

  const known = new Set(
    existingSamples
      .filter((sample) => sample.sessionId === id)
      .map((sample) => sample.recordedAt.getTime()),
  )
  const fresh = completed.heartRates.filter((sample) => !known.has(sample.recordedAt.getTime()))
  if (fresh.length === 0) return {}

  return insertHeartRates(fresh.map((sample) => ({ ...sample, sessionId: id })))
}
