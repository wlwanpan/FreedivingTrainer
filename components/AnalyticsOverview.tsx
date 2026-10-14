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
            <SValue>{overview.trainedDays}</SValue>
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
            <SValue $accent>{bestApnea}</SValue>
            <SLabel>Personal best</SLabel>
          </STile>
        </SStat>
        <SStat>
          <STile>
            <SValue>{bestContraction}</SValue>
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
`

const SPress = styled.Pressable``

const SHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: ${Space.sm}px;
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.Hairline};
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
  align-items: baseline;
  justify-content: space-between;
`

const SValue = styled.Text<{ $accent?: boolean }>`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Stat};
  font-weight: 700;
  letter-spacing: -0.6px;
  font-variant: tabular-nums;
  color: ${(props) => props.$accent ? Colors.Seafoam : Colors.Text};
`

const SLabel = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`
