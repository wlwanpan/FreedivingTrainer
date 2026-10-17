import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { practiceFromValue } from './practice'
import {
  MERMAID_DISTANCE_BREATHE_SECONDS,
  MERMAID_WALK_HOLD_SECONDS,
  MERMAID_WALK_REST_START_SECONDS,
  MERMAID_WALK_REST_STEP_SECONDS,
  MERMAID_WALK_ROUNDS,
  TrainingPlans,
  applyPractice,
  mermaidWalkHold,
  weeklySessions,
} from './training_plan'


const beginner = TrainingPlans[0]
const intermediate = TrainingPlans[1]
const advanced = TrainingPlans[2]

describe('practice', () => {
  it('keeps an unknown value on the freediver path', () => {
    assert.equal(practiceFromValue(null), 'freediver')
    assert.equal(practiceFromValue('freediver'), 'freediver')
    assert.equal(practiceFromValue('mermaid'), 'mermaid')
  })
})

describe('weekly sessions', () => {
  it('keeps the freediver plans on the current tables', () => {
    const early = weeklySessions({
      baselineMaxSeconds: 120,
      contractionSeconds: 50,
      plan: beginner,
      week: 1,
      practice: 'freediver',
    })
    assert.equal(early.length, 1)
    assert.equal(early[0]?.kind, 'co2')
    assert.equal(early[0]?.holdSeconds, 50)

    const middle = weeklySessions({
      baselineMaxSeconds: 120,
      contractionSeconds: null,
      plan: intermediate,
      week: 1,
      practice: 'freediver',
    })
    assert.deepEqual(middle.map((session) => session.kind), ['co2', 'o2', 'co2'])

    const peak = weeklySessions({
      baselineMaxSeconds: 120,
      contractionSeconds: null,
      plan: advanced,
      week: 1,
      practice: 'freediver',
    })
    assert.deepEqual(peak.map((session) => session.kind), ['co2', 'one-breath', 'o2', 'walk'])
  })

  it('builds mermaid foundational tables from the baseline contraction', () => {
    const marked = weeklySessions({
      baselineMaxSeconds: 120,
      contractionSeconds: 45,
      plan: beginner,
      week: 1,
      practice: 'mermaid',
    })
    assert.equal(marked.length, 1)
    assert.equal(marked[0]?.kind, 'co2')
    assert.equal(marked[0]?.holdSeconds, 45)
    assert.equal(marked[0]?.openHold, undefined)

    const unmarked = weeklySessions({
      baselineMaxSeconds: 120,
      contractionSeconds: null,
      plan: beginner,
      week: 1,
      practice: 'mermaid',
    })
    assert.equal(unmarked[0]?.holdSeconds, 60)
  })

  it('builds mermaid intermediate static O2 and shrinking-rest apnea walks', () => {
    const sessions = weeklySessions({
      baselineMaxSeconds: 90,
      contractionSeconds: null,
      plan: intermediate,
      week: 1,
      practice: 'mermaid',
    })
    assert.deepEqual(sessions.map((session) => session.kind), ['o2', 'walk', 'walk'])
    const walk = sessions[1]
    assert.equal(walk?.holdSeconds, MERMAID_WALK_HOLD_SECONDS)
    assert.equal(walk?.holdStepSeconds, 0)
    assert.equal(walk?.restStartSeconds, MERMAID_WALK_REST_START_SECONDS)
    assert.equal(walk?.restStepSeconds, MERMAID_WALK_REST_STEP_SECONDS)
    assert.equal(walk?.rounds, MERMAID_WALK_ROUNDS)
    assert.equal(sessions[0]?.tableType, 'o2')
    assert.equal(sessions[0]?.restStepSeconds, 0)
    assert.ok((sessions[0]?.holdStepSeconds ?? 0) > 0)
    assert.equal(applyPractice(intermediate, 'mermaid').retestAtWeek, null)
    assert.equal(applyPractice(intermediate, 'freediver').retestAtWeek, 4)
  })

  it('caps a short baseline walk below the fixed apnea-walk hold', () => {
    assert.equal(mermaidWalkHold(30), 30)
    assert.equal(mermaidWalkHold(180), MERMAID_WALK_HOLD_SECONDS)
  })

  it('builds mermaid advanced maximum-distance walks', () => {
    const sessions = weeklySessions({
      baselineMaxSeconds: 120,
      contractionSeconds: 40,
      plan: advanced,
      week: 3,
      practice: 'mermaid',
    })
    assert.equal(sessions.length, 3)
    assert.ok(sessions.every((session) => session.kind === 'distance' && session.openHold === true))
    assert.ok(sessions.every((session) => session.breatheUpSeconds === MERMAID_DISTANCE_BREATHE_SECONDS))
    assert.deepEqual(sessions.map((session) => session.name), [
      'Maximum distance',
      'Maximum distance 2',
      'Maximum distance 3',
    ])
  })
})
