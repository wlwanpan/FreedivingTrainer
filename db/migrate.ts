import { SQLiteDatabase } from 'expo-sqlite'


type MigrationBundle = {
  journal: {
    entries: { idx: number, when: number, tag: string }[]
  }
  migrations: Record<string, string>
}

function errorText(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const cause = 'cause' in error ? errorText(error.cause) : ''
    return `${error.message}\n${cause}`
  }
  return String(error)
}

function isDuplicateColumn(error: unknown): boolean {
  return errorText(error).includes('duplicate column name')
}

function statements(sqlText: string): string[] {
  return sqlText
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

/** Applies pending Drizzle migrations. A column added by repair is already present. */
export function applyMigrations(db: SQLiteDatabase, bundle: MigrationBundle) {
  db.execSync(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at numeric
  )`)
  const latest = db.getAllSync<{ created_at: number | null }>(
    'SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1',
  )
  const lastAt = Number(latest[0]?.created_at ?? 0)

  db.execSync('BEGIN')
  try {
    for (const entry of bundle.journal.entries) {
      if (entry.when <= lastAt) continue
      const key = `m${String(entry.idx).padStart(4, '0')}`
      const sqlText = bundle.migrations[key]
      if (sqlText == null) throw new Error(`Missing migration: ${entry.tag}`)
      for (const statement of statements(sqlText)) {
        try {
          db.execSync(statement)
        } catch (error) {
          if (!isDuplicateColumn(error)) throw error
        }
      }
      db.runSync(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        '',
        entry.when,
      )
    }
    db.execSync('COMMIT')
  } catch (error) {
    db.execSync('ROLLBACK')
    throw error
  }
}
