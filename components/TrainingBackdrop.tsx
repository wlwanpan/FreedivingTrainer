import TrainingBubbles from '@/components/TrainingBubbles'
import { Colors } from '@/design/styles'
import { Canvas, Fill, LinearGradient, useClock } from '@shopify/react-native-skia'
import { useEffect } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { styled } from 'styled-components/native'


type Props = {
  paused: boolean
}

export default function TrainingBackdrop({ paused }: Props) {
  const clock = useClock()
  const carried = useSharedValue(0)
  const mark = useSharedValue(0)
  const held = useSharedValue(paused ? 1 : 0)
  const frame = useSharedValue({ width: 0, height: 0 })

  useEffect(() => {
    if (paused) {
      carried.value = carried.value + clock.value - mark.value
      held.value = 1
      return
    }
    mark.value = clock.value
    held.value = 0
  }, [paused, carried, clock, held, mark])

  const elapsed = useDerivedValue(() => {
    const ms = held.value === 1
      ? carried.value
      : carried.value + clock.value - mark.value
    return ms / 1000
  })

  const washEnd = useDerivedValue(() => ({
    x: 0,
    y: Math.max(frame.value.height, 1),
  }))

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    if (frame.value.width === width && frame.value.height === height) return
    frame.value = { width, height }
  }

  return (
    <SFill pointerEvents='none' onLayout={onLayout}>
      <SCanvas opaque>
        <Fill>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={washEnd}
            colors={[Colors.Canvas, Colors.CardAlt, Colors.BreathTrack]}
          />
        </Fill>
        <TrainingBubbles time={elapsed} frame={frame} />
      </SCanvas>
    </SFill>
  )
}

const SFill = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`

const SCanvas = styled(Canvas)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`
