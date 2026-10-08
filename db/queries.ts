import { desc } from 'drizzle-orm'
import { SQLClient } from './client'
import * as schema from './schema'


export function sqlFirstSettings(db: SQLClient) {
  return db.query.settings.findFirst()
}

export function sqlAllSessions(db: SQLClient) {
  return db
    .select()
    .from(schema.sessions)
    .orderBy(desc(schema.sessions.day), desc(schema.sessions.id))
}
