import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite'
import * as schema from './schema'


export const DATABASE_NAME = 'freediving'

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true })

expoDb.execSync('PRAGMA journal_mode=WAL')
expoDb.execSync('PRAGMA busy_timeout=10000')

export { expoDb }

export type SQLClient = ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLiteDatabase
}

export const drizzleDb = drizzle(expoDb, { schema }) as SQLClient
