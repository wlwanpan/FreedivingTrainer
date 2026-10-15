import { englishTranslate } from '@/i18n/translate'
import { Translate } from '@/i18n/types'
import { Session } from '../db/schema'


export type SessionLogGroup = {
  key: string
  title: string
  sessions: Session[]
}

export function trainedDays(sessions: readonly Session[]): Set<string> {
  return new Set(sessions.map((session) => session.day))
}

export function groupSessionsByPlanWeek(
  sessions: readonly Session[],
  planName: string | null,
  planStartedAt: Date | null,
  t: Translate = englishTranslate,
): SessionLogGroup[] {
  const startedMs = planStartedAt?.getTime() ?? null
  const buckets = new Map<string, SessionLogGroup>()
  const sorted = [...sessions].sort((a, b) => {
    const byTime = b.createdAt.getTime() - a.createdAt.getTime()
    if (byTime !== 0) return byTime
    return b.id - a.id
  })

  for (const session of sorted) {
    const { key, title } = groupForSession(session, planName, startedMs, t)
    const group = buckets.get(key) ?? { key, title, sessions: [] }
    group.sessions.push(session)
    buckets.set(key, group)
  }

  return [...buckets.values()].sort((a, b) => {
    const [aBand, aWeek] = groupRank(a.key)
    const [bBand, bWeek] = groupRank(b.key)
    if (aBand !== bBand) return aBand - bBand
    return aWeek - bWeek
  })
}

function groupForSession(
  session: Session,
  planName: string | null,
  startedMs: number | null,
  t: Translate,
): { key: string; title: string } {
  if (session.planWeek == null) {
    return { key: 'other', title: t('sessions.other') }
  }
  const week = session.planWeek
  const inCurrentPlan = startedMs != null && session.createdAt.getTime() >= startedMs
  if (inCurrentPlan) {
    return {
      key: `plan:${week}`,
      title: planName != null
        ? t('sessions.planWeek', { plan: planName, week })
        : t('sessions.week', { week }),
    }
  }
  if (startedMs != null) {
    return { key: `earlier:${week}`, title: t('sessions.earlierPlan', { week }) }
  }
  return { key: `week:${week}`, title: t('sessions.week', { week }) }
}

function groupRank(key: string): [number, number] {
  const plan = /^plan:(\d+)$/.exec(key)
  if (plan) return [0, -Number(plan[1])]
  const week = /^week:(\d+)$/.exec(key)
  if (week) return [1, -Number(week[1])]
  const earlier = /^earlier:(\d+)$/.exec(key)
  if (earlier) return [2, -Number(earlier[1])]
  return [3, 0]
}
