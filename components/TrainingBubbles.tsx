import { Circle, Group } from '@shopify/react-native-skia'
import { SharedValue, useDerivedValue } from 'react-native-reanimated'


type BubbleSpec = {
  lane: number
  r: number
  speed: number
  phase: number
  wobble: number
  drift: number
}

const Bubbles: BubbleSpec[] = [
  { lane: 0.08, r: 8, speed: 0.07, phase: 0.02, wobble: 0.9, drift: 12 },
  { lane: 0.16, r: 14, speed: 0.045, phase: 0.55, wobble: 0.6, drift: 16 },
  { lane: 0.28, r: 6, speed: 0.11, phase: 0.3, wobble: 1.3, drift: 10 },
  { lane: 0.37, r: 11, speed: 0.06, phase: 0.78, wobble: 0.75, drift: 14 },
  { lane: 0.48, r: 18, speed: 0.04, phase: 0.14, wobble: 0.5, drift: 18 },
  { lane: 0.58, r: 7, speed: 0.09, phase: 0.42, wobble: 1.1, drift: 11 },
  { lane: 0.66, r: 12, speed: 0.055, phase: 0.9, wobble: 0.7, drift: 15 },
  { lane: 0.74, r: 5, speed: 0.13, phase: 0.22, wobble: 1.4, drift: 8 },
  { lane: 0.82, r: 15, speed: 0.048, phase: 0.66, wobble: 0.55, drift: 16 },
  { lane: 0.9, r: 9, speed: 0.08, phase: 0.08, wobble: 1, drift: 12 },
  { lane: 0.22, r: 10, speed: 0.065, phase: 0.48, wobble: 0.85, drift: 13 },
  { lane: 0.53, r: 6, speed: 0.1, phase: 0.86, wobble: 1.2, drift: 9 },
]

type Frame = { width: number; height: number }

type Props = {
  time: SharedValue<number>
  frame: SharedValue<Frame>
}

function bubbleTransform(time: number, frame: Frame, spec: BubbleSpec) {
  'worklet'
  const span = frame.height + spec.r * 2
  const travel = (time * spec.speed + spec.phase) % 1
  const x = frame.width * spec.lane + Math.sin(time * spec.wobble + spec.phase * 6.2) * spec.drift
  const y = frame.height + spec.r - travel * span
  return [
    { translateX: x },
    { translateY: y },
  ]
}

function Bubble({
  spec,
  time,
  frame,
}: {
  spec: BubbleSpec
  time: SharedValue<number>
  frame: SharedValue<Frame>
}) {
  const transform = useDerivedValue(() => bubbleTransform(time.value, frame.value, spec))
  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={spec.r} color='rgba(255,255,255,0.22)' />
      <Circle
        cx={0}
        cy={0}
        r={spec.r}
        style='stroke'
        strokeWidth={1.6}
        color='rgba(255,255,255,0.92)'
      />
      <Circle
        cx={-spec.r * 0.34}
        cy={-spec.r * 0.34}
        r={spec.r * 0.26}
        color='rgba(255,255,255,0.9)'
      />
    </Group>
  )
}

export default function TrainingBubbles({ time, frame }: Props) {
  return (
    <>
      {Bubbles.map((spec) => (
        <Bubble key={`${spec.lane}-${spec.phase}`} spec={spec} time={time} frame={frame} />
      ))}
    </>
  )
}
