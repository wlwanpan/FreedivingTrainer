import { Colors } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable } from 'react-native'


type Props = {
  onPress?: () => void
  disabled?: boolean
}

export default function BackBtn({ onPress, disabled }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <Ionicons
          name='chevron-back-outline'
          size={28}
          color={pressed || disabled ? Colors.GreyPrimary : Colors.DeepPrimary}
        />
      )}
    </Pressable>
  )
}
