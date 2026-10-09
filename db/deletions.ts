import { eq, sql } from 'drizzle-orm'
import { SQLiteRunResult } from 'expo-sqlite'
import { SQLClient } from './client'
import * as schema from './schema'


export async function sqlDeleteSession(db: SQLClient, id: number): Promise<SQLiteRunResult> {
  return db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run()
}

export async function sqlEraseAllData(db: SQLClient): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(schema.sessions).where(sql`1 = 1`).run()
    await tx.delete(schema.settings).where(sql`1 = 1`).run()
  })
}
