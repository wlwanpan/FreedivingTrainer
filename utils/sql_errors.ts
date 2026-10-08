const TABLE_DISPLAY_NAMES: Record<string, string> = {
  settings: 'settings',
  sessions: 'session',
}

const UNIQUE_CONSTRAINT_RE = /UNIQUE constraint failed:\s*(\w+)\.(\w+)/

export function parseSQLiteError(message: string): string | null {
  const match = message.match(UNIQUE_CONSTRAINT_RE)
  if (!match) {
    return null
  }
  const [, tableName, fieldName] = match
  const displayName = TABLE_DISPLAY_NAMES[tableName] ?? tableName
  return `A ${displayName} with the same ${fieldName.replace(/_/g, ' ')} already exists.`
}
