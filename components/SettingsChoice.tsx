import { Colors, FontSizes } from '@/design/styles'
import { styled } from 'styled-components/native'


type Props = {
  label: string
  selected: boolean
  onPress: () => void
}

export default function SettingsChoice({ label, selected, onPress }: Props) {
  return (
    <Wrapper $selected={selected} onPress={onPress}>
      <SLabel $selected={selected}>{label}</SLabel>
    </Wrapper>
  )
}

const Wrapper = styled.Pressable<{ $selected: boolean }>`
  flex: 1;
  padding: 10px 8px;
  border-radius: 10px;
  align-items: center;
  background-color: ${(props) => props.$selected ? Colors.TealPrimary : Colors.GreyBackground};
`

const SLabel = styled.Text<{ $selected: boolean }>`
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${(props) => props.$selected ? Colors.White : Colors.DeepPrimary};
`
