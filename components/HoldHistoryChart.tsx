import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { BaselineTest, Setting } from '@/db/schema'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { matchFont } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { CartesianChart, Line, Scatter } from 'victory-native'
import { styled } from 'styled-components/native'

const DayMs = 86_400_000

type HoldPoint = {
  at: number
  hold: number
  contraction: number | null
}

function dayStamp(ms: number): string {
  const date = new Date(ms)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function chartPoints(tests: BaselineTest[], settings: Setting): HoldPoint[] {
  if (tests.length > 0) {
    return tests.map((test) => ({
      at: test.testedAt.getTime(),
      hold: test.maxHoldSeconds,
      contraction: test.contractionSeconds,
    }))
  }
  if (settings.baselineMaxHoldSeconds == null || settings.baselineTestedAt == null) {
    return []
  }
  return [{
    at: settings.baselineTestedAt.getTime(),
    hold: settings.baselineMaxHoldSeconds,
    contraction: settings.baselineContractionSeconds,
  }]
}

export default function HoldHistoryChart() {
  const { settings, baselineTests } = useSQLContext()
  const { formatDay, formatSeconds } = useFormatterContext()
  const font = useMemo(() => matchFont({ fontFamily: 'Helvetica', fontSize: 12 }), [])
  const points = chartPoints(baselineTests, settings)

  if (points.length === 0) {
    return (
      <Wrapper>
        <STitle>Hold history</STitle>
        <SEmpty>Take a baseline test to see breath-hold and first contraction over time.</SEmpty>
      </Wrapper>
    )
  }

  const peak = Math.max(...points.flatMap((point) => [point.hold, point.contraction ?? 0]))
  const domain = points.length < 2
    ? { x: [points[0].at - DayMs, points[0].at + DayMs] as [number, number], y: [0, Math.max(peak, 1)] as [number, number] }
    : { y: [0, Math.max(peak, 1)] as [number, number] }

  return (
    <Wrapper>
      <STitle>Hold history</STitle>
      <SLegend>
        <SKey>
          <SSwatch style={{ backgroundColor: Colors.Seafoam }} />
          <SKeyLabel>Breath-hold</SKeyLabel>
        </SKey>
        <SKey>
          <SSwatch style={{ backgroundColor: Colors.Alert }} />
          <SKeyLabel>First contraction</SKeyLabel>
        </SKey>
      </SLegend>
      <SChart>
        <CartesianChart
          data={points}
          xKey='at'
          yKeys={['hold', 'contraction']}
          domain={domain}
          domainPadding={{ left: 16, right: 16, top: 20 }}
          padding={{ left: 8, right: 16, top: 12, bottom: 8 }}
          axisOptions={{
            font,
            tickCount: { x: Math.min(4, Math.max(points.length, 2)), y: 4 },
            labelColor: { x: Colors.TextMuted, y: Colors.TextMuted },
            lineColor: { grid: Colors.Hairline, frame: Colors.Hairline },
            formatXLabel: (value) => formatDay(dayStamp(value)),
            formatYLabel: (value) => value == null ? '' : formatSeconds(value),
          }}
        >
          {({ points: series }) => (
            <>
              <Line points={series.hold} color={Colors.Seafoam} strokeWidth={3} />
              <Scatter points={series.hold} radius={4} color={Colors.Seafoam} />
              <Line points={series.contraction} color={Colors.Alert} strokeWidth={3} />
              <Scatter points={series.contraction} radius={4} color={Colors.Alert} />
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

const SLegend = styled.View`
  flex-direction: row;
  gap: ${Space.md}px;
  margin-top: ${Space.sm}px;
  margin-bottom: ${Space.sm}px;
`

const SKey = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`

const SSwatch = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
`

const SKeyLabel = styled.Text`
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.Small};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SChart = styled.View`
  height: 280px;
`
