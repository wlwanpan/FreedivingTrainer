import { Colors, Layout } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  onPress?: () => void
  disabled?: boolean
}

export default function BackBtn({ onPress, disabled }: Props) {
  const { t } = useI18n()
  return (
    <SButton
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={t('common.back')}
    >
      {({ pressed }) => (
        <Ionicons
          name='chevron-back-outline'
          size={28}
          color={pressed || disabled ? Colors.TextMuted : Colors.Text}
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
