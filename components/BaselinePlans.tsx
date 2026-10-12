import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { useFormatterContext } from '@/providers/formatter'
import {
  beginnerBaseHold,
  TrainingPlan,
  TrainingPlanId,
  TrainingPlans,
  usesMarkedContraction,
} from '@/utils/training_plan'
import { useState } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  outcome: BaselineOutcome
  saving: boolean
  initialPlanId?: TrainingPlanId
  onStart: (planId: TrainingPlanId) => void
  onRetake: () => void
  onBack?: () => void
}

export default function BaselinePlans({
  outcome,
  saving,
  initialPlanId,
  onStart,
  onRetake,
  onBack,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const [planId, setPlanId] = useState<TrainingPlanId>(initialPlanId ?? 'beginner')
  const selected = TrainingPlans.find((plan) => plan.id === planId) ?? TrainingPlans[0]

  return (
    <Wrapper>
      <HeaderWithBtn
        headerText='Choose a plan'
        leftText={onBack ? 'Back' : undefined}
        leftOnClick={onBack}
        disabled={saving}
      />
      <SOptions showsVerticalScrollIndicator={false}>
        <SRule>
          Start with 2–3 sessions a week. Never train CO2 and O2 on the same day.
        </SRule>
        {TrainingPlans.map((plan) => {
          const selectedPlan = plan.id === planId
          return (
            <SCard
              key={plan.id}
              $selected={selectedPlan}
              disabled={saving}
              onPress={() => setPlanId(plan.id)}
            >
              {plan.recommended ? (
                <SRecommend>Start here</SRecommend>
              ) : null}
              <SName>{plan.name}</SName>
              <SMeta>{plan.level}</SMeta>
              <SMeta>{plan.frequency}</SMeta>
              <SFocus>{plan.focus}</SFocus>
              <SMethod>{methodCopy(plan, outcome, formatSeconds)}</SMethod>
            </SCard>
          )
        })}
      </SOptions>
      <Footer>
        <Button
          title={`Start ${selected.name}`}
          onPress={() => onStart(selected.id)}
          loading={saving}
        />
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

function methodCopy(
  plan: TrainingPlan,
  outcome: BaselineOutcome,
  formatSeconds: (seconds: number) => string,
): string {
  if (plan.id !== 'beginner') return plan.method
  const hold = beginnerBaseHold(outcome.maxHoldSeconds, outcome.contractionSeconds)
  const marked = usesMarkedContraction(outcome.contractionSeconds)
  const source = marked
    ? 'your first contraction'
    : 'half your maximum, since no contraction was marked'
  return `Hold ${formatSeconds(hold)}, ${source}, for 7 rounds. Rest steps from 2:00 to 0:30. After week 2 the hold adds 15–20 seconds.`
}

const Wrapper = styled.View`
  flex: 1;
`

const SOptions = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`

const SRule = styled.Text`
  margin-bottom: 12px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SCard = styled.Pressable<{ $selected: boolean }>`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 16px;
  border-width: 2px;
  border-color: ${(props) => props.$selected ? Colors.TealPrimary : Colors.GreyDivider};
  background-color: ${(props) => props.$selected ? Colors.TealBackground : Colors.White};
`

const SRecommend = styled.Text`
  font-size: ${FontSizes.XSmall};
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.TealPrimary};
`

const SName = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Large};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SMeta = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SFocus = styled.Text`
  margin-top: 10px;
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SMethod = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`
