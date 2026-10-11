import { Colors, FontSizes } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { trainingOverview } from '@/utils/training_overview'
import { styled } from 'styled-components/native'


export default function AnalyticsOverview() {
  const { settings, sessions, baselineTests } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const overview = trainingOverview(sessions, baselineTests, settings)
  const bestApnea = overview.bestApneaSeconds == null
    ? '—'
    : formatSeconds(overview.bestApneaSeconds)
  const bestContraction = overview.bestContractionSeconds == null
    ? '—'
    : formatSeconds(overview.bestContractionSeconds)

  return (
    <Wrapper>
      <SGrid>
        <SStat>
          <SValue>{overview.trainedDays}</SValue>
          <SLabel>Days trained</SLabel>
        </SStat>
        <SStat>
          <SValue>{formatSeconds(overview.totalApneaSeconds)}</SValue>
          <SLabel>Total apnea</SLabel>
        </SStat>
        <SStat>
          <SValue>{bestApnea}</SValue>
          <SLabel>Best apnea</SLabel>
        </SStat>
        <SStat>
          <SValue>{bestContraction}</SValue>
          <SLabel>Best contraction</SLabel>
        </SStat>
      </SGrid>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  margin: 8px 20px 0;
  padding: 8px 4px;
  border-radius: 16px;
  background-color: ${Colors.White};
  border-width: 1px;
  border-color: ${Colors.GreyDivider};
`

const SGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`

const SStat = styled.View`
  width: 50%;
  padding: 10px 12px;
`

const SValue = styled.Text`
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SLabel = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`
