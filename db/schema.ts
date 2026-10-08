import { TableType, TableTypes } from '@/constants/tables'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'


export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateFormat: text('date_format').notNull().default('YYYY-MM-DD'),
  breatheUpSeconds: integer('breathe_up_seconds').notNull().default(120),
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
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
})

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableType: text('table_type', { enum: TableTypes }).$type<TableType>().notNull(),
  day: text('day').notNull(),
  roundsCompleted: integer('rounds_completed').notNull(),
  roundsPlanned: integer('rounds_planned').notNull(),
  holdSeconds: integer('hold_seconds').notNull(),
  restSeconds: integer('rest_seconds').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type Setting = typeof settings.$inferSelect
export type SettingInsert = typeof settings.$inferInsert
export type Session = typeof sessions.$inferSelect
export type SessionInsert = typeof sessions.$inferInsert
