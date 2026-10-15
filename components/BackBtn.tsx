import GlassIconButton from '@/components/GlassIconButton'
import { Colors } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'


type Props = {
  onPress?: () => void
  disabled?: boolean
}

export default function BackBtn({ onPress, disabled }: Props) {
  const { t } = useI18n()
  return (
    <GlassIconButton
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={t('common.back')}
    >
      <Ionicons
        name='chevron-back'
        size={22}
        color={disabled ? Colors.TextDisabled : Colors.Seafoam}
      />
    </GlassIconButton>
  )
}
