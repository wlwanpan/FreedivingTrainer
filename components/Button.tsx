import { Colors, Fonts, FontSizes, Layout, Radii } from '@/design/styles'
import { ActivityIndicator, PressableProps } from 'react-native'
import { styled } from 'styled-components/native'


export type ButtonVariant = 'primary' | 'ghost' | 'muted' | 'danger'

type Props = PressableProps & {
  title: string
  variant?: ButtonVariant
  defaultBGColor?: string
  pressedBGColor?: string
  loading?: boolean
  onPress?: () => void
}

const Palette: Record<ButtonVariant, {
  bg: string
  pressed: string
  text: string
  border: string
}> = {
  primary: {
    bg: Colors.Seafoam,
    pressed: Colors.SeafoamPressed,
    text: Colors.OnSeafoam,
    border: 'transparent',
  },
  ghost: {
    bg: Colors.CardAlt,
    pressed: Colors.Hover,
    text: Colors.Text,
    border: Colors.Aquamarine,
  },
  muted: {
    bg: Colors.Hover,
    pressed: Colors.CardAlt,
    text: Colors.Text,
    border: 'transparent',
  },
  danger: {
    bg: Colors.Alert,
    pressed: Colors.AlertPressed,
    text: Colors.OnSeafoam,
    border: 'transparent',
  },
}

export default function Button({
  title,
  variant = 'primary',
  onPress,
  style,
  pressedBGColor,
  defaultBGColor,
  loading = false,
  disabled,
  ...props
}: Props) {
  const isDisabled = disabled || loading
  const tone = Palette[variant]

  return (
    <Wrapper
      onPress={onPress}
      disabled={isDisabled}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        {
          backgroundColor: state.pressed
            ? pressedBGColor || tone.pressed
            : defaultBGColor || tone.bg,
          borderColor: tone.border,
          borderWidth: tone.border === 'transparent' ? 0 : 1,
          opacity: loading ? 1 : (isDisabled ? 0.5 : 1),
          transform: [{ scale: state.pressed && !isDisabled ? 0.98 : 1 }],
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size='small' color={tone.text} />
      ) : (
        <SText $tone={tone.text}>{title}</SText>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  flex-shrink: 0;
  padding: 12px;
  margin-bottom: 8px;
  width: 100%;
  min-height: ${Layout.PrimaryButton}px;
  border-radius: ${Radii.Button}px;
  justify-content: center;
`

const SText = styled.Text<{ $tone: string }>`
  color: ${(props) => props.$tone};
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  text-align: center;
`
