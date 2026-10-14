import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { trainingOverview } from '@/utils/training_overview'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


type Props = {
  onPress?: () => void
}

export default function AnalyticsOverview({ onPress }: Props) {
  const { settings, sessions, baselineTests } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const overview = trainingOverview(sessions, baselineTests, settings)
  const bestApnea = overview.bestApneaSeconds == null
    ? '—'
    : formatSeconds(overview.bestApneaSeconds)
  const bestContraction = overview.bestContractionSeconds == null
    ? '—'
    : formatSeconds(overview.bestContractionSeconds)

  const stats = (
    <>
      <SHeader>
        <SHeaderLead>
          <Ionicons name='pulse-outline' size={16} color={Colors.Seafoam} />
          <SHeaderLabel>Apnea telemetry</SHeaderLabel>
        </SHeaderLead>
        {onPress ? (
          <Ionicons name='chevron-forward' size={18} color={Colors.TextMuted} />
        ) : null}
      </SHeader>
      <SGrid>
        <SStat>
          <STile>
            <SValueRow>
              <SValue>{overview.trainedDays}</SValue>
              {overview.trainedStreak > 1 ? (
                <SStreak>
                  <Ionicons name='flame' size={12} color={Colors.Seafoam} />
                  <SStreakText>{`+${overview.trainedStreak}d`}</SStreakText>
                </SStreak>
              ) : null}
            </SValueRow>
            <SLabel>Days trained</SLabel>
          </STile>
        </SStat>
        <SStat>
          <STile>
            <SValueRow>
              <SValue>{formatSeconds(overview.totalApneaSeconds)}</SValue>
              <Ionicons name='hourglass-outline' size={16} color={Colors.Aquamarine} />
            </SValueRow>
            <SLabel>Total apnea</SLabel>
          </STile>
        </SStat>
        <SStat>
          <STile>
            <SValueRow>
              <SValue $accent>{bestApnea}</SValue>
              <Ionicons name='ribbon-outline' size={16} color={Colors.Seafoam} />
            </SValueRow>
            <SLabel>Personal best</SLabel>
          </STile>
        </SStat>
        <SStat>
          <STile>
            <SValueRow>
              <SValue $muted>{bestContraction}</SValue>
              <Ionicons name='resize-outline' size={16} color={Colors.TextMuted} />
            </SValueRow>
            <SLabel>First contraction</SLabel>
          </STile>
        </SStat>
      </SGrid>
    </>
  )

  return (
    <Wrapper>
      {onPress ? (
        <SPress onPress={onPress}>{stats}</SPress>
      ) : stats}
    </Wrapper>
  )
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
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${Space.sm}px;
`

const SHeaderLead = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`

const SHeaderLabel = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin: -6px;
`

const SStat = styled.View`
  width: 50%;
  padding: 6px;
`

const STile = styled.View`
  padding: 14px;
  border-radius: 12px;
  background-color: ${Colors.Telemetry};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SValueRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`

const SValue = styled.Text<{ $accent?: boolean; $muted?: boolean }>`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Stat};
  font-weight: 700;
  letter-spacing: -0.6px;
  font-variant: tabular-nums;
  color: ${(props) => (
    props.$accent ? Colors.Seafoam : props.$muted ? Colors.TextMuted : Colors.Text
  )};
`

const SStreak = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.HairlineStrong};
`

const SStreakText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  color: ${Colors.Seafoam};
`

const SLabel = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`
