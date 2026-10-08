import { eq } from 'drizzle-orm'
import { SQLiteRunResult } from 'expo-sqlite'
import { SQLClient } from './client'
import * as schema from './schema'


export async function sqlDeleteSession(db: SQLClient, id: number): Promise<SQLiteRunResult> {
  return db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run()
}
