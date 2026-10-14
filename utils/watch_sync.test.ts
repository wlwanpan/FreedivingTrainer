import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatSyncClock,
  initialWatchSyncState,
  reduceWatchSync,
  syncStatusLabel,
  WatchSyncState,
} from './watch_sync'

const now = new Date(2026, 5, 2, 15, 41).getTime()

function snapshot(
  state: WatchSyncState,
  pendingCount: number,
  at: number,
  running = false,
) {
  return reduceWatchSync(state, {
    type: 'snapshot',
    now: at,
    reachable: true,
    payload: {
      type: 'watchTraining',
      running,
      updatedAt: at,
      pendingCount,
    },
  })
}

describe('reduceWatchSync', () => {
  it('treats a fresh watch context as training', () => {
    const result = snapshot(initialWatchSyncState, 0, now, true)
    assert.equal(result.state.watchRunning, true)
    assert.equal(result.stamp, null)
  })

  it('ignores a stale watch context while the watch is reachable', () => {
    const result = reduceWatchSync(initialWatchSyncState, {
      type: 'snapshot',
      now,
      reachable: true,
      payload: {
        type: 'watchTraining',
        running: true,
        updatedAt: now - 46_000,
        pendingCount: 0,
      },
    })
    assert.equal(result.state.watchRunning, false)
  })

  it('acks a replayed completion without inserting', () => {
    const completedAt = 1_700_000_100_456
    const stored = Math.floor(completedAt / 1000) * 1000
    const result = reduceWatchSync(initialWatchSyncState, {
      type: 'completion',
      completedAt,
      savedCreatedAt: [stored],
    })
    assert.equal(result.ack, true)
    assert.equal(result.insert, false)
    assert.equal(result.stamp, null)
  })

  it('inserts a completion the phone has not stored', () => {
    const result = reduceWatchSync(initialWatchSyncState, {
      type: 'completion',
      completedAt: 1_700_000_100_456,
      savedCreatedAt: [1_700_000_099_000],
    })
    assert.equal(result.ack, false)
    assert.equal(result.insert, true)
  })

  it('advances sync time only when the watch queue is empty', () => {
    const published = reduceWatchSync(initialWatchSyncState, {
      type: 'published',
      now,
      reachable: true,
    })
    const waiting = snapshot(published.state, 2, now)
    assert.equal(waiting.stamp, null)
    assert.equal(waiting.state.syncedAt, null)

    const done = snapshot(waiting.state, 0, now + 5)
    assert.equal(done.stamp, now + 5)
    assert.equal(done.state.syncedAt, now + 5)

    const again = snapshot(done.state, 0, now + 20)
    assert.equal(again.stamp, null)
    assert.equal(again.state.syncedAt, now + 5)
  })

  it('waits for a fresh queue count after reconnecting', () => {
    const published = reduceWatchSync(initialWatchSyncState, {
      type: 'published',
      now,
      reachable: true,
    })
    const synced = snapshot(published.state, 0, now)
    assert.equal(synced.stamp, now)
    const offline = reduceWatchSync(synced.state, {
      type: 'reachability',
      reachable: false,
      now: now + 1,
    })
    const online = reduceWatchSync(offline.state, {
      type: 'reachability',
      reachable: true,
      now: now + 2,
    })
    assert.equal(online.stamp, null)
    assert.equal(online.state.pendingCount, null)
    const waiting = snapshot(online.state, 1, now + 3)
    const republished = reduceWatchSync(waiting.state, {
      type: 'published',
      now: now + 4,
      reachable: true,
    })
    assert.equal(republished.stamp, null)
    const done = snapshot(republished.state, 0, now + 5)
    assert.equal(done.stamp, now + 5)
  })
})

describe('syncStatusLabel', () => {
  it('describes syncing, a finished sync, and the last sync', () => {
    assert.equal(syncStatusLabel({
      paired: true,
      reachable: true,
      pendingCount: 2,
      contextPublished: true,
      syncedAt: now,
      now,
    }), 'Syncing…')
    assert.equal(syncStatusLabel({
      paired: true,
      reachable: true,
      pendingCount: 0,
      contextPublished: true,
      syncedAt: now,
      now,
    }), 'Synced 3:41 PM')
    assert.equal(syncStatusLabel({
      paired: true,
      reachable: false,
      pendingCount: null,
      contextPublished: false,
      syncedAt: new Date(2026, 5, 1, 15, 41).getTime(),
      now,
    }), 'Last sync Yesterday 3:41 PM')
    assert.equal(syncStatusLabel({
      paired: true,
      reachable: false,
      pendingCount: null,
      contextPublished: false,
      syncedAt: null,
      now,
    }), 'Not synced yet')
    assert.equal(syncStatusLabel({
      paired: false,
      reachable: false,
      pendingCount: null,
      contextPublished: false,
      syncedAt: null,
      now,
    }), null)
  })

  it('formats an older sync with the month', () => {
    assert.equal(formatSyncClock(new Date(2026, 4, 2, 9, 5).getTime(), now), 'May 2, 9:05 AM')
  })
})
