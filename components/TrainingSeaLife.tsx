import { Circle, Group, LinearGradient, Line, Path, PathOp, Skia, vec } from '@shopify/react-native-skia'
import { SharedValue, useDerivedValue } from 'react-native-reanimated'


// Pulled from the training sprite: deep figure blue, and the pale glow used for lungs and light.
const Deep = '#013078'
const Glow = '#7EC8F8'
const Eye = '#001E4A'

type SwimSpec = {
  speed: number
  phase: number
  direction: 1 | -1
  lane: number
  bob: number
  bobSpeed: number
  wag: number
  tilt: number
  widthRatio: number
  unitWidth: number
}

const FishA: SwimSpec = {
  speed: 0.055,
  phase: 0.08,
  direction: 1,
  lane: 0.2,
  bob: 0.012,
  bobSpeed: 1.15,
  wag: 1.7,
  tilt: 0.16,
  widthRatio: 0.16,
  unitWidth: 86,
}

const FishB: SwimSpec = {
  speed: 0.042,
  phase: 0.62,
  direction: -1,
  lane: 0.38,
  bob: 0.01,
  bobSpeed: 0.95,
  wag: 1.35,
  tilt: 0.14,
  widthRatio: 0.2,
  unitWidth: 86,
}

const FishC: SwimSpec = {
  speed: 0.07,
  phase: 0.34,
  direction: 1,
  lane: 0.5,
  bob: 0.014,
  bobSpeed: 1.45,
  wag: 1.9,
  tilt: 0.2,
  widthRatio: 0.12,
  unitWidth: 86,
}

const FishD: SwimSpec = {
  speed: 0.048,
  phase: 0.84,
  direction: -1,
  lane: 0.3,
  bob: 0.011,
  bobSpeed: 1.25,
  wag: 1.55,
  tilt: 0.15,
  widthRatio: 0.14,
  unitWidth: 86,
}

const Shark: SwimSpec = {
  speed: 0.028,
  phase: 0.18,
  direction: 1,
  lane: 0.76,
  bob: 0.008,
  bobSpeed: 0.42,
  wag: 0.65,
  tilt: 0.045,
  widthRatio: 0.72,
  unitWidth: 226,
}

const SharkSpots = [
  { x: -64, y: -14, r: 6 },
  { x: -42, y: -20, r: 4 },
  { x: -22, y: -8, r: 6.5 },
  { x: -2, y: -18, r: 3.4 },
  { x: 16, y: -6, r: 5.5 },
  { x: 34, y: -16, r: 3.2 },
  { x: -50, y: -2, r: 3 },
  { x: -18, y: 0, r: 2.8 },
  { x: 4, y: -1, r: 4 },
  { x: 28, y: -2, r: 2.6 },
  { x: 46, y: -10, r: 3.6 },
  { x: -74, y: -8, r: 2.6 },
]

function shape(draw: (path: ReturnType<typeof Skia.Path.Make>) => void) {
  const path = Skia.Path.Make()
  draw(path)
  return path
}

function unite(parts: ReturnType<typeof Skia.Path.Make>[]) {
  const path = parts[0].copy()
  parts.slice(1).forEach((part) => {
    path.op(part, PathOp.Union)
  })
  return path
}

const FishBody = shape((path) => {
  path.addOval(Skia.XYWHRect(-24, -16, 58, 32))
})

const FishTail = shape((path) => {
  path.moveTo(-16, -5)
  path.lineTo(-48, -20)
  path.lineTo(-36, 0)
  path.lineTo(-48, 20)
  path.lineTo(-16, 5)
  path.close()
})

const FishDorsal = shape((path) => {
  path.moveTo(-2, -14)
  path.lineTo(12, -34)
  path.lineTo(24, -12)
  path.close()
})

const FishPectoral = shape((path) => {
  path.moveTo(2, 6)
  path.lineTo(-6, 24)
  path.lineTo(16, 14)
  path.close()
})

const FishOutline = unite([FishBody, FishTail, FishDorsal, FishPectoral])

const SharkBody = shape((path) => {
  path.addOval(Skia.XYWHRect(-96, -32, 168, 64))
})

const SharkHead = shape((path) => {
  path.addCircle(58, 0, 34)
})

