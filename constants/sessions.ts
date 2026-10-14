export const SessionSources = ['phone', 'watch'] as const

export type SessionSource = (typeof SessionSources)[number]

export const WatchDetails = ['ios', 'garmin', 'coros'] as const

export type WatchDetail = (typeof WatchDetails)[number]

export const WatchDetailLabel: Record<WatchDetail, string> = {
  ios: 'Watch',
  garmin: 'Garmin',
  coros: 'COROS',
}
