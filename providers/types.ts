export type BaseResults = {
  error?: Error
}

export type InsertionResults = BaseResults & {
  insertionID?: number
}

export type DeleteResults = BaseResults
