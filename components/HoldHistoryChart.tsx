import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import { Colors, FontSizes } from '@/design/styles'
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
      <EmptyListPlaceholder message='Take a baseline test to see breath-hold and first contraction over time.' />
    )
  }

  const peak = Math.max(...points.flatMap((point) => [point.hold, point.contraction ?? 0]))
  const domain = points.length < 2
    ? { x: [points[0].at - DayMs, points[0].at + DayMs] as [number, number], y: [0, Math.max(peak, 1)] as [number, number] }
    : { y: [0, Math.max(peak, 1)] as [number, number] }

  return (
    <Wrapper>
      <SLegend>
        <SKey>
          <SSwatch style={{ backgroundColor: Colors.TealPrimary }} />
          <SKeyLabel>Breath-hold</SKeyLabel>
        </SKey>
        <SKey>
          <SSwatch style={{ backgroundColor: Colors.CoralPrimary }} />
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
            labelColor: { x: Colors.GreyPrimary, y: Colors.GreyPrimary },
            lineColor: { grid: Colors.GreyDivider, frame: Colors.GreyDivider },
            formatXLabel: (value) => formatDay(dayStamp(value)),
            formatYLabel: (value) => value == null ? '' : formatSeconds(value),
          }}
        >
          {({ points: series }) => (
            <>
              <Line points={series.hold} color={Colors.TealPrimary} strokeWidth={3} />
              <Scatter points={series.hold} radius={4} color={Colors.TealPrimary} />
              <Line points={series.contraction} color={Colors.CoralPrimary} strokeWidth={3} />
              <Scatter points={series.contraction} radius={4} color={Colors.CoralPrimary} />
            </>
          )}
        </CartesianChart>
      </SChart>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  padding: 12px 20px 0;
`

const SLegend = styled.View`
  flex-direction: row;
  gap: 16px;
  margin-bottom: 8px;
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
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SChart = styled.View`
  height: 280px;
`
