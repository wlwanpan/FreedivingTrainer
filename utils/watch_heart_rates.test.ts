import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HeartRateSample, Session } from '@/db/schema'
import { attachCompletionHeartRates, resolveWatchSessionId } from './watch_heart_rates'

const session = (overrides: Partial<Session> & Pick<Session, 'id' | 'createdAt'>): Session => ({
  tableType: 'co2',
  day: '2026-10-15',
  roundsCompleted: 8,
  roundsPlanned: 8,
  holdSeconds: 90,
  restSeconds: 120,
  contractions: null,
  planWeek: null,
  planSession: null,
  startedAt: null,
  source: 'watch',
  watchDetail: 'ios',
  steps: null,
  updatedAt: overrides.createdAt,
  ...overrides,
})

describe('resolveWatchSessionId', () => {
  it('matches a watch session by completed-at second', () => {
    const createdAt = new Date(1_700_000_100_123)
    const id = resolveWatchSessionId({
      completedAt: 1_700_000_100_456,
      tableType: 'co2',
      holdSeconds: 90,
      restSeconds: 120,
      roundsCompleted: 8,
      planWeek: null,
      planSession: null,
    }, [session({ id: 3, createdAt })])
    assert.equal(id, 3)
  })
})

describe('attachCompletionHeartRates', () => {
  it('inserts samples when the session was already saved as a duplicate', async () => {
    const createdAt = new Date(1_700_000_100_000)
    const recordedAt = new Date(1_700_000_050_000)
    let inserted: { sessionId: number; bpm: number }[] = []
    const result = await attachCompletionHeartRates({
      completed: {
        completedAt: createdAt.getTime(),
        tableType: 'co2',
        holdSeconds: 90,
        restSeconds: 120,
        roundsCompleted: 8,
        planWeek: null,
        planSession: null,
        heartRates: [{ bpm: 72, recordedAt }],
      },
      sessions: [session({ id: 9, createdAt })],
      existingSamples: [],
      insertHeartRates: async (samples) => {
        inserted = samples.map((sample) => ({ sessionId: sample.sessionId, bpm: sample.bpm }))
        return {}
      },
    })
    assert.equal(result.error, undefined)
    assert.deepEqual(inserted, [{ sessionId: 9, bpm: 72 }])
  })

  it('skips samples that are already stored', async () => {
    const createdAt = new Date(1_700_000_100_000)
    const recordedAt = new Date(1_700_000_050_000)
    const existing: HeartRateSample[] = [{
      id: 1,
      sessionId: 9,
      bpm: 72,
      recordedAt,
    }]
    let calls = 0
    await attachCompletionHeartRates({
      completed: {
        completedAt: createdAt.getTime(),
        tableType: 'co2',
        holdSeconds: 90,
        restSeconds: 120,
        roundsCompleted: 8,
        planWeek: null,
        planSession: null,
        heartRates: [{ bpm: 72, recordedAt }],
      },
      sessions: [session({ id: 9, createdAt })],
      existingSamples: existing,
      insertHeartRates: async () => {
        calls += 1
        return {}
      },
    })
    assert.equal(calls, 0)
  })
})
