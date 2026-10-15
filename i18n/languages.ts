export const Languages = ['en', 'fr', 'es', 'ko', 'de'] as const

export type Language = (typeof Languages)[number]

export const DefaultLanguage: Language = 'en'

export const LanguageOptions: readonly { code: Language; nativeName: string }[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'es', nativeName: 'Español' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'de', nativeName: 'Deutsch' },
]

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (Languages as readonly string[]).includes(value)
}

export function parseLanguage(value: unknown): Language | null {
  return isLanguage(value) ? value : null
}
