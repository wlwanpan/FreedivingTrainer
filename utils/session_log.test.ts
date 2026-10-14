import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { groupSessionsByPlanWeek, trainedDays } from './session_log'


function session(input: {
  id: number
  day: string
  createdAt: string
  planWeek?: number | null
}): Parameters<typeof groupSessionsByPlanWeek>[0][number] {
  const createdAt = new Date(input.createdAt)
  return {
    id: input.id,
    tableType: 'co2',
    day: input.day,
    roundsCompleted: 7,
    roundsPlanned: 7,
    holdSeconds: 60,
    restSeconds: 120,
    contractions: null,
    planWeek: input.planWeek ?? null,
    planSession: input.planWeek == null ? null : 1,
    startedAt: createdAt,
    source: 'phone',
    watchDetail: null,
    updatedAt: createdAt,
    createdAt,
  }
}

describe('trainedDays', () => {
  it('marks each calendar day that has a session', () => {
    const days = trainedDays([
      session({ id: 1, day: '2026-10-14', createdAt: '2026-10-14T10:00:00Z' }),
      session({ id: 2, day: '2026-10-14', createdAt: '2026-10-14T18:00:00Z' }),
      session({ id: 3, day: '2026-10-11', createdAt: '2026-10-11T10:00:00Z' }),
    ])
    assert.deepEqual([...days].sort(), ['2026-10-11', '2026-10-14'])
  })
})

describe('groupSessionsByPlanWeek', () => {
  it('groups current-plan weeks under the plan name, newest first', () => {
    const startedAt = new Date('2026-10-01T00:00:00Z')
    const groups = groupSessionsByPlanWeek([
      session({ id: 1, day: '2026-10-04', createdAt: '2026-10-04T12:00:00Z', planWeek: 1 }),
      session({ id: 2, day: '2026-10-12', createdAt: '2026-10-12T12:00:00Z', planWeek: 2 }),
      session({ id: 3, day: '2026-10-13', createdAt: '2026-10-13T12:00:00Z' }),
    ], '4-week plan', startedAt)

    assert.equal(groups.length, 3)
    assert.equal(groups[0].title, '4-week plan · Week 2')
    assert.deepEqual(groups[0].sessions.map((item) => item.id), [2])
    assert.equal(groups[1].title, '4-week plan · Week 1')
    assert.equal(groups[2].title, 'Other sessions')
  })

  it('keeps sessions from before the current plan in an earlier-plan group', () => {
    const groups = groupSessionsByPlanWeek([
      session({ id: 1, day: '2026-09-10', createdAt: '2026-09-10T12:00:00Z', planWeek: 3 }),
      session({ id: 2, day: '2026-10-12', createdAt: '2026-10-12T12:00:00Z', planWeek: 1 }),
    ], '8-week plan', new Date('2026-10-01T00:00:00Z'))

    assert.equal(groups[0].title, '8-week plan · Week 1')
    assert.equal(groups[1].title, 'Earlier plan · Week 3')
  })
})
