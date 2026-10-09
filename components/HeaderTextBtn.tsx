import { Colors, FontSizes, Layout } from '@/design/styles'
import { PressableProps } from 'react-native'
import { styled } from 'styled-components/native'


type Props = PressableProps & {
  text: string
  onClick?: () => void
  disabled?: boolean
}

export default function HeaderTextBtn({ onClick, disabled, text, ...props }: Props) {
  return (
    <Wrapper
      onPress={() => onClick?.()}
      disabled={disabled}
      {...props}
    >
      {({ pressed }) => (
        <SText style={{ color: pressed || disabled ? Colors.GreyPrimary : Colors.DeepPrimary }}>
          {text}
        </SText>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  flex-shrink: 0;
  min-height: ${Layout.MinControl}px;
  justify-content: center;
  padding: 6px 10px;
`

const SText = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 600;
`
