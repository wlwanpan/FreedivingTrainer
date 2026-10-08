import { Colors, FontSizes } from '@/design/styles'
import { useFormatterContext } from '@/providers/formatter'
import { styled } from 'styled-components/native'


type Props = {
  label: string
  value: number
  mode?: 'duration' | 'count'
  step?: number
  min?: number
  max?: number
  onChange: (next: number) => void
}

export default function SettingsStepper({
  label,
  value,
  mode = 'count',
  step = 1,
  min = 0,
  max = 3600,
  onChange,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const display = mode === 'duration' ? formatSeconds(value) : String(value)

  return (
    <Wrapper>
      <SLabel>{label}</SLabel>
      <SControls>
        <SStep onPress={() => onChange(Math.max(min, value - step))} disabled={value <= min}>
          <SStepText>−</SStepText>
        </SStep>
        <SValue>{display}</SValue>
        <SStep onPress={() => onChange(Math.min(max, value + step))} disabled={value >= max}>
          <SStepText>+</SStepText>
        </SStep>
      </SControls>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.GreyDivider};
`

const SLabel = styled.Text`
  flex: 1;
  font-size: ${FontSizes.Medium};
  color: ${Colors.DeepPrimary};
`

const SControls = styled.View`
  flex-direction: row;
  align-items: center;
`

const SStep = styled.Pressable`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.TealBackground};
`

const SStepText = styled.Text`
  font-size: ${FontSizes.Large};
  color: ${Colors.TealPrimary};
  font-weight: 600;
`

const SValue = styled.Text`
  min-width: 64px;
  text-align: center;
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.DeepPrimary};
`
