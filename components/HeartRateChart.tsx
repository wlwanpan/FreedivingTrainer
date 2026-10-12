import { TableTypeLabel } from '@/constants/tables'
import { Colors, FontSizes } from '@/design/styles'
import { HeartRateSample, Session } from '@/db/schema'
import { useFormatterContext } from '@/providers/formatter'
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
  const { heartRates, sessions } = useSQLContext()
  const { formatDay } = useFormatterContext()
  const font = useMemo(() => matchFont({ fontFamily: 'Helvetica', fontSize: 12 }), [])
  const { session, points } = latestSessionSamples(heartRates, sessions)

  return (
    <>
      <SSection>Heart rate</SSection>
      {points.length === 0 || session == null ? (
        <SEmpty>Finish a table with your Apple Watch to see heart rate.</SEmpty>
      ) : (
        <Chart session={session} points={points} font={font} dayLabel={formatDay(session.day)} />
      )}
    </>
  )
}

function Chart({
  session,
  points,
  font,
  dayLabel,
}: {
  session: Session
  points: Point[]
  font: ReturnType<typeof matchFont>
  dayLabel: string
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
      <SCaption>{`${dayLabel} · ${TableTypeLabel[session.tableType]}`}</SCaption>
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
            labelColor: { x: Colors.GreyPrimary, y: Colors.GreyPrimary },
            lineColor: { grid: Colors.GreyDivider, frame: Colors.GreyDivider },
            formatXLabel: (value) => value == null ? '' : clockLabel(value),
            formatYLabel: (value) => value == null ? '' : String(Math.round(value)),
          }}
        >
          {({ points: series }) => (
            <>
              <Line points={series.bpm} color={Colors.CoralPrimary} strokeWidth={3} />
              <Scatter points={series.bpm} radius={4} color={Colors.CoralPrimary} />
            </>
          )}
        </CartesianChart>
      </SChart>
    </Wrapper>
  )
}

const SSection = styled.Text`
  margin: 22px 20px 8px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`

const SEmpty = styled.Text`
  margin: 0 20px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.DeepPrimary};
`

const Wrapper = styled.View`
  padding: 0 20px;
`

const SCaption = styled.Text`
  margin-bottom: 8px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.GreyPrimary};
`

const SChart = styled.View`
  height: 220px;
`
