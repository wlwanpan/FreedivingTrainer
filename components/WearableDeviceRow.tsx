import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ComponentProps } from 'react'
import { ActivityIndicator } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  title: string
  subtitle: string
  icon: ComponentProps<typeof Ionicons>['name']
  comingSoon?: boolean
  selected?: boolean
  loading?: boolean
  last?: boolean
  onPress?: () => void
}

export default function WearableDeviceRow({
  title,
  subtitle,
  icon,
  comingSoon = false,
  selected = false,
  loading = false,
  last = false,
  onPress,
}: Props) {
  const { t } = useI18n()
  const disabled = comingSoon || loading

  return (
    <Wrapper
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityState={{ disabled: comingSoon, selected }}
      accessibilityLabel={comingSoon ? t('wearable.comingSoonA11y', { title }) : title}
    >
      {({ pressed }) => (
        <SRow $last={last} $pressed={pressed && !disabled}>
          <SIcon $muted={comingSoon}>
            <Ionicons
              name={icon}
              size={22}
              color={comingSoon ? Colors.TextDisabled : Colors.Seafoam}
            />
          </SIcon>
          <SCopy>
            <STitle $muted={comingSoon}>{title}</STitle>
            <SSubtitle>{subtitle}</SSubtitle>
          </SCopy>
          {loading ? (
            <ActivityIndicator size='small' color={Colors.Seafoam} />
          ) : comingSoon ? (
            <SSoon>
              <SSoonLabel>{t('wearable.comingSoon')}</SSoonLabel>
            </SSoon>
          ) : selected ? (
            <Ionicons name='checkmark-circle' size={22} color={Colors.Seafoam} />
          ) : (
            <Ionicons name='chevron-forward' size={18} color={Colors.TextMuted} />
          )}
        </SRow>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  min-height: ${Layout.MinControl}px;
`

const SRow = styled.View<{ $last: boolean; $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${Space.md}px;
  padding: ${Space.md}px;
  border-bottom-width: ${(props) => props.$last ? 0 : 1}px;
  border-bottom-color: ${Colors.Hairline};
  background-color: ${(props) => props.$pressed ? Colors.Hover : Colors.Card};
`

const SIcon = styled.View<{ $muted: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${Radii.Control}px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.$muted ? Colors.Telemetry : Colors.SeafoamMuted};
`

const SCopy = styled.View`
  flex: 1;
  gap: ${Space.xs}px;
`

const STitle = styled.Text<{ $muted: boolean }>`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${(props) => props.$muted ? Colors.TextMuted : Colors.Text};
`

const SSubtitle = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SSoon = styled.View`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: ${Radii.Pill}px;
  background-color: ${Colors.SeafoamMuted};
`

const SSoonLabel = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`
