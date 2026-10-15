import { detectLanguage } from './detect'
import { DefaultLanguage, Language, parseLanguage } from './languages'
import { translate } from './translate'
import { Translate, TranslateVars } from './types'

let currentLanguage: Language = DefaultLanguage

export function setRuntimeLanguage(language: Language) {
  currentLanguage = language
}

export function runtimeLanguage(): Language {
  return currentLanguage
}

export function tRuntime(key: string, vars?: TranslateVars): string {
  return translate(currentLanguage, key, vars)
}

export function applyDetectedLanguage(regionCode?: string | null, languageCode?: string | null): Language {
  const language = parseLanguage(detectLanguage(regionCode, languageCode)) ?? DefaultLanguage
  currentLanguage = language
  return language
}

export const runtimeTranslate: Translate = tRuntime
