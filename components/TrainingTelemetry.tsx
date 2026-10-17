import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { averageFirstContractionSeconds, LoggedContraction } from '@/utils/contractions'
import { styled } from 'styled-components/native'


type Props = {
  elapsedTotalSeconds: number
  totalSeconds: number
  roundIndex: number
  roundCount: number
  heartRateBpm: number | null
  contractions: LoggedContraction[]
  steps?: number | null
  openHold?: boolean
}

export default function TrainingTelemetry({
  elapsedTotalSeconds,
  totalSeconds,
  roundIndex,
  roundCount,
  heartRateBpm,
  contractions,
  steps = null,
  openHold = false,
}: Props) {
  const { t } = useI18n()
  const { sessions } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const unavailable = t('common.unavailable')
  const heartRate = heartRateBpm == null ? unavailable : String(heartRateBpm)
  const avgContraction = averageFirstContractionSeconds(sessions, contractions)

  return (
    <Wrapper
      accessibilityLabel={t('telemetry.a11y', {
        elapsed: formatSeconds(elapsedTotalSeconds),
        total: formatSeconds(totalSeconds),
        contraction: avgContraction == null ? unavailable : formatSeconds(avgContraction),
        round: roundIndex,
        rounds: roundCount,
        heart: heartRateBpm == null ? unavailable : `${heartRateBpm} bpm`,
      })}
    >
      <SRow>
        <SFlexTile>
          <SValue>
            {openHold
              ? formatSeconds(elapsedTotalSeconds)
              : `${formatSeconds(elapsedTotalSeconds)} / ${formatSeconds(totalSeconds)}`}
          </SValue>
          <SLabel>{t('telemetry.time')}</SLabel>
        </SFlexTile>
        <SFlexTile>
          <SValue $muted={steps == null && avgContraction == null}>
            {steps != null ? String(steps) : avgContraction == null ? '—' : formatSeconds(avgContraction)}
          </SValue>
          <SLabel>{steps != null ? t('telemetry.steps') : t('telemetry.avgContraction')}</SLabel>
        </SFlexTile>
      </SRow>
      <SRow>
        <SFlexTile>
          <SValue>{`${roundIndex} / ${roundCount}`}</SValue>
          <SLabel>{t('telemetry.round')}</SLabel>
        </SFlexTile>
        <SFlexTile>
          <SValue $muted={heartRateBpm == null}>{heartRate}</SValue>
          <SLabel>{t('telemetry.heartRate')}</SLabel>
        </SFlexTile>
      </SRow>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-shrink: 0;
  gap: 8px;
  margin: 0 ${Space.screen}px 8px;
  padding: 12px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SRow = styled.View`
  flex-direction: row;
  gap: 8px;
`

const SFlexTile = styled.View`
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  background-color: ${Colors.Telemetry};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SValue = styled.Text<{ $muted?: boolean }>`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  font-variant: tabular-nums;
  color: ${(props) => props.$muted ? Colors.TextMuted : Colors.Text};
`

const SLabel = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`