const SharkTail = shape((path) => {
  path.moveTo(-84, -8)
  path.lineTo(-132, -36)
  path.lineTo(-112, 0)
  path.lineTo(-134, 34)
  path.lineTo(-84, 10)
  path.close()
})

const SharkDorsal = shape((path) => {
  path.moveTo(-16, -28)
  path.lineTo(4, -68)
  path.lineTo(32, -24)
  path.close()
})

const SharkPectoral = shape((path) => {
  path.moveTo(-8, 16)
  path.lineTo(24, 64)
  path.lineTo(58, 36)
  path.lineTo(18, 12)
  path.close()
})

const SharkOutline = unite([SharkBody, SharkHead, SharkTail, SharkDorsal, SharkPectoral])

const SharkMouth = shape((path) => {
  path.moveTo(72, 14)
  path.quadTo(96, 22, 84, 26)
})

function swimTransform(
  time: number,
  frame: { width: number; height: number },
  spec: SwimSpec,
) {
  'worklet'
  const width = frame.width
  const height = frame.height
  const length = width * spec.widthRatio
  const span = width + length
  const progress = (time * spec.speed + spec.phase) % 1
  const x = spec.direction === 1
    ? -length / 2 + progress * span
    : width + length / 2 - progress * span
  const y = height * spec.lane + Math.sin(time * spec.bobSpeed + spec.phase * 6.2) * height * spec.bob
  const tilt = Math.sin(time * spec.wag + spec.phase * 4) * spec.tilt
  const scale = spec.unitWidth === 0 ? 1 : length / spec.unitWidth
  return [
    { translateX: x },
    { translateY: y },
    { rotate: tilt },
    { scaleX: spec.direction * scale },
    { scaleY: scale },
  ]
}

function useSwim(
  time: SharedValue<number>,
  frame: SharedValue<{ width: number; height: number }>,
  spec: SwimSpec,
) {
  return useDerivedValue(() => swimTransform(time.value, frame.value, spec))
}

type Props = {
  time: SharedValue<number>
  frame: SharedValue<{ width: number; height: number }>
}

function fishShapes(light: string, deep: string) {
  return (
    <>
      <Path path={FishOutline}>
        <LinearGradient start={vec(0, -32)} end={vec(0, 20)} colors={[light, deep]} />
      </Path>
      <Circle cx={20} cy={-2} r={2.4} color={Eye} />
    </>
  )
}

function whaleSharkShapes() {
  return (
    <>
      <Path path={SharkOutline}>
        <LinearGradient start={vec(0, -64)} end={vec(0, 40)} colors={['#2E92D6', Deep]} />
      </Path>
      {SharkSpots.map((spot) => (
        <Circle key={`${spot.x}-${spot.y}`} cx={spot.x} cy={spot.y} r={spot.r} color={Glow} />
      ))}
      <Line p1={{ x: 36, y: -8 }} p2={{ x: 30, y: 14 }} color={Glow} strokeWidth={2.4} strokeCap='round' />
      <Line p1={{ x: 46, y: -10 }} p2={{ x: 40, y: 14 }} color={Glow} strokeWidth={2.4} strokeCap='round' />
      <Line p1={{ x: 56, y: -8 }} p2={{ x: 50, y: 12 }} color={Glow} strokeWidth={2} strokeCap='round' />
      <Circle cx={76} cy={-4} r={3.2} color={Eye} />
      <Path path={SharkMouth} style='stroke' strokeWidth={2} color={Glow} strokeCap='round' />
    </>
  )
}

export default function TrainingSeaLife({ time, frame }: Props) {
  const fishA = useSwim(time, frame, FishA)
  const fishB = useSwim(time, frame, FishB)
  const fishC = useSwim(time, frame, FishC)
  const fishD = useSwim(time, frame, FishD)
  const shark = useSwim(time, frame, Shark)

  return (
    <>
      <Group transform={shark}>
        {whaleSharkShapes()}
      </Group>
      <Group transform={fishA}>
        {fishShapes('#5EBEF2', Deep)}
      </Group>
      <Group transform={fishB}>
        {fishShapes('#8FD4F8', '#0A5AA8')}
      </Group>
      <Group transform={fishC}>
        {fishShapes('#2E8FD4', '#002E75')}
      </Group>
      <Group transform={fishD}>
        {fishShapes('#6EC8F4', '#01509A')}
      </Group>
    </>
  )
}
