import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { useFormatterContext } from '@/providers/formatter'
import { projectHold, TrainingPlanId, TrainingPlans } from '@/utils/training_plan'
import { useState } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  outcome: BaselineOutcome
  saving: boolean
  onStart: (planId: TrainingPlanId) => void
  onRetake: () => void
}

export default function BaselinePlans({ outcome, saving, onStart, onRetake }: Props) {
  const { formatSeconds } = useFormatterContext()
  const [planId, setPlanId] = useState<TrainingPlanId>('long')
  const selected = TrainingPlans.find((plan) => plan.id === planId) ?? TrainingPlans[2]

  return (
    <Wrapper>
      <HeaderWithBtn headerText='Choose a plan' />
      <SOptions>
        {TrainingPlans.map((plan) => {
          const projection = projectHold(outcome.maxHoldSeconds, plan)
          const selectedPlan = plan.id === planId
          return (
            <SCard
              key={plan.id}
              $selected={selectedPlan}
              disabled={saving}
              onPress={() => setPlanId(plan.id)}
            >
              {plan.recommended ? (
                <SRecommend>Recommended for max gain</SRecommend>
              ) : null}
              <SName>{plan.name}</SName>
              <SMeta>{`${plan.weeks} weeks · ${plan.tablesPerWeek} CO2 tables each week`}</SMeta>
              <SGain>{`Breath-hold can increase by ${formatSeconds(projection.gainSeconds)}`}</SGain>
              <SRange>
                {`${formatSeconds(outcome.maxHoldSeconds)} → ${formatSeconds(projection.projectedSeconds)}`}
              </SRange>
            </SCard>
          )
        })}
      </SOptions>
      <Footer>
        <Button
          title={`Start ${selected.name} plan`}
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

const Wrapper = styled.View`
  flex: 1;
`

const SOptions = styled.View`
  flex: 1;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
`

const SCard = styled.Pressable<{ $selected: boolean }>`
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

const SGain = styled.Text`
  margin-top: 10px;
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SRange = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.TealPrimary};
`

