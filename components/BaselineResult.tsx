import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import TableRoundRow from '@/components/TableRoundRow'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { useFormatterContext } from '@/providers/formatter'
import { MIN_BASELINE_SECONDS } from '@/utils/baseline'
import { buildCo2Table, buildO2Table } from '@/utils/table'
import { styled } from 'styled-components/native'


type Props = {
  outcome: BaselineOutcome
  saving: boolean
  onUse: () => void
  onRetake: () => void
}

export default function BaselineResult({ outcome, saving, onUse, onRetake }: Props) {
  const { formatSeconds } = useFormatterContext()
  const plan = outcome.plan

  if (outcome.tooShort || plan == null) {
    return (
      <Wrapper>
        <HeaderWithBtn headerText='Baseline' />
        <SBody>
          <STitle>Too short to size a table</STitle>
          <SBodyCopy>
            {`That hold was ${formatSeconds(outcome.maxHoldSeconds)}. Stay with it for at least ${formatSeconds(MIN_BASELINE_SECONDS)} so the CO2 hold can sit at half of a real maximum.`}
          </SBodyCopy>
        </SBody>
        <Footer>
          <Button title='Try again' onPress={onRetake} />
        </Footer>
      </Wrapper>
    )
  }

  const co2Rounds = buildCo2Table(plan)
  const o2Rounds = buildO2Table(plan)
  const closingRest = co2Rounds[co2Rounds.length - 1]?.restSeconds ?? plan.co2RestStartSeconds
  const o2First = o2Rounds[0]
  const o2Last = o2Rounds[o2Rounds.length - 1]
  const percent = Math.round((plan.co2HoldSeconds / outcome.maxHoldSeconds) * 100)

  return (
    <Wrapper>
      <HeaderWithBtn headerText='Your tables' />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <SStats>
          <SStat>
            <SStatLabel>Maximum</SStatLabel>
            <SStatValue>{formatSeconds(outcome.maxHoldSeconds)}</SStatValue>
          </SStat>
          <SStat>
            <SStatLabel>Contraction</SStatLabel>
            <SStatValue>
              {outcome.contractionSeconds == null ? '—' : formatSeconds(outcome.contractionSeconds)}
            </SStatValue>
          </SStat>
        </SStats>
        <SCopy>{co2Explanation(outcome, percent, formatSeconds)}</SCopy>

        <SSection>CO2</SSection>
        <SCopy>
          {`Hold ${formatSeconds(plan.co2HoldSeconds)} every round. Rest starts at ${formatSeconds(plan.co2RestStartSeconds)} and drops by ${formatSeconds(plan.co2RestStepSeconds)}, down to ${formatSeconds(closingRest)}.`}
        </SCopy>
        {co2Rounds.map((round) => (
          <TableRoundRow key={`co2-${round.index}`} round={round} />
        ))}

        <SSection>O2</SSection>
        <SCopy>
          {o2First && o2Last
            ? `Holds climb from ${formatSeconds(o2First.holdSeconds)} to ${formatSeconds(o2Last.holdSeconds)}. Rest stays ${formatSeconds(plan.o2RestSeconds)}.`
            : 'Holds get longer each round. Rest stays fixed.'}
        </SCopy>
        {o2Rounds.map((round) => (
          <TableRoundRow key={`o2-${round.index}`} round={round} />
        ))}
      </SScroll>
      <Footer>
        <Button title='Choose a plan' onPress={onUse} loading={saving} />
        <Button
          title='Retake test'
          onPress={onRetake}
          disabled={saving}
          defaultBGColor={Colors.GreyPrimary}
          pressedBGColor={Colors.GreyFaded}
        />
      </Footer>
    </Wrapper>
  )
}

function co2Explanation(
  outcome: BaselineOutcome,
  percent: number,
  formatSeconds: (seconds: number) => string,
): string {
  const plan = outcome.plan
  if (plan == null) return ''
  const hold = `${formatSeconds(plan.co2HoldSeconds)} (${percent}% of your maximum)`
  if (outcome.contractionSeconds == null || plan.co2HoldReason === 'midpoint') {
    return `No contraction marked. The CO2 hold is ${hold}.`
  }
  const at = formatSeconds(outcome.contractionSeconds)
  if (plan.co2HoldReason === 'contraction') {
    return `First contraction at ${at}, inside 50–60% of your maximum. The CO2 hold is ${hold}.`
  }
  if (plan.co2HoldReason === 'below-band') {
    return `First contraction at ${at}, before the halfway point. The CO2 hold stays at ${hold}.`
  }
  return `First contraction at ${at}, after 60% of your maximum. The CO2 hold stays at ${hold}.`
}

const Wrapper = styled.View`
  flex: 1;
`

const SScroll = styled.ScrollView`
  flex: 1;
`

const SBody = styled.View`
  flex: 1;
  padding: 8px 24px 0;
`

const STitle = styled.Text`
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SStats = styled.View`
  flex-direction: row;
  gap: 12px;
  padding: 8px 20px 0;
`

const SStat = styled.View`
  flex: 1;
  padding: 16px;
  border-radius: 14px;
  background-color: ${Colors.TealBackground};
`

const SStatLabel = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.GreyPrimary};
`

const SStatValue = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SSection = styled.Text`
  margin-top: 22px;
  margin-bottom: 4px;
  padding: 0 20px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`

const SBodyCopy = styled.Text`
  margin-top: 12px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.GreyPrimary};
`

const SCopy = styled.Text`
  margin-top: 8px;
  padding: 0 20px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`
