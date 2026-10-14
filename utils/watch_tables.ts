import { TableTypeLabel } from '../constants/tables'
import { buildCo2Table, buildO2Table, TableRound } from './table'

export type WatchTableSettings = {
  breatheUpSeconds: number
  co2Rounds: number
  co2HoldSeconds: number
  co2RestStartSeconds: number
  co2RestStepSeconds: number
  o2Rounds: number
  o2HoldStartSeconds: number
  o2HoldStepSeconds: number
  o2RestSeconds: number
}

export type WatchTablePayload = {
  name: string
  tableType: 'co2' | 'o2'
  holdSeconds: number
  restSeconds: number
  rounds: { hold: number; rest: number }[]
}

export type WatchTablesPayload = {
  breatheUpSeconds: number
  co2: WatchTablePayload
  o2: WatchTablePayload
}

function tableRounds(rounds: TableRound[]): WatchTablePayload['rounds'] {
  return rounds.map((round) => ({
    hold: round.holdSeconds,
    rest: round.restSeconds,
  }))
}

export function watchTablesFromSettings(settings: WatchTableSettings): WatchTablesPayload {
  return {
    breatheUpSeconds: settings.breatheUpSeconds,
    co2: {
      name: TableTypeLabel.co2,
      tableType: 'co2',
      holdSeconds: settings.co2HoldSeconds,
      restSeconds: settings.co2RestStartSeconds,
      rounds: tableRounds(buildCo2Table(settings)),
    },
    o2: {
      name: TableTypeLabel.o2,
      tableType: 'o2',
      holdSeconds: settings.o2HoldStartSeconds,
      restSeconds: settings.o2RestSeconds,
      rounds: tableRounds(buildO2Table(settings)),
    },
  }
}
