import { DefaultDateFormat } from '@/constants/dates'
import { SQLClient } from '@/db'
import { drizzleDb } from '@/db/client'
import { sqlDeleteSession } from '@/db/deletions'
import { sqlInsertSession, sqlInsertSettings } from '@/db/inserts'
import { sqlAllSessions, sqlFirstSettings } from '@/db/queries'
import { Session, SessionInsert, Setting, SettingInsert } from '@/db/schema'
import { sqlUpdateSettings } from '@/db/updates'
import { parseSQLiteError } from '@/utils/sql_errors'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { createContext, ReactNode, useContext } from 'react'
import { BaseResults, DeleteResults, InsertionResults } from './types'


type Props = {
  children: ReactNode
}

function handleException(e: unknown): BaseResults {
  const raw = e instanceof Error ? e.message : typeof e === 'string' ? e : String(e)
  const friendly = parseSQLiteError(raw)
  return { error: new Error(friendly ?? raw) }
}

export const DefaultSettings: Setting = {
  id: 0,
  dateFormat: DefaultDateFormat,
  breatheUpSeconds: 120,
  co2HoldSeconds: 90,
  co2RestStartSeconds: 120,
  co2RestStepSeconds: 15,
  co2Rounds: 8,
  o2HoldStartSeconds: 60,
  o2HoldStepSeconds: 15,
  o2RestSeconds: 120,
  o2Rounds: 8,
  createdAt: null,
  updatedAt: null,
}

export interface ISQLContext {
  drizzleDb: SQLClient
  updatedAt?: Date
  settings: Setting
  sessions: Session[]
  updateSettings: (setting: SettingInsert) => Promise<InsertionResults>
  insertSession: (session: SessionInsert) => Promise<InsertionResults>
  deleteSession: (id: number) => Promise<DeleteResults>
}

export const SQLContext = createContext<ISQLContext | null>(null)

export const useSQLContext = () => {
  const context = useContext(SQLContext)
  if (!context) {
    throw new Error('SQLContext is not provided to component')
  }
  return context
}

export default function SQLContextProvider({ children }: Props) {
  const { data: settings, error: settingsErr, updatedAt } = useLiveQuery(sqlFirstSettings(drizzleDb))
  if (settingsErr) {
    console.error('Error fetching settings:', settingsErr)
  }

  const { data: sessions, error: sessionsErr } = useLiveQuery(sqlAllSessions(drizzleDb))
  if (sessionsErr) {
    console.error('Error fetching sessions:', sessionsErr)
  }

  const updateSettings = async (setting: SettingInsert): Promise<InsertionResults> => {
    try {
      const res = !setting.id
        ? await sqlInsertSettings(drizzleDb, setting)
        : await sqlUpdateSettings(drizzleDb, { ...setting, id: setting.id })
      return { insertionID: res.lastInsertRowId }
    } catch (e) {
      return handleException(e)
    }
  }

  const insertSession = async (session: SessionInsert): Promise<InsertionResults> => {
    try {
      const res = await sqlInsertSession(drizzleDb, session)
      return { insertionID: res.lastInsertRowId }
    } catch (e) {
      return handleException(e)
    }
  }

  const deleteSession = async (id: number): Promise<DeleteResults> => {
    try {
      await sqlDeleteSession(drizzleDb, id)
      return { error: undefined }
    } catch (e) {
      return handleException(e)
    }
  }

  return (
    <SQLContext.Provider value={{
      drizzleDb,
      updatedAt,
      settings: settings ?? DefaultSettings,
      sessions: sessions ?? [],
      updateSettings,
      insertSession,
      deleteSession,
    }}>
      {children}
    </SQLContext.Provider>
  )
}
