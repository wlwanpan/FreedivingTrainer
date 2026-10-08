export type TableRound = {
  index: number
  holdSeconds: number
  restSeconds: number
}

type TableSettings = {
  co2Rounds: number
  co2HoldSeconds: number
  co2RestStartSeconds: number
  co2RestStepSeconds: number
  o2Rounds: number
  o2HoldStartSeconds: number
  o2HoldStepSeconds: number
  o2RestSeconds: number
}

export function buildCo2Table(settings: TableSettings): TableRound[] {
  return Array.from({ length: settings.co2Rounds }, (_, index) => ({
    index: index + 1,
    holdSeconds: settings.co2HoldSeconds,
    restSeconds: Math.max(0, settings.co2RestStartSeconds - index * settings.co2RestStepSeconds),
  }))
}

export function buildO2Table(settings: TableSettings): TableRound[] {
  return Array.from({ length: settings.o2Rounds }, (_, index) => ({
    index: index + 1,
    holdSeconds: settings.o2HoldStartSeconds + index * settings.o2HoldStepSeconds,
    restSeconds: settings.o2RestSeconds,
  }))
}
