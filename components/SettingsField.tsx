import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ComponentProps, ReactNode } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  icon: ComponentProps<typeof Ionicons>['name']
  title: string
  note?: string
  value?: string
  last?: boolean
  accessory?: ReactNode
  accessibilityLabel?: string
  onPress?: () => void
  children?: ReactNode
}

export default function SettingsField({
  icon,
  title,
  note,
  value,
  last = false,
  accessory,
  accessibilityLabel,
  onPress,
  children,
}: Props) {
  const head = (
    <SHead>
      <SIcon>
        <Ionicons name={icon} size={18} color={Colors.Seafoam} />
      </SIcon>
      <SCopy>
        <STitle>{title}</STitle>
        {note ? <SNote>{note}</SNote> : null}
      </SCopy>
      {accessory ? <SAccessory>{accessory}</SAccessory> : null}
      {onPress ? (
        <>
          {value ? <SValue>{value}</SValue> : null}
          <Ionicons name='chevron-forward' size={18} color={Colors.TextMuted} />
        </>
      ) : null}
    </SHead>
  )

  return (
    <Wrapper $last={last}>
      {onPress ? (
        <SPress
          onPress={onPress}
          accessibilityRole='button'
          accessibilityLabel={accessibilityLabel ?? title}
        >
          {({ pressed }) => (
            <SPressInner $pressed={pressed}>{head}</SPressInner>
          )}
        </SPress>
      ) : head}
      {children ? <SBody>{children}</SBody> : null}
    </Wrapper>
  )
}

const Wrapper = styled.View<{ $last: boolean }>`
  padding-top: ${Space.md}px;
  padding-bottom: ${(props) => props.$last ? 0 : Space.md}px;
  border-bottom-width: ${(props) => props.$last ? 0 : 1}px;
  border-bottom-color: ${Colors.Hairline};
`

const SPress = styled.Pressable`
  min-height: ${Layout.MinControl}px;
  margin: -8px -8px 0;
`

const SPressInner = styled.View<{ $pressed: boolean }>`
  flex: 1;
  justify-content: center;
  min-height: ${Layout.MinControl}px;
  padding: 8px;
  border-radius: ${Radii.Control}px;
  background-color: ${(props) => props.$pressed ? Colors.Hover : 'transparent'};
`

const SHead = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`

const SIcon = styled.View`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${Radii.Control}px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SAccessory = styled.View`
  flex-shrink: 0;
`

const SCopy = styled.View`
  flex: 1;
  min-width: 0;
`

const STitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SNote = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SValue = styled.Text`
  flex-shrink: 1;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Text};
`

const SBody = styled.View`
  margin-top: ${Space.sm}px;
`
