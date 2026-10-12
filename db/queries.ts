import { asc, desc } from 'drizzle-orm'
import { SQLClient } from './client'
import * as schema from './schema'


export function sqlFirstSettings(db: SQLClient) {
  return db.query.settings.findFirst()
}

export function sqlBaselineTests(db: SQLClient) {
  return db
    .select()
    .from(schema.baselineTests)
    .orderBy(asc(schema.baselineTests.testedAt), asc(schema.baselineTests.id))
}

export function sqlHeartRateSamples(db: SQLClient) {
  return db
    .select()
    .from(schema.heartRateSamples)
    .orderBy(asc(schema.heartRateSamples.recordedAt), asc(schema.heartRateSamples.id))
}

export function sqlAllSessions(db: SQLClient) {
  return db
    .select()
    .from(schema.sessions)
    .orderBy(desc(schema.sessions.day), desc(schema.sessions.id))
}
