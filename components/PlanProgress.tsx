import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { TrainingOutline } from '@/hooks/useTrainingOutline'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ReactNode } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  outline: TrainingOutline
  onRetest: () => void
  onPress?: () => void
  children?: ReactNode
}

export default function PlanProgress({ outline, onRetest, onPress, children }: Props) {
  const { t } = useI18n()
  const [phase, focus] = splitLevel(outline.level)
  const percent = Math.round(outline.progress * 100)
  const current = outline.schedule.find((entry) => entry.current)
  const weekTotal = current?.sessions.length ?? 0
  const weekDone = current?.sessions.filter((session) => session.completed).length ?? 0
  const weekLeft = Math.max(0, weekTotal - weekDone)
  const weekLabel = outline.weekComplete
    ? t('plan.progressWeekComplete', { week: outline.week, weeks: outline.weeks })
    : t('plan.progressWeekInProgress', { week: outline.week, weeks: outline.weeks })

  const overview = (
    <>
      <SHeader>
        <SHeaderText>
          <SMetaRow>
            {phase ? <SPhase>{phase}</SPhase> : null}
            {focus ? <SFocus>{focus}</SFocus> : null}
          </SMetaRow>
          <SPlanName>{outline.planName}</SPlanName>
        </SHeaderText>
        {onPress ? (
          <SIcon>
            <Ionicons name='arrow-forward' size={18} color={Colors.TextMuted} />
          </SIcon>
        ) : null}
      </SHeader>
      <SWeekLine>
        <SWeekCopy>{weekLabel}</SWeekCopy>
        <SPercent>{`${percent}%`}</SPercent>
      </SWeekLine>
      <STrack>
        <SFill style={{ width: `${percent}%` }} />
      </STrack>
      {weekTotal > 0 ? (
        <SWeekMeta>
          <SDoneRow>
            <Ionicons name='checkmark-circle' size={14} color={Colors.Seafoam} />
            <SFrequency>
              {t('plan.sessionsThisWeek', { done: weekDone, total: weekTotal })}
            </SFrequency>
          </SDoneRow>
          <SRemain>
            {weekLeft === 0
              ? t('plan.weekComplete')
              : weekLeft === 1
                ? t('plan.sessionRemaining', { count: weekLeft })
                : t('plan.sessionsRemaining', { count: weekLeft })}
          </SRemain>
        </SWeekMeta>
      ) : (
        <SFrequency>{outline.frequency}</SFrequency>
      )}
    </>
  )

  return (
    <Wrapper>
      {onPress ? (
        <SPress onPress={onPress}>{overview}</SPress>
      ) : overview}
      {outline.retestDue ? (
        <SLink onPress={onRetest}>
          {t('plan.retestLink')}
        </SLink>
      ) : null}
      {children}
    </Wrapper>
  )
}

function splitLevel(level: string): [string | null, string | null] {
  const parts = level.split(' · ')
  if (parts.length < 2) return [level || null, null]
  return [parts[0], parts.slice(1).join(' · ')]
}

const Wrapper = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 20px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-opacity: 0.06;
  shadow-radius: 12px;
  shadow-offset: 0px 8px;
  elevation: 2;
`

const SPress = styled.Pressable``

const SHeader = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${Space.sm}px;
`

const SHeaderText = styled.View`
  flex: 1;
`

const SMetaRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
`

const SPhase = styled.Text`
  padding: 2px 8px;
  border-radius: ${Radii.Pill}px;
  overflow: hidden;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SFocus = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  color: ${Colors.TextMuted};
`

const SPlanName = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Large};
  font-weight: 700;
  letter-spacing: -0.4px;
  color: ${Colors.Text};
`

const SIcon = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
`

const SWeekLine = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${Space.md}px;
`

const SWeekCopy = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.Text};
`

const STrack = styled.View`
  height: 10px;
  margin-top: ${Space.sm}px;
  padding: 2px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.BreathTrack};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  overflow: hidden;
`

const SFill = styled.View`
  height: 100%;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.Lagoon};
`

const SPercent = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XSmall};
  font-weight: 700;
  color: ${Colors.Seafoam};
`

const SWeekMeta = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${Space.sm}px;
  margin-top: 10px;
`

const SDoneRow = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`

const SFrequency = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SRemain = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.Seafoam};
`

const SLink = styled.Text`
  margin-top: ${Space.sm}px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  line-height: 20px;
  color: ${Colors.Seafoam};
`
