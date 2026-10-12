import { Colors, FontSizes, Layout } from '@/design/styles'
import { formatDuration } from '@/utils/duration'
import { useFormatterContext } from '@/providers/formatter'
import { useId, useRef, useState } from 'react'
import { InputAccessoryView, Keyboard, Platform, TextInput } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  label: string
  value: number
  mode?: 'duration' | 'count'
  step?: number
  min?: number
  max?: number
  editable?: boolean
  onChange: (next: number) => void
}

export default function SettingsStepper({
  label,
  value,
  mode = 'count',
  step = 1,
  min = 0,
  max = 3600,
  editable = false,
  onChange,
}: Props) {
  const { formatSeconds } = useFormatterContext()
  const inputRef = useRef<TextInput>(null)
  const skipCommit = useRef(false)
  const accessoryId = `duration-${useId().replace(/:/g, '')}`
  const [editing, setEditing] = useState(false)
  const [digits, setDigits] = useState('')
  const canType = editable && mode === 'duration'
  const display = mode === 'duration' ? formatSeconds(value) : String(value)
  const shown = editing
    ? (digits === '' ? '' : formatDuration(parseClockDigits(digits) ?? 0))
    : display

  const commit = (raw: string) => {
    setEditing(false)
    setDigits('')
    const parsed = parseClockDigits(raw)
    if (parsed == null) return
    onChange(Math.min(max, Math.max(min, parsed)))
  }

  const stepBy = (delta: number) => {
    if (editing) {
      const parsed = parseClockDigits(digits)
      const base = parsed == null ? value : Math.min(max, Math.max(min, parsed))
      skipCommit.current = true
      setEditing(false)
      setDigits('')
      inputRef.current?.blur()
      onChange(Math.min(max, Math.max(min, base + delta)))
      return
    }
    onChange(Math.min(max, Math.max(min, value + delta)))
  }

  const onChangeText = (text: string) => {
    const prevShown = digits === '' ? '' : formatDuration(parseClockDigits(digits) ?? 0)
    if (text === prevShown) return
    if (text.length < prevShown.length) {
      setDigits(digits.slice(0, -1))
      return
    }
    const extra = text.slice(prevShown.length).replace(/\D/g, '')
    if (extra.length > 0) {
      setDigits((digits + extra).slice(0, 4))
      return
    }
    setDigits(text.replace(/\D/g, '').slice(0, 4))
  }

  return (
    <Wrapper>
      <SLabel>{label}</SLabel>
      <SControls>
        <SStep onPress={() => stepBy(-step)} disabled={!editing && value <= min}>
          <SStepText>−</SStepText>
        </SStep>
        {canType ? (
          <SInput
            ref={inputRef}
            value={shown}
            placeholder={display}
            placeholderTextColor={Colors.GreyPrimary}
            keyboardType='number-pad'
            inputMode='numeric'
            inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
            onFocus={() => {
              setEditing(true)
              setDigits('')
            }}
            onBlur={() => {
              if (skipCommit.current) {
                skipCommit.current = false
                return
              }
              commit(digits)
            }}
            onChangeText={onChangeText}
          />
        ) : (
          <SValue>{display}</SValue>
        )}
        <SStep onPress={() => stepBy(step)} disabled={!editing && value >= max}>
          <SStepText>+</SStepText>
        </SStep>
      </SControls>
      {canType && Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={accessoryId}>
          <SAccessory>
            <SDone onPress={() => {
              inputRef.current?.blur()
              Keyboard.dismiss()
            }}>
              <SDoneText>Done</SDoneText>
            </SDone>
          </SAccessory>
        </InputAccessoryView>
      ) : null}
    </Wrapper>
  )
}

function parseClockDigits(raw: string): number | null {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits === '') return null
  if (digits.length <= 2) return Number(digits)
  return Number(digits.slice(0, -2)) * 60 + Number(digits.slice(-2))
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

const SInput = styled(TextInput)`
  min-width: 72px;
  min-height: ${Layout.MinControl}px;
  padding: 8px 4px;
  text-align: center;
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.DeepPrimary};
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.TealPrimary};
`

const SAccessory = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  padding: 4px 12px;
  background-color: ${Colors.White};
  border-top-width: 1px;
  border-top-color: ${Colors.GreyDivider};
`

const SDone = styled.Pressable`
  min-height: ${Layout.MinControl}px;
  justify-content: center;
  padding: 0 8px;
`

const SDoneText = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.TealPrimary};
`
