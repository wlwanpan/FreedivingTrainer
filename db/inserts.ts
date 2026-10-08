import { SQLiteRunResult } from 'expo-sqlite'
import { SQLClient } from './client'
import * as schema from './schema'
import { SessionInsert, SettingInsert } from './schema'


export async function sqlInsertSettings(db: SQLClient, setting: SettingInsert): Promise<SQLiteRunResult> {
  return db.insert(schema.settings).values({
    ...setting,
    id: undefined,
  }).run()
}

export async function sqlInsertSession(db: SQLClient, session: SessionInsert): Promise<SQLiteRunResult> {
  return db.insert(schema.sessions).values(session).run()
}
