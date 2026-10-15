import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsStepper from '@/components/SettingsStepper'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { planCopy, planLevelLine, tableTypeLabel } from '@/i18n/labels'
import { Translate } from '@/i18n/types'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import {
  beginnerBaseHold,
  CustomPlan,
  CustomSessionChoices,
  customPlanFrequency,
  estimatedApneaTimes,
  MAX_CUSTOM_WEEKS,
  MIN_CUSTOM_WEEKS,
  isCurrentPlanChoice,
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
  const { t } = useI18n()
  const { formatSeconds } = useFormatterContext()
  const storedCustom = parseCustomPlan(initialCustomPlan)
  const [planId, setPlanId] = useState<TrainingPlanId>(initialPlanId ?? 'beginner')
  const [customWeeks, setCustomWeeks] = useState(storedCustom?.weeks ?? 4)
  const [customSessions, setCustomSessions] = useState<SessionKind[]>(storedCustom?.sessions ?? ['co2'])
  const selected = TrainingPlans.find((plan) => plan.id === planId) ?? TrainingPlans[0]
  const customPlan: CustomPlan = { weeks: customWeeks, sessions: customSessions }
  const continuing = initialPlanId != null && isCurrentPlanChoice(
    { trainingPlan: initialPlanId, customPlan: initialCustomPlan },
    { planId, custom: planId === 'custom' ? customPlan : null },
  )

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
        headerText={t('plan.choose')}
        leftBack={onBack != null}
        leftOnClick={onBack}
        disabled={saving}
      />
      <SOptions showsVerticalScrollIndicator={false}>
        <SRule>
          {t('plan.rule')}
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
                    <SRecommend>{t('plan.startHere')}</SRecommend>
                  ) : null}
                  <SName>{planCopy(plan.id, 'name', t)}</SName>
                </STopText>
                {plan.id === 'custom' ? null : (
                  <SGain>
                    {gainCopy(plan.weeks, outcome.maxHoldSeconds, formatSeconds, t)}
                  </SGain>
                )}
              </STop>
              <SMeta>{planLevelLine(plan.id, t)}</SMeta>
              <SMeta>
                {plan.id === 'custom' && selectedPlan
                  ? t('plan.weeksMeta', {
                    weeks: customWeeks,
                    frequency: customPlanFrequency(customSessions, t),
                  })
                  : planCopy(plan.id, 'frequency', t)}
              </SMeta>
              <SFocus>{planCopy(plan.id, 'focus', t)}</SFocus>
              {plan.id === 'custom' && selectedPlan ? null : (
                <SMethod>{methodCopy(plan, outcome, formatSeconds, t)}</SMethod>
              )}
              </SCardPress>
              {plan.id === 'custom' && selectedPlan ? (
                <SBuilder>
                  <SettingsStepper
                    label={t('plan.weeks')}
                    value={customWeeks}
                    min={MIN_CUSTOM_WEEKS}
                    max={MAX_CUSTOM_WEEKS}
                    onChange={setCustomWeeks}
                  />
                  <SSessionLabel>{t('plan.eachWeek')}</SSessionLabel>
                  <SSessionRow>
                    {CustomSessionChoices.map((choice) => (
                      <SSessionChoice key={choice.kind}>
                        <SettingsChoice
                          label={tableTypeLabel(choice.kind, t)}
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
          title={continuing
            ? t('plan.continue')
            : selected.id === 'custom'
              ? t('plan.startYour')
              : t('plan.startNamed', { name: planCopy(selected.id, 'name', t) })}
          onPress={() => onStart({
            planId: selected.id,
            custom: selected.id === 'custom' ? customPlan : null,
          })}
          loading={saving}
        />
        <Button
          title={t('plan.retake')}
          onPress={onRetake}
          disabled={saving}
          variant='ghost'
        />
      </Footer>
    </Wrapper>
  )
}

function gainCopy(
  weeks: number,
  baselineSeconds: number,
  formatSeconds: (seconds: number) => string,
  t: Translate,
): string {
  const estimate = estimatedApneaTimes(weeks, baselineSeconds)
  return t('plan.gain', {
    previous: formatSeconds(estimate.previous),
    next: formatSeconds(estimate.next),
  })
}

function methodCopy(
  plan: TrainingPlan,
  outcome: BaselineOutcome,
  formatSeconds: (seconds: number) => string,
  t: Translate,
): string {
  if (plan.id !== 'beginner') return planCopy(plan.id, 'method', t)
  const hold = beginnerBaseHold(outcome.maxHoldSeconds, outcome.contractionSeconds)
  const marked = usesMarkedContraction(outcome.contractionSeconds)
  return t(marked ? 'plan.methodBeginnerMarked' : 'plan.methodBeginnerUnmarked', {
    time: formatSeconds(hold),
  })
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
  color: ${Colors.TextMuted};
`

const SCard = styled.View<{ $selected: boolean }>`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 16px;
  border-width: 2px;
  border-color: ${(props) => props.$selected ? Colors.Seafoam : Colors.Hairline};
  background-color: ${(props) => props.$selected ? Colors.SeafoamMuted : Colors.Card};
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
  color: ${Colors.Seafoam};
`

const SRecommend = styled.Text`
  font-size: ${FontSizes.XSmall};
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
`

const SName = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Large};
  font-weight: 800;
  color: ${Colors.Text};
`

const SMeta = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  color: ${Colors.TextMuted};
`

const SFocus = styled.Text`
  margin-top: 10px;
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.Text};
`

const SMethod = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SBuilder = styled.View`
  margin-top: 8px;
`

const SSessionLabel = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.TextMuted};
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
