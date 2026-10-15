import { DefaultLanguage, Language } from './languages'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ko from './locales/ko.json'
import { TranslateVars } from './types'

type Messages = typeof en

const catalogs: Record<Language, Messages> = {
  en,
  fr: fr as Messages,
  es: es as Messages,
  ko: ko as Messages,
  de: de as Messages,
}

export function lookup(messages: unknown, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = messages
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (vars == null) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (
    vars[name] == null ? match : String(vars[name])
  ))
}

export function translate(language: Language, key: string, vars?: TranslateVars): string {
  const table = catalogs[language] ?? catalogs[DefaultLanguage]
  const raw = lookup(table, key) ?? lookup(catalogs[DefaultLanguage], key) ?? key
  return interpolate(raw, vars)
}

export function englishTranslate(key: string, vars?: TranslateVars): string {
  return translate(DefaultLanguage, key, vars)
}

export function nestedKeys(value: unknown, prefix = ''): string[] {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix === '' ? [] : [prefix]
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return typeof child === 'string' ? [path] : nestedKeys(child, path)
  })
}

export function catalogKeys(): string[] {
  return nestedKeys(en)
}

export const localeCatalogs = catalogs
