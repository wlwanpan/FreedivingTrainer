import { HeartRateSample, Session } from '@/db/schema'
import { recordCompletedSession } from '@/hooks/recordCompletedSession'
import { attachCompletionHeartRates } from '@/utils/watch_heart_rates'
import { dayStamp, readWatchCompletion } from '@/utils/watch_completion'
import { completionAlreadySaved } from '@/utils/watch_sync'


export async function ingestWatchCompletion(input: {
  payload: Record<string, unknown>
  planKey: string
  planStartedAt: Date | null
  sessions: Session[]
  heartRates: HeartRateSample[]
  savedCompletions: Set<number>
  rememberSync: (completedAt: number) => void
  insertHeartRates: Parameters<typeof attachCompletionHeartRates>[0]['insertHeartRates']
  warn: (description: string) => void
}): Promise<{ saved: boolean; completedAt: number | null; watchDetail: string | null }> {
  const completed = readWatchCompletion(input.payload, input.planKey)
  if (completed == null) return { saved: false, completedAt: null, watchDetail: null }

  const persistHeartRates = async (sessionId?: number) => {
    const rates = await attachCompletionHeartRates({
      completed,
      sessions: input.sessions,
      existingSamples: input.heartRates,
      insertHeartRates: input.insertHeartRates,
      sessionId,
    })
    if (rates.error) input.warn(rates.error.message)
  }

  const duplicate = completionAlreadySaved(
    input.sessions.map((session) => session.createdAt.getTime()),
    completed.completedAt,
  )
    || input.savedCompletions.has(completed.completedAt)
    || (completed.planWeek == null && input.sessions.some((session) => (
      session.tableType === completed.tableType
      && session.holdSeconds === completed.holdSeconds
      && session.roundsCompleted === completed.roundsCompleted
      && Math.abs(session.createdAt.getTime() - completed.completedAt) < 2000
    )))

  if (duplicate) {
    input.savedCompletions.add(completed.completedAt)
    input.rememberSync(completed.completedAt)
    await persistHeartRates()
    return { saved: true, completedAt: completed.completedAt, watchDetail: completed.watchDetail }
  }

  input.savedCompletions.add(completed.completedAt)
  const createdAt = new Date(completed.completedAt)
  const result = await recordCompletedSession({
    tableType: completed.tableType,
    day: dayStamp(createdAt),
    roundsCompleted: completed.roundsCompleted,
    roundsPlanned: completed.roundsPlanned,
    holdSeconds: completed.holdSeconds,
    restSeconds: completed.restSeconds,
    planWeek: completed.planWeek,
    planSession: completed.planSession,
    startedAt: completed.startedAt == null ? null : new Date(completed.startedAt),
    source: 'watch',
    watchDetail: completed.watchDetail,
    createdAt,
    updatedAt: createdAt,
  }, input.planStartedAt)

  if (result.skipped) {
    input.rememberSync(completed.completedAt)
    await persistHeartRates()
    return { saved: true, completedAt: completed.completedAt, watchDetail: completed.watchDetail }
  }
  if (result.insertionID == null) {
    input.savedCompletions.delete(completed.completedAt)
    if (result.error) input.warn(result.error.message)
    return { saved: false, completedAt: completed.completedAt, watchDetail: completed.watchDetail }
  }
  input.rememberSync(completed.completedAt)
  if (result.error) input.warn(result.error.message)
  await persistHeartRates(result.insertionID)
  return { saved: true, completedAt: completed.completedAt, watchDetail: completed.watchDetail }
}
