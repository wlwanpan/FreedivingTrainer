import { SessionSource, SessionSources, WatchDetail, WatchDetails } from '@/constants/sessions'
import { TableType, TableTypes } from '@/constants/tables'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'


export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateFormat: text('date_format').notNull().default('YYYY-MM-DD'),
  breatheUpSeconds: integer('breathe_up_seconds').notNull().default(60),
  trainingAnimation: integer('training_animation', { mode: 'boolean' }).notNull().default(true),
  trainingGesturesSeen: integer('training_gestures_seen', { mode: 'boolean' }).notNull().default(false),
  co2HoldSeconds: integer('co2_hold_seconds').notNull().default(90),
  co2RestStartSeconds: integer('co2_rest_start_seconds').notNull().default(120),
  co2RestStepSeconds: integer('co2_rest_step_seconds').notNull().default(15),
  co2Rounds: integer('co2_rounds').notNull().default(8),
  o2HoldStartSeconds: integer('o2_hold_start_seconds').notNull().default(60),
  o2HoldStepSeconds: integer('o2_hold_step_seconds').notNull().default(15),
  o2RestSeconds: integer('o2_rest_seconds').notNull().default(120),
  o2Rounds: integer('o2_rounds').notNull().default(8),
  baselineMaxHoldSeconds: integer('baseline_max_hold_seconds'),
  baselineContractionSeconds: integer('baseline_contraction_seconds'),
  baselineTestedAt: integer('baseline_tested_at', { mode: 'timestamp' }),
  trainingPlan: text('training_plan'),
  trainingPlanStartedAt: integer('training_plan_started_at', { mode: 'timestamp' }),
  customPlan: text('custom_plan'),
  wearable: text('wearable'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
})

export const baselineTests = sqliteTable('baseline_tests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  maxHoldSeconds: integer('max_hold_seconds').notNull(),
  contractionSeconds: integer('contraction_seconds'),
  testedAt: integer('tested_at', { mode: 'timestamp' }).notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableType: text('table_type', { enum: TableTypes }).$type<TableType>().notNull(),
  day: text('day').notNull(),
  roundsCompleted: integer('rounds_completed').notNull(),
  roundsPlanned: integer('rounds_planned').notNull(),
  holdSeconds: integer('hold_seconds').notNull(),
  restSeconds: integer('rest_seconds').notNull(),
  contractions: text('contractions'),
  planWeek: integer('plan_week'),
  planSession: integer('plan_session'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  source: text('source', { enum: SessionSources }).$type<SessionSource>().notNull().default('phone'),
  watchDetail: text('watch_detail', { enum: WatchDetails }).$type<WatchDetail>(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const heartRateSamples = sqliteTable('heart_rate_samples', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  bpm: integer('bpm').notNull(),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
})

export type Setting = typeof settings.$inferSelect
export type SettingInsert = typeof settings.$inferInsert
export type BaselineTest = typeof baselineTests.$inferSelect
export type BaselineTestInsert = typeof baselineTests.$inferInsert
export type Session = typeof sessions.$inferSelect
export type SessionInsert = typeof sessions.$inferInsert
export type HeartRateSample = typeof heartRateSamples.$inferSelect
export type HeartRateSampleInsert = typeof heartRateSamples.$inferInsert
