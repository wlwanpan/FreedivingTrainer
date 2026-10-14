import { eq } from 'drizzle-orm'
import { drizzleDb } from '@/db/client'
import * as schema from '@/db/schema'
import { SessionInsert } from '@/db/schema'
import { InsertionResults } from '@/providers/types'
import { parseSQLiteError } from '@/utils/sql_errors'
import { completionDecision } from '@/utils/training_plan'


export type RecordedCompletion = InsertionResults & {
  skipped?: boolean
}

function failure(error: unknown): RecordedCompletion {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)
  return { error: new Error(parseSQLiteError(raw) ?? raw) }
}

export async function recordCompletedSession(
  session: SessionInsert,
  planStartedAt: Date | null,
): Promise<RecordedCompletion> {
  try {
    let skipped = false
    let insertionID: number | undefined
    await drizzleDb.transaction(async (tx) => {
      const logged = await tx.select({
        id: schema.sessions.id,
        planWeek: schema.sessions.planWeek,
        planSession: schema.sessions.planSession,
        createdAt: schema.sessions.createdAt,
      }).from(schema.sessions)
      if (session.source === 'watch') {
        // createdAt is stored in whole seconds, so a replay matches that second.
        const completedSecond = Math.floor(session.createdAt.getTime() / 1000)
        const replay = logged.some((item) => (
          Math.floor(item.createdAt.getTime() / 1000) === completedSecond
        ))
        if (replay) {
          skipped = true
          return
        }
      }
      const startedMs = planStartedAt?.getTime() ?? 0
      const sameSlot = session.planWeek == null || session.planSession == null
        ? []
        : logged.filter((item) => (
          item.planWeek === session.planWeek
          && item.planSession === session.planSession
          && item.createdAt.getTime() >= startedMs
        ))
      const decision = completionDecision(sameSlot, session.createdAt.getTime())
      if (!decision.insert) {
        skipped = true
        return
      }
      const inserted = await tx.insert(schema.sessions).values(session).run()
      insertionID = Number(inserted.lastInsertRowId)
      for (const id of decision.removeIds) {
        await tx.delete(schema.heartRateSamples)
          .where(eq(schema.heartRateSamples.sessionId, id))
          .run()
        await tx.delete(schema.sessions).where(eq(schema.sessions.id, id)).run()
      }
    })
    if (skipped) return { skipped: true }
    return { insertionID }
  } catch (error) {
    return failure(error)
  }
}
