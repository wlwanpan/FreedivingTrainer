import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import TableRoundRow from '@/components/TableRoundRow'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { BaselineOutcome } from '@/hooks/useBaselineTest'
import { Translate } from '@/i18n/types'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
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
  const { t } = useI18n()
  const { formatSeconds } = useFormatterContext()
  const plan = outcome.plan

  if (outcome.tooShort || plan == null) {
    return (
      <Wrapper>
        <HeaderWithBtn headerText={t('baseline.title')} />
        <SBody>
          <STitle>{t('baseline.tooShort')}</STitle>
          <SBodyCopy>
            {t('baseline.tooShortCopy', {
              time: formatSeconds(outcome.maxHoldSeconds),
              minimum: formatSeconds(MIN_BASELINE_SECONDS),
            })}
          </SBodyCopy>
        </SBody>
        <Footer>
          <Button title={t('common.tryAgain')} onPress={onRetake} />
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
      <HeaderWithBtn headerText={t('baseline.yourTables')} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <SStats>
          <SStat>
            <SStatLabel>{t('baseline.maximum')}</SStatLabel>
            <SStatValue>{formatSeconds(outcome.maxHoldSeconds)}</SStatValue>
          </SStat>
          <SStat>
            <SStatLabel>{t('baseline.contraction')}</SStatLabel>
            <SStatValue>
              {outcome.contractionSeconds == null ? '—' : formatSeconds(outcome.contractionSeconds)}
            </SStatValue>
          </SStat>
        </SStats>
        <SCopy>{co2Explanation(outcome, percent, formatSeconds, t)}</SCopy>

        <SSection>{t('tables.co2')}</SSection>
        <SCopy>
          {t('baseline.co2Hold', {
            hold: formatSeconds(plan.co2HoldSeconds),
            start: formatSeconds(plan.co2RestStartSeconds),
            step: formatSeconds(plan.co2RestStepSeconds),
            end: formatSeconds(closingRest),
          })}
        </SCopy>
        {co2Rounds.map((round) => (
          <TableRoundRow key={`co2-${round.index}`} round={round} />
        ))}

        <SSection>{t('tables.o2')}</SSection>
        <SCopy>
          {o2First && o2Last
            ? t('baseline.o2Climb', {
              first: formatSeconds(o2First.holdSeconds),
              last: formatSeconds(o2Last.holdSeconds),
              rest: formatSeconds(plan.o2RestSeconds),
            })
            : t('baseline.o2Default')}
        </SCopy>
        {o2Rounds.map((round) => (
          <TableRoundRow key={`o2-${round.index}`} round={round} />
        ))}
      </SScroll>
      <Footer>
        <Button title={t('baseline.choosePlan')} onPress={onUse} loading={saving} />
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

function co2Explanation(
  outcome: BaselineOutcome,
  percent: number,
  formatSeconds: (seconds: number) => string,
  t: Translate,
): string {
  const plan = outcome.plan
  if (plan == null) return ''
  const hold = t('baseline.percentHold', {
    time: formatSeconds(plan.co2HoldSeconds),
    percent,
  })
  if (outcome.contractionSeconds == null || plan.co2HoldReason === 'midpoint') {
    return t('baseline.explainMidpoint', { hold })
  }
  const at = formatSeconds(outcome.contractionSeconds)
  if (plan.co2HoldReason === 'contraction') {
    return t('baseline.explainContraction', { at, hold })
  }
  if (plan.co2HoldReason === 'below-band') {
    return t('baseline.explainBelow', { at, hold })
  }
  return t('baseline.explainAbove', { at, hold })
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
  color: ${Colors.Text};
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
  background-color: ${Colors.SeafoamMuted};
`

const SStatLabel = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.TextMuted};
`

const SStatValue = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.Text};
`

const SSection = styled.Text`
  margin-top: 22px;
  margin-bottom: 4px;
  padding: 0 20px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SBodyCopy = styled.Text`
  margin-top: 12px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`

const SCopy = styled.Text`
  margin-top: 8px;
  padding: 0 20px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`
