import * as Localization from 'expo-localization'
import { detectLanguage } from './detect'
import { DefaultLanguage, Language } from './languages'

export function detectDeviceLanguage(): Language {
  try {
    const locale = Localization.getLocales()[0]
    return detectLanguage(locale?.regionCode, locale?.languageCode)
  } catch {
    return DefaultLanguage
  }
}
