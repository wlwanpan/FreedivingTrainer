import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { HeartRateSample, Session } from '@/db/schema'
import { tableTypeLabel } from '@/i18n/labels'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { matchFont } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { CartesianChart, Line, Scatter } from 'victory-native'
import { styled } from 'styled-components/native'


const MinuteMs = 60_000

type Point = {
  at: number
  bpm: number
}

function clockLabel(ms: number): string {
  const date = new Date(ms)
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function latestSessionSamples(samples: HeartRateSample[], sessions: Session[]): {
  session: Session | null
  points: Point[]
} {
  if (samples.length === 0) return { session: null, points: [] }
  const newest = samples.reduce((latest, sample) => (
    sample.recordedAt.getTime() > latest.recordedAt.getTime() ? sample : latest
  ))
  const session = sessions.find((item) => item.id === newest.sessionId) ?? null
  const points = samples
    .filter((sample) => sample.sessionId === newest.sessionId)
    .map((sample) => ({ at: sample.recordedAt.getTime(), bpm: sample.bpm }))
  return { session, points }
}

export default function HeartRateChart() {
  const { t } = useI18n()
  const { heartRates, sessions } = useSQLContext()
  const { formatDay } = useFormatterContext()
  const font = useMemo(() => matchFont({ fontFamily: 'Helvetica', fontSize: 12 }), [])
  const { session, points } = latestSessionSamples(heartRates, sessions)

  if (points.length === 0) {
    return (
      <Wrapper>
        <STitle>{t('charts.heartRate')}</STitle>
        <SEmpty>{t('charts.heartEmpty')}</SEmpty>
      </Wrapper>
    )
  }

  const caption = session == null
    ? ''
    : `${formatDay(session.day)} · ${tableTypeLabel(session.tableType, t)}`

  return (
    <Chart
      points={points}
      font={font}
      title={t('charts.heartRate')}
      caption={caption}
    />
  )
}

function Chart({
  points,
  font,
  title,
  caption,
}: {
  points: Point[]
  font: ReturnType<typeof matchFont>
  title: string
  caption: string
}) {
  const low = Math.min(...points.map((point) => point.bpm))
  const high = Math.max(...points.map((point) => point.bpm))
  const pad = Math.max(8, Math.round((high - low) * 0.2))
  const domain = points.length < 2
    ? {
      x: [points[0].at - MinuteMs, points[0].at + MinuteMs] as [number, number],
      y: [Math.max(0, low - pad), high + pad] as [number, number],
    }
    : { y: [Math.max(0, low - pad), high + pad] as [number, number] }

  return (
    <Wrapper>
      <STitle>{title}</STitle>
      {caption === '' ? null : <SCaption>{caption}</SCaption>}
      <SChart>
        <CartesianChart
          data={points}
          xKey='at'
          yKeys={['bpm']}
          domain={domain}
          domainPadding={{ left: 16, right: 16, top: 20 }}
          padding={{ left: 8, right: 16, top: 12, bottom: 8 }}
          axisOptions={{
            font,
            tickCount: { x: Math.min(4, Math.max(points.length, 2)), y: 4 },
            labelColor: { x: Colors.TextMuted, y: Colors.TextMuted },
            lineColor: { grid: Colors.Hairline, frame: Colors.Hairline },
            formatXLabel: (value) => value == null ? '' : clockLabel(value),
            formatYLabel: (value) => value == null ? '' : String(Math.round(value)),
          }}
        >
          {({ points: series }) => (
            <>
              <Line points={series.bpm} color={Colors.Aquamarine} strokeWidth={3} />
              <Scatter points={series.bpm} radius={4} color={Colors.Aquamarine} />
            </>
          )}
        </CartesianChart>
      </SChart>
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

const STitle = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SEmpty = styled.Text`
  margin-top: ${Space.sm}px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SCaption = styled.Text`
  margin-top: 4px;
  margin-bottom: ${Space.sm}px;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.Small};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SChart = styled.View`
  height: 220px;
`
