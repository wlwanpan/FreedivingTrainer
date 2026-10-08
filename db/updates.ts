import { eq } from 'drizzle-orm'
import { SQLiteRunResult } from 'expo-sqlite'
import { SQLClient } from './client'
import * as schema from './schema'
import { SettingInsert } from './schema'


export async function sqlUpdateSettings(
  db: SQLClient,
  setting: SettingInsert & { id: number },
): Promise<SQLiteRunResult> {
  return db.update(schema.settings).set(setting).where(eq(schema.settings.id, setting.id)).run()
}
