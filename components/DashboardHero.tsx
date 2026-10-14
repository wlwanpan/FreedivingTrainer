import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { TrainingOutline } from '@/hooks/useTrainingOutline'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


type Props = {
  outline: TrainingOutline | null
}

function stillnessLabel(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Morning stillness'
  if (hour < 17) return 'Afternoon stillness'
  return 'Evening stillness'
}

export default function DashboardHero({ outline }: Props) {
  const { settings } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const focus = outline?.level.split(' · ')[1] ?? 'Breathwork flow'
  const headline = outline?.planName
    ?? (settings.baselineMaxHoldSeconds == null ? 'Find your baseline' : 'Choose a plan')
  const hold = settings.baselineMaxHoldSeconds

  return (
    <Wrapper>
      <SGlow />
      <SRow>
        <SChip>
          <SLive />
          <SChipText>{`${stillnessLabel()} · ${focus}`}</SChipText>
        </SChip>
        {hold == null ? null : (
          <SChip>
            <Ionicons name='water' size={13} color={Colors.Seafoam} />
            <SHoldText>{formatSeconds(hold)}</SHoldText>
          </SChip>
        )}
      </SRow>
      <SEyebrow>Lung capacity baseline</SEyebrow>
      <SHeadline>{headline}</SHeadline>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  margin: ${Space.sm}px ${Space.screen}px 0;
  padding: 20px;
  border-radius: ${Radii.Card}px;
  overflow: hidden;
  background-color: ${Colors.CardAlt};
  border-width: 1px;
  border-color: ${Colors.HairlineStrong};
`

const SGlow = styled.View`
  position: absolute;
  right: -40px;
  bottom: -48px;
  width: 160px;
  height: 160px;
  border-radius: 80px;
  background-color: ${Colors.SeafoamMuted};
`

const SRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${Space.sm}px;
`

const SChip = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.Canvas};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SLive = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${Colors.Seafoam};
`

const SChipText = styled.Text`
  flex-shrink: 1;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
`

const SHoldText = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.Text};
`

const SEyebrow = styled.Text`
  margin-top: 14px;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SHeadline = styled.Text`
  margin-top: 2px;
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XLarge};
  font-weight: 700;
  letter-spacing: -0.5px;
  color: ${Colors.Text};
`
