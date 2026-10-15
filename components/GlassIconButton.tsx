import { Colors, Layout } from '@/design/styles'
import useLiquidGlass from '@/hooks/useLiquidGlass'
import { GlassView } from 'expo-glass-effect'
import { PressableProps } from 'react-native'
import { styled } from 'styled-components/native'


type Props = PressableProps & {
  accessibilityLabel: string
}

export default function GlassIconButton({
  accessibilityLabel,
  children,
  disabled,
  onPress,
  ...props
}: Props) {
  const liquid = useLiquidGlass()
  const button = (
    <SButton
      $glass={liquid}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      {children}
    </SButton>
  )

  if (!liquid) return button

  return (
    <SGlass
      isInteractive={!disabled}
      glassEffectStyle='regular'
      colorScheme='light'
      tintColor={Colors.SeafoamMuted}
    >
      {button}
    </SGlass>
  )
}

const SGlass = styled(GlassView)`
  flex-shrink: 0;
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  border-radius: ${Layout.MinControl / 2}px;
`

const SButton = styled.Pressable<{ $glass?: boolean }>`
  flex-shrink: 0;
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  border-radius: ${Layout.MinControl / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.$glass ? 'transparent' : Colors.SeafoamMuted};
  border-width: ${(props) => props.$glass ? 0 : 1}px;
  border-color: ${Colors.HairlineStrong};
`
