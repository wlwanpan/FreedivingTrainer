import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsStepper from '@/components/SettingsStepper'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { useFormatterContext } from '@/providers/formatter'
import {
  beginnerBaseHold,
  CustomPlan,
  CustomSessionChoices,
  customPlanFrequency,
  estimatedApneaTimes,
  MAX_CUSTOM_WEEKS,
  MIN_CUSTOM_WEEKS,
  parseCustomPlan,
  PlanChoice,
  SessionKind,
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
  initialCustomPlan?: string | null
  onStart: (choice: PlanChoice) => void
  onRetake: () => void
  onBack?: () => void
}

export default function BaselinePlans({
  outcome,
  saving,
  initialPlanId,
  initialCustomPlan,
  onStart,
  onRetake,
  onBack,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const storedCustom = parseCustomPlan(initialCustomPlan)
  const [planId, setPlanId] = useState<TrainingPlanId>(initialPlanId ?? 'beginner')
  const [customWeeks, setCustomWeeks] = useState(storedCustom?.weeks ?? 4)
  const [customSessions, setCustomSessions] = useState<SessionKind[]>(storedCustom?.sessions ?? ['co2'])
  const selected = TrainingPlans.find((plan) => plan.id === planId) ?? TrainingPlans[0]
  const customPlan: CustomPlan = { weeks: customWeeks, sessions: customSessions }

  const toggleSession = (kind: SessionKind) => {
    setPlanId('custom')
    setCustomSessions((current) => {
      if (current.includes(kind)) {
        if (current.length === 1) return current
        return current.filter((item) => item !== kind)
      }
      return CustomSessionChoices
        .map((choice) => choice.kind)
        .filter((item) => item === kind || current.includes(item))
    })
  }

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
            <SCard key={plan.id} $selected={selectedPlan}>
              <SCardPress
                disabled={saving}
                onPress={() => setPlanId(plan.id)}
              >
              <STop>
                <STopText>
                  {plan.recommended ? (
                    <SRecommend>Start here</SRecommend>
                  ) : null}
                  <SName>{plan.name}</SName>
                </STopText>
                {plan.id === 'custom' ? null : (
                  <SGain>
                    {gainCopy(plan.weeks, outcome.maxHoldSeconds, formatSeconds)}
                  </SGain>
                )}
              </STop>
              <SMeta>{plan.level}</SMeta>
              <SMeta>
                {plan.id === 'custom' && selectedPlan
                  ? `${customWeeks} weeks · ${customPlanFrequency(customSessions)}`
                  : plan.frequency}
              </SMeta>
              <SFocus>{plan.focus}</SFocus>
              {plan.id === 'custom' && selectedPlan ? null : (
                <SMethod>{methodCopy(plan, outcome, formatSeconds)}</SMethod>
              )}
              </SCardPress>
              {plan.id === 'custom' && selectedPlan ? (
                <SBuilder>
                  <SettingsStepper
                    label='Weeks'
                    value={customWeeks}
                    min={MIN_CUSTOM_WEEKS}
                    max={MAX_CUSTOM_WEEKS}
                    onChange={setCustomWeeks}
                  />
                  <SSessionLabel>Each week</SSessionLabel>
                  <SSessionRow>
                    {CustomSessionChoices.map((choice) => (
                      <SSessionChoice key={choice.kind}>
                        <SettingsChoice
                          label={choice.label}
                          selected={customSessions.includes(choice.kind)}
                          onPress={() => toggleSession(choice.kind)}
                        />
                      </SSessionChoice>
                    ))}
                  </SSessionRow>
                </SBuilder>
              ) : null}
            </SCard>
          )
        })}
      </SOptions>
      <Footer>
        <Button
          title={selected.id === 'custom' ? 'Start your plan' : `Start ${selected.name}`}
          onPress={() => onStart({
            planId: selected.id,
            custom: selected.id === 'custom' ? customPlan : null,
          })}
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

function gainCopy(
  weeks: number,
  baselineSeconds: number,
  formatSeconds: (seconds: number) => string,
): string {
  const estimate = estimatedApneaTimes(weeks, baselineSeconds)
  return `${formatSeconds(estimate.previous)} → ~${formatSeconds(estimate.next)}`
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

const SCard = styled.View<{ $selected: boolean }>`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 16px;
  border-width: 2px;
  border-color: ${(props) => props.$selected ? Colors.TealPrimary : Colors.GreyDivider};
  background-color: ${(props) => props.$selected ? Colors.TealBackground : Colors.White};
`

const SCardPress = styled.Pressable``

const STop = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`

const STopText = styled.View`
  flex: 1;
`

const SGain = styled.Text`
  flex-shrink: 0;
  max-width: 48%;
  font-size: ${FontSizes.Small};
  font-weight: 800;
  line-height: 20px;
  text-align: right;
  color: ${Colors.GreenPrimary};
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

const SBuilder = styled.View`
  margin-top: 8px;
`

const SSessionLabel = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.GreyPrimary};
`

const SSessionRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`

const SSessionChoice = styled.View`
  flex-grow: 1;
  flex-basis: 46%;
`
