import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readWatchCompletion } from './watch_completion'
import { watchTablesFromSettings } from './watch_tables'

const tables = watchTablesFromSettings({
  breatheUpSeconds: 60,
  co2Rounds: 8,
  co2HoldSeconds: 90,
  co2RestStartSeconds: 120,
  co2RestStepSeconds: 15,
  o2Rounds: 8,
  o2HoldStartSeconds: 60,
  o2HoldStepSeconds: 15,
  o2RestSeconds: 120,
})

describe('readWatchCompletion', () => {
  it('records a finished watch CO2 table without a plan slot', () => {
    const completed = readWatchCompletion({
      type: 'sessionComplete',
      tableType: tables.co2.tableType,
      holdSeconds: tables.co2.holdSeconds,
      restSeconds: tables.co2.restSeconds,
      roundsCompleted: tables.co2.rounds.length,
      roundsPlanned: tables.co2.rounds.length,
      startedAt: 1_700_000_000_000,
      completedAt: 1_700_000_100_000,
      heartRates: [{ bpm: 68, at: 1_700_000_050_000 }],
    }, 'beginner:1:')

    assert.ok(completed)
    assert.equal(completed.tableType, 'co2')
    assert.equal(completed.holdSeconds, 90)
    assert.equal(completed.restSeconds, 120)
    assert.equal(completed.roundsCompleted, 8)
    assert.equal(completed.planWeek, null)
    assert.equal(completed.planSession, null)
    assert.equal(completed.heartRates[0]?.bpm, 68)
  })

  it('records a finished watch O2 table without a plan slot', () => {
    const completed = readWatchCompletion({
      type: 'sessionComplete',
      tableType: tables.o2.tableType,
      holdSeconds: tables.o2.holdSeconds,
      restSeconds: tables.o2.restSeconds,
      roundsCompleted: tables.o2.rounds.length,
      roundsPlanned: tables.o2.rounds.length,
      startedAt: 1_700_000_000_000,
      completedAt: 1_700_000_200_000,
    }, 'beginner:1:')

    assert.ok(completed)
    assert.equal(completed.tableType, 'o2')
    assert.equal(completed.holdSeconds, 60)
    assert.equal(completed.restSeconds, 120)
    assert.equal(completed.planWeek, null)
    assert.equal(completed.planSession, null)
  })
})
