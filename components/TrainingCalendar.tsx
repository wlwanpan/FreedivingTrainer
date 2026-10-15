import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import {
  dayStamp,
  formatMonthYear,
  monthFromDay,
  shiftMonth,
  todayDate,
} from '@/utils/date'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMemo, useState } from 'react'
import { styled } from 'styled-components/native'


const Weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

type Props = {
  trainedDays: Set<string>
  selectedDay?: string | null
  onSelectDay?: (day: string) => void
}

export default function TrainingCalendar({ trainedDays, selectedDay = null, onSelectDay }: Props) {
  const today = todayDate()
  const [cursor, setCursor] = useState(() => initialMonth(trainedDays, today))
  const { year, month } = cursor
  const cells = useMemo(() => monthCells(year, month), [year, month])
  const earliest = monthFromDay([...trainedDays].sort()[0] ?? '')
  const latest = monthFromDay(today)
  const canGoBack = earliest != null && (year > earliest.year || (year === earliest.year && month > earliest.month))
  const canGoForward = latest != null && (year < latest.year || (year === latest.year && month < latest.month))

  return (
    <Wrapper>
      <SHeader>
        <SNav
          onPress={() => canGoBack && setCursor(shiftMonth(year, month, -1))}
          disabled={!canGoBack}
          accessibilityLabel='Previous month'
        >
          <Ionicons
            name='chevron-back'
            size={18}
            color={canGoBack ? Colors.Seafoam : Colors.TextDisabled}
          />
        </SNav>
        <SMonth>{formatMonthYear(year, month)}</SMonth>
        <SNav
          onPress={() => canGoForward && setCursor(shiftMonth(year, month, 1))}
          disabled={!canGoForward}
          accessibilityLabel='Next month'
        >
          <Ionicons
            name='chevron-forward'
            size={18}
            color={canGoForward ? Colors.Seafoam : Colors.TextDisabled}
          />
        </SNav>
      </SHeader>
      <SWeekRow>
        {Weekdays.map((label, index) => (
          <SWeekday key={`${label}-${index}`}>{label}</SWeekday>
        ))}
      </SWeekRow>
      <SGrid>
        {cells.map((cell, index) => {
          if (cell == null) {
            return <SPad key={`pad-${index}`} />
          }
          const key = dayStamp(year, month, cell)
          const trained = trainedDays.has(key)
          const isToday = key === today
          const selected = key === selectedDay
          return (
            <SCell
              key={key}
              onPress={() => onSelectDay?.(key)}
              accessibilityRole='button'
              accessibilityState={{ selected }}
              accessibilityLabel={dayLabel(cell, trained, selected)}
            >
              <SMark $trained={trained} $today={isToday && !trained} $selected={selected}>
                <SDayText $trained={trained} $today={isToday} $selected={selected}>{cell}</SDayText>
              </SMark>
            </SCell>
          )
        })}
      </SGrid>
    </Wrapper>
  )
}

function initialMonth(days: Set<string>, today: string): { year: number; month: number } {
  const latest = [...days].sort().at(-1)
  return monthFromDay(latest ?? today) ?? monthFromDay(today) ?? { year: 2026, month: 0 }
}

function dayLabel(day: number, trained: boolean, selected: boolean): string {
  const marks = [
    trained ? 'trained' : null,
    selected ? 'selected' : null,
  ].filter((mark): mark is string => mark != null)
  return marks.length === 0 ? String(day) : `${day}, ${marks.join(', ')}`
}

function monthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay()
  const count = new Date(year, month + 1, 0).getDate()
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ]
}

const Wrapper = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 20px ${Space.md}px ${Space.md}px;
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

const SHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${Space.sm}px;
`

const SNav = styled.Pressable`
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  align-items: center;
  justify-content: center;
`

const SMonth = styled.Text`
  flex: 1;
  text-align: center;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SWeekRow = styled.View`
  flex-direction: row;
  margin-bottom: ${Space.xs}px;
`

const SWeekday = styled.Text`
  width: 14.2857%;
  text-align: center;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`

const SPad = styled.View`
  width: 14.2857%;
  aspect-ratio: 1;
`

const SCell = styled.Pressable`
  width: 14.2857%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
`

const SMark = styled.View<{ $trained: boolean; $today: boolean; $selected: boolean }>`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: ${Radii.Pill}px;
  background-color: ${(props) => (
    props.$trained ? Colors.Seafoam : props.$selected ? Colors.CardAlt : 'transparent'
  )};
  border-width: ${(props) => (props.$selected ? 2 : 1)}px;
  border-color: ${(props) => (
    props.$selected || props.$today ? Colors.Lagoon : 'transparent'
  )};
`

const SDayText = styled.Text<{ $trained: boolean; $today: boolean; $selected: boolean }>`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  font-variant: tabular-nums;
  color: ${(props) => (
    props.$trained ? Colors.OnSeafoam : props.$selected || props.$today ? Colors.Lagoon : Colors.Text
  )};
`
