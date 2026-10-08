export const DateFormats = ['YYYY-MM-DD', 'MMM D, YYYY'] as const

export type DateFormat = (typeof DateFormats)[number]

export const DefaultDateFormat: DateFormat = 'YYYY-MM-DD'
