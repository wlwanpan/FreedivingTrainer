import { Colors, Layout } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect'
import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  connected: boolean
  accessibilityLabel: string
  onPress: () => void
}

export default function WatchHeaderButton({ connected, accessibilityLabel, onPress }: Props) {
  const liquid = useLiquidGlassButton()
  const icon = (
    <>
      <Ionicons
        name={connected ? 'watch' : 'watch-outline'}
        size={18}
        color={connected ? Colors.Seafoam : Colors.TextDisabled}
      />
      <SWatchPip $connected={connected} $onGlass={liquid} />
    </>
  )

  if (liquid) {
    return (
      <SGlass
        isInteractive
        glassEffectStyle='regular'
        colorScheme='light'
        tintColor={Colors.SeafoamMuted}
      >
        <SHeaderBtn
          $glass
          accessibilityRole='button'
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
        >
          {icon}
        </SHeaderBtn>
      </SGlass>
    )
  }

  return (
    <SHeaderBtn
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      {icon}
    </SHeaderBtn>
  )
}

function useLiquidGlassButton(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduced)
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced)
    return () => sub.remove()
  }, [])

  return !reduced && liquidGlassSupported()
}

function liquidGlassSupported(): boolean {
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable()
  } catch {
    return false
  }
}

const SGlass = styled(GlassView)`
  flex-shrink: 0;
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  border-radius: ${Layout.MinControl / 2}px;
`

const SHeaderBtn = styled.Pressable<{ $glass?: boolean }>`
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

const SWatchPip = styled.View<{ $connected: boolean; $onGlass: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => props.$connected ? Colors.Seafoam : Colors.TextDisabled};
  border-width: 1.5px;
  border-color: ${(props) => props.$onGlass ? Colors.Card : Colors.SeafoamMuted};
`
