import { TableType, TableTypeLabel, TableTypes } from '@/constants/tables'
import { Colors, FontSizes } from '@/design/styles'
import { styled } from 'styled-components/native'


type Props = {
  value: TableType
  onChange: (next: TableType) => void
}

export default function TableTypeSwitch({ value, onChange }: Props) {
  return (
    <Wrapper>
      {TableTypes.map((type) => (
        <SOption
          key={type}
          $selected={value === type}
          onPress={() => onChange(type)}
        >
          <SLabel $selected={value === type}>{TableTypeLabel[type]}</SLabel>
        </SOption>
      ))}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  margin: 8px 20px 4px;
  padding: 4px;
  border-radius: 12px;
  background-color: ${Colors.GreyBackground};
`

const SOption = styled.Pressable<{ $selected: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  align-items: center;
  background-color: ${(props) => props.$selected ? Colors.White : 'transparent'};
`

const SLabel = styled.Text<{ $selected: boolean }>`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${(props) => props.$selected ? Colors.TealPrimary : Colors.GreyPrimary};
`
