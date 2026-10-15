import { ManualTableTypes, TableType } from '@/constants/tables'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { tableTypeLabel } from '@/i18n/labels'
import { useI18n } from '@/providers/i18n'
import { styled } from 'styled-components/native'


type Props = {
  value: TableType
  onChange: (next: TableType) => void
}

export default function TableTypeSwitch({ value, onChange }: Props) {
  const { t } = useI18n()
  return (
    <Wrapper>
      {ManualTableTypes.map((type) => (
        <SOption
          key={type}
          $selected={value === type}
          onPress={() => onChange(type)}
        >
          <SLabel $selected={value === type}>{tableTypeLabel(type, t)}</SLabel>
        </SOption>
      ))}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  margin: ${Space.sm}px ${Space.screen}px ${Space.xs}px;
  padding: 4px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SOption = styled.Pressable<{ $selected: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  align-items: center;
  background-color: ${(props) => props.$selected ? Colors.SegmentTrack : 'transparent'};
`

const SLabel = styled.Text<{ $selected: boolean }>`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${(props) => props.$selected ? Colors.Seafoam : Colors.TextMuted};
`
