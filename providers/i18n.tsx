import { detectDeviceLanguage } from '@/i18n/device'
import { DefaultLanguage, Language, LanguageOptions, parseLanguage } from '@/i18n/languages'
import { setRuntimeLanguage } from '@/i18n/runtime'
import { translate } from '@/i18n/translate'
import { Translate, TranslateVars } from '@/i18n/types'
import { useSQLContext } from '@/providers/sql'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react'


export interface II18n {
  language: Language
  t: Translate
  setLanguage: (language: Language) => void
  options: typeof LanguageOptions
}

const I18nContext = createContext<II18n | null>(null)

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

type Props = { children: ReactNode }

export default function I18nProvider({ children }: Props) {
  const { settings, updateSettings } = useSQLContext()
  const detected = useMemo(() => detectDeviceLanguage(), [])
  const stored = parseLanguage(settings.language)
  const language = stored ?? detected

  useEffect(() => {
    setRuntimeLanguage(language)
  }, [language])

  useEffect(() => {
    if (settings.id <= 0) return
    if (parseLanguage(settings.language) != null) return
    void updateSettings({
      ...settings,
      language,
      updatedAt: new Date(),
    })
  }, [language, settings, updateSettings])

  const setLanguage = useCallback((next: Language) => {
    if (settings.id <= 0) return
    void updateSettings({
      ...settings,
      language: next,
      updatedAt: new Date(),
    })
  }, [settings, updateSettings])

  const t = useCallback((key: string, vars?: TranslateVars) => {
    return translate(language, key, vars)
  }, [language])

  const value = useMemo(() => ({
    language,
    t,
    setLanguage,
    options: LanguageOptions,
  }), [language, setLanguage, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export const fallbackLanguage = DefaultLanguage
