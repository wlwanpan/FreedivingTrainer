import { DefaultDateFormat } from '@/constants/dates'
import { SQLClient } from '@/db'
import { drizzleDb } from '@/db/client'
import { sqlDeleteSession, sqlEraseAllData } from '@/db/deletions'
import { sqlInsertBaselineTest, sqlInsertHeartRates, sqlInsertSession, sqlInsertSettings } from '@/db/inserts'
import { sqlAllSessions, sqlBaselineTests, sqlFirstSettings, sqlHeartRateSamples } from '@/db/queries'
import { BaselineTest, BaselineTestInsert, HeartRateSample, HeartRateSampleInsert, Session, SessionInsert, Setting, SettingInsert } from '@/db/schema'
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
  language: null,
  breatheUpSeconds: 60,
  trainingAnimation: true,
  trainingHaptic: true,
  trainingSound: true,
  trainingGesturesSeen: false,
  safetyRuleDismissed: false,
  co2HoldSeconds: 90,
  co2RestStartSeconds: 120,
  co2RestStepSeconds: 15,
  co2Rounds: 8,
  o2HoldStartSeconds: 60,
  o2HoldStepSeconds: 15,
  o2RestSeconds: 120,
  o2Rounds: 8,
  baselineMaxHoldSeconds: null,
  baselineContractionSeconds: null,
  baselineTestedAt: null,
  trainingPlan: null,
  trainingPlanStartedAt: null,
  customPlan: null,
  wearable: null,
  watchSyncedAt: null,
  createdAt: null,
  updatedAt: null,
}

export interface ISQLContext {
  drizzleDb: SQLClient
  updatedAt?: Date
  settings: Setting
  sessions: Session[]
  baselineTests: BaselineTest[]
  heartRates: HeartRateSample[]
  updateSettings: (setting: SettingInsert) => Promise<InsertionResults>
  insertBaselineTest: (test: BaselineTestInsert) => Promise<InsertionResults>
  insertSession: (session: SessionInsert) => Promise<InsertionResults>
  insertHeartRates: (samples: HeartRateSampleInsert[]) => Promise<BaseResults>
  deleteSession: (id: number) => Promise<DeleteResults>
  eraseAllData: () => Promise<DeleteResults>
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

  const { data: baselineTests, error: baselineTestsErr } = useLiveQuery(sqlBaselineTests(drizzleDb))
  const { data: heartRates, error: heartRatesErr } = useLiveQuery(sqlHeartRateSamples(drizzleDb))
  if (baselineTestsErr) {
    console.error('Error fetching baseline tests:', baselineTestsErr)
  }
  if (heartRatesErr) {
    console.error('Error fetching heart rates:', heartRatesErr)
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

  const insertBaselineTest = async (test: BaselineTestInsert): Promise<InsertionResults> => {
    try {
      const res = await sqlInsertBaselineTest(drizzleDb, test)
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

  const insertHeartRates = async (samples: HeartRateSampleInsert[]): Promise<BaseResults> => {
    try {
      await sqlInsertHeartRates(drizzleDb, samples)
      return { error: undefined }
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

  const eraseAllData = async (): Promise<DeleteResults> => {
    try {
      await sqlEraseAllData(drizzleDb)
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
      baselineTests: baselineTests ?? [],
      heartRates: heartRates ?? [],
      updateSettings,
      insertBaselineTest,
      insertSession,
      insertHeartRates,
      deleteSession,
      eraseAllData,
    }}>
      {children}
    </SQLContext.Provider>
  )
}
