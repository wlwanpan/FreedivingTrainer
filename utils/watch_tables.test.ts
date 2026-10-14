import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { watchTablesFromSettings } from './watch_tables'

const settings = {
  breatheUpSeconds: 60,
  co2Rounds: 3,
  co2HoldSeconds: 90,
  co2RestStartSeconds: 120,
  co2RestStepSeconds: 15,
  o2Rounds: 3,
  o2HoldStartSeconds: 60,
  o2HoldStepSeconds: 15,
  o2RestSeconds: 120,
}

describe('watchTablesFromSettings', () => {
  it('sends iPhone CO2 and O2 table settings as watch rounds', () => {
    const tables = watchTablesFromSettings(settings)

    assert.equal(tables.breatheUpSeconds, 60)
    assert.deepEqual(tables.co2, {
      name: 'CO2',
      tableType: 'co2',
      holdSeconds: 90,
      restSeconds: 120,
      rounds: [
        { hold: 90, rest: 120 },
        { hold: 90, rest: 105 },
        { hold: 90, rest: 90 },
      ],
    })
    assert.deepEqual(tables.o2, {
      name: 'O2',
      tableType: 'o2',
      holdSeconds: 60,
      restSeconds: 120,
      rounds: [
        { hold: 60, rest: 120 },
        { hold: 75, rest: 120 },
        { hold: 90, rest: 120 },
      ],
    })
  })
})
