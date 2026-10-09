import { Colors, Layout } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  onPress?: () => void
  disabled?: boolean
}

export default function BackBtn({ onPress, disabled }: Props) {
  return (
    <SButton onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <Ionicons
          name='chevron-back-outline'
          size={28}
          color={pressed || disabled ? Colors.GreyPrimary : Colors.DeepPrimary}
        />
      )}
    </SButton>
  )
}

const SButton = styled(Pressable)`
  flex-shrink: 0;
  min-width: ${Layout.MinControl}px;
  min-height: ${Layout.MinControl}px;
  justify-content: center;
`
