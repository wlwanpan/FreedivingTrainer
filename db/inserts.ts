import { SQLiteRunResult } from 'expo-sqlite'
import { SQLClient } from './client'
import * as schema from './schema'
import { BaselineTestInsert, HeartRateSampleInsert, SessionInsert, SettingInsert } from './schema'


export async function sqlInsertSettings(db: SQLClient, setting: SettingInsert): Promise<SQLiteRunResult> {
  return db.insert(schema.settings).values({
    ...setting,
    id: undefined,
  }).run()
}

export async function sqlInsertBaselineTest(
  db: SQLClient,
  test: BaselineTestInsert,
): Promise<SQLiteRunResult> {
  return db.insert(schema.baselineTests).values(test).run()
}

export async function sqlInsertSession(db: SQLClient, session: SessionInsert): Promise<SQLiteRunResult> {
  return db.insert(schema.sessions).values(session).run()
}

export async function sqlInsertHeartRates(
  db: SQLClient,
  samples: HeartRateSampleInsert[],
): Promise<void> {
  if (samples.length === 0) return
  await db.insert(schema.heartRateSamples).values(samples).run()
}
