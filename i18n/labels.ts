import { TableType } from '@/constants/tables'
import { WatchDetail } from '@/constants/sessions'
import { TrainingPlanId } from '@/utils/training_plan'
import { Language } from './languages'
import { Translate } from './types'

export function tableTypeLabel(type: TableType, t: Translate): string {
  if (type === 'o2') return t('tables.o2')
  if (type === 'one-breath') return t('tables.oneBreath')
  if (type === 'walk') return t('tables.walk')
  return t('tables.co2')
}

export function tableTypeTerm(type: TableType, t: Translate): string | null {
  if (type === 'co2') return t('tables.co2Term')
  if (type === 'o2') return t('tables.o2Term')
  return null
}

export function tableTypeDescription(type: TableType, t: Translate): string {
  if (type === 'o2') return t('tables.o2Description')
  if (type === 'one-breath') return t('tables.oneBreathDescription')
  if (type === 'walk') return t('tables.walkDescription')
  return t('tables.co2Description')
}

export function sessionDisplayName(name: string, t: Translate): string {
  if (name === 'CO2 1') return t('plan.session.co21')
  if (name === 'CO2 2') return t('plan.session.co22')
  if (name === 'O2') return t('tables.o2')
  if (name === 'One breath') return t('tables.oneBreath')
  if (name === 'Dry walk') return t('tables.walk')
  if (name === 'CO2') return t('tables.co2')
  return name
}

export function watchDetailLabel(detail: WatchDetail, t: Translate): string {
  if (detail === 'garmin') return t('sessions.garmin')
  if (detail === 'coros') return t('sessions.coros')
  return t('sessions.watch')
}

export function planCopy(id: TrainingPlanId, field: 'name' | 'level' | 'levelFocus' | 'frequency' | 'focus' | 'method', t: Translate): string {
  return t(`plan.${id}.${field}`)
}

export function planLevelLine(id: TrainingPlanId, t: Translate): string {
  const level = planCopy(id, 'level', t)
  const focus = planCopy(id, 'levelFocus', t)
  return focus === '' ? level : `${level} · ${focus}`
}

export function roundOrdinal(value: number, language: Language, t: Translate): string {
  if (language === 'en') {
    const tens = value % 100
    if (tens >= 11 && tens <= 13) return t('training.ordinal.other', { n: value })
    switch (value % 10) {
      case 1:
        return t('training.ordinal.one', { n: value })
      case 2:
        return t('training.ordinal.two', { n: value })
      case 3:
        return t('training.ordinal.few', { n: value })
      default:
        return t('training.ordinal.other', { n: value })
    }
  }
  if (language === 'fr' && value === 1) return t('training.ordinal.one', { n: value })
  return t('training.ordinal.other', { n: value })
}

export function contractionLabel(count: number, t: Translate): string {
  return count === 1 ? t('contraction.one') : t('contraction.other', { count })
}

export function holdLabel(tableType: string, time: string, t: Translate): string {
  return tableType === 'o2' ? t('home.holdsFrom', { time }) : t('home.hold', { time })
}
