import { Colors } from '@/design/styles'
import { ActivityIndicator, PressableProps } from 'react-native'
import { styled } from 'styled-components/native'


type Props = PressableProps & {
  title: string
  defaultBGColor?: string
  pressedBGColor?: string
  loading?: boolean
  onPress?: () => void
}

export default function Button({
  title,
  onPress,
  style,
  pressedBGColor,
  defaultBGColor,
  loading = false,
  disabled,
  ...props
}: Props) {
  const isDisabled = disabled || loading

  return (
    <Wrapper
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        {
          backgroundColor: pressed
            ? pressedBGColor || Colors.TealFaded
            : defaultBGColor || Colors.TealPrimary,
          opacity: loading ? 1 : (isDisabled ? 0.5 : 1),
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size='small' color={Colors.White} />
      ) : (
        <SText>{title}</SText>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  padding: 12px;
  margin-bottom: 8px;
  width: 100%;
  border-radius: 12px;
`

const SText = styled.Text`
  color: ${Colors.White};
  font-size: 18px;
  text-align: center;
`
