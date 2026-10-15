import GlassIconButton from '@/components/GlassIconButton'
import { Colors } from '@/design/styles'
import useLiquidGlass from '@/hooks/useLiquidGlass'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


type Props = {
  connected: boolean
  accessibilityLabel: string
  onPress: () => void
}

export default function WatchHeaderButton({ connected, accessibilityLabel, onPress }: Props) {
  const liquid = useLiquidGlass()
  return (
    <GlassIconButton
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      <Ionicons
        name={connected ? 'watch' : 'watch-outline'}
        size={18}
        color={connected ? Colors.Seafoam : Colors.TextDisabled}
      />
      <SWatchPip $connected={connected} $onGlass={liquid} />
    </GlassIconButton>
  )
}

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
