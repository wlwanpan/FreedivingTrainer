import TrainingSeaLife from '@/components/TrainingSeaLife'
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia'
import { useEffect } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { styled } from 'styled-components/native'


// Flat cartoon swells in Miyako lagoon blue. `time` is seconds.
const WaveSkSL = `
uniform float2 resolution;
uniform float time;

float swell(float x, float frequency, float speed, float phase) {
  return sin(x * frequency + time * speed + phase);
}

float wave(float x, float base, float amp, float freq, float speed, float phase) {
  return base
    + swell(x, freq, speed, phase) * amp
    + swell(x, freq * 2.0, -speed * 0.7, phase + 1.3) * amp * 0.35;
}

float3 paintBand(float3 color, float y, float surface, float3 fill, float3 line, float3 foam) {
  if (y > surface) {
    color = fill;
  }
  if (y > surface && y < surface + 0.032) {
    color = foam;
  }
  if (y > surface + 0.032 && y < surface + 0.046) {
    color = line;
  }
  return color;
}

half4 main(float2 frag) {
  float2 uv = frag / max(resolution, float2(1.0));
  float tide = sin(time * 0.15) * 0.012;
  float s0 = wave(uv.x, 0.12 + tide, 0.05, 3.6, 0.16, 0.4);
  float s1 = wave(uv.x, 0.36 + tide * 0.75, 0.062, 3.1, 0.12, 2.1);
  float s2 = wave(uv.x, 0.58 + tide * 0.55, 0.068, 2.6, 0.09, 4.2);
  float s3 = wave(uv.x, 0.8 + tide * 0.4, 0.055, 2.2, 0.07, 1.1);

  float3 horizon = float3(0.957, 1.0, 0.996);
  float3 shallow = float3(0.788, 0.973, 0.965);
  float3 lagoon = float3(0.557, 0.941, 0.925);
  float3 miyako = float3(0.306, 0.867, 0.847);
  float3 deep = float3(0.133, 0.816, 0.878);
  float3 line = float3(0.071, 0.557, 0.682);
  float3 foam = float3(1.0, 1.0, 1.0);

  float3 color = horizon;
  color = paintBand(color, uv.y, s0, shallow, line, foam);
  color = paintBand(color, uv.y, s1, lagoon, line, foam);
  color = paintBand(color, uv.y, s2, miyako, line, foam);
  color = paintBand(color, uv.y, s3, deep, line, foam);
  return half4(color, 1.0);
}
`

const waveShader = Skia.RuntimeEffect.Make(WaveSkSL)

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

  const uniforms = useDerivedValue(() => ({
    resolution: [frame.value.width, frame.value.height],
    time: elapsed.value,
  }))

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    if (frame.value.width === width && frame.value.height === height) return
    frame.value = { width, height }
  }

  return (
    <SFill pointerEvents='none' onLayout={onLayout}>
      {waveShader ? (
        <SCanvas opaque>
          <Fill>
            <Shader source={waveShader} uniforms={uniforms} />
          </Fill>
          <TrainingSeaLife time={elapsed} frame={frame} />
        </SCanvas>
      ) : null}
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
