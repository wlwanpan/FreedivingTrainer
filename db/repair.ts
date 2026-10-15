import { SQLiteDatabase } from 'expo-sqlite'


function hasColumn(db: SQLiteDatabase, table: string, column: string): boolean {
  const rows = db.getAllSync(`PRAGMA table_info(${table})`) as { name: string }[]
  return rows.some((row) => row.name === column)
}

function ensureColumn(
  db: SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
) {
  if (hasColumn(db, table, column)) return
  db.execSync(`ALTER TABLE ${table} ADD ${column} ${definition}`)
}

/** Idempotent columns that may exist before Drizzle records the matching migration. */
export function repairSettingsSchema(db: SQLiteDatabase) {
  ensureColumn(db, 'settings', 'safety_rule_dismissed', 'integer DEFAULT false NOT NULL')
  ensureColumn(db, 'settings', 'training_sound', 'integer DEFAULT true NOT NULL')
}
