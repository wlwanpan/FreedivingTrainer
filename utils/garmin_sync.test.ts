import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseWatchMessage, slimNextSession, type NextSessionMessage } from '../companion/src/protocol'
import { Setting } from '../db/schema'
import { englishTranslate } from '../i18n/translate'
import { readWatchCompletion } from './watch_completion'
import { buildWatchContext } from './watch_context'

const settings = {
  id: 1,
  dateFormat: 'YYYY-MM-DD',
  language: 'en',
  breatheUpSeconds: 60,
  trainingAnimation: true,
  trainingHaptic: true,
  trainingSound: true,
  trainingGesturesSeen: true,
  safetyRuleDismissed: false,
  co2HoldSeconds: 90,
  co2RestStartSeconds: 120,
  co2RestStepSeconds: 15,
  co2Rounds: 8,
  o2HoldStartSeconds: 60,
  o2HoldStepSeconds: 15,
  o2RestSeconds: 120,
  o2Rounds: 8,
  baselineMaxHoldSeconds: 90,
  baselineContractionSeconds: null,
  baselineTestedAt: null,
  trainingPlan: 'beginner',
  trainingPlanStartedAt: new Date(1),
  customPlan: null,
  wearable: 'garmin',
  watchSyncedAt: null,
  updatedAt: new Date(1),
  createdAt: new Date(1),
} satisfies Setting

describe('garmin companion protocol', () => {
  it('promotes Connect IQ seconds so readWatchCompletion can save a Garmin table', () => {
    const parsed = parseWatchMessage({
      type: 'sessionComplete',
      tableType: 'co2',
      holdSeconds: 90,
      restSeconds: 120,
      roundsCompleted: 8,
      roundsPlanned: 8,
      startedAt: 1_700_000_000,
      completedAt: 1_700_000_100,
      source: 'watch',
      watchDetail: 'garmin',
      heartRates: [{ bpm: 68, at: 1_700_000_050 }],
      week: 1,
      sessionIndex: 1,
      planKey: 'beginner:1:',
    })
    assert.ok(parsed)
    assert.equal(parsed.type, 'sessionComplete')
    const completed = readWatchCompletion(parsed, 'beginner:1:')
    assert.ok(completed)
    assert.equal(completed.watchDetail, 'garmin')
    assert.equal(completed.completedAt, 1_700_000_100_000)
    assert.equal(completed.startedAt, 1_700_000_000_000)
    assert.equal(completed.planWeek, 1)
    assert.equal(completed.heartRates[0]?.bpm, 68)
  })

  it('sends the current session without the weekly Apple Watch schedule', () => {
    const context = buildWatchContext({
      settings,
      sessionsCount: 4,
      planKey: 'beginner:1:',
      sync: '',
      syncedAt: [1_700_000_100_000],
      language: 'en',
      t: englishTranslate,
      outline: {
        planName: 'Beginner',
        level: '',
        frequency: '',
        weeks: 6,
        week: 1,
        weekComplete: false,
        progress: 0,
        retestDue: false,
        schedule: [{
          week: 1,
          current: true,
          locked: false,
          sessions: [{
            index: 1,
            name: 'CO2 1',
            kind: 'co2',
            tableType: 'co2',
            holdSeconds: 90,
            holdStepSeconds: 0,
            restStartSeconds: 120,
            restStepSeconds: 15,
            rounds: 8,
            note: '',
            completed: false,
          }],
        }],
      },
      next: {
        index: 1,
        name: 'Week 1 · CO2',
        kind: 'co2',
        tableType: 'co2',
        holdSeconds: 90,
        holdStepSeconds: 0,
        restStartSeconds: 120,
        restStepSeconds: 15,
        rounds: 8,
        note: '',
        completed: false,
        week: 1,
      },
      phoneTraining: null,
      freeLimitReached: false,
    })
    assert.equal('schedule' in context, true)
    const payload = slimNextSession(context as NextSessionMessage)
    assert.equal(payload.type, 'nextSession')
    assert.equal('schedule' in payload, false)
    assert.equal(payload.tableType, 'co2')
    assert.deepEqual(payload.syncedAt, [1_700_000_100])
  })
})
