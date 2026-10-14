import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


type Props = {
  onPress?: () => void
}

export default function DashboardBreathe({ onPress }: Props) {
  return (
    <Wrapper>
      <SLead>
        <SRing>
          <Ionicons name='leaf-outline' size={20} color={Colors.Seafoam} />
        </SRing>
        <SCopy>
          <STitle>Box breathe sync</STitle>
          <SMeta>Calm heart rate before next apnea</SMeta>
        </SCopy>
      </SLead>
      <SAction onPress={onPress}>
        <SActionText>Breathe</SActionText>
      </SAction>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 14px 16px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: 2;
`

const SLead = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`

const SRing = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.SeafoamMuted};
  border-width: 3px;
  border-color: ${Colors.Lagoon};
`

const SCopy = styled.View`
  flex: 1;
`

const STitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SMeta = styled.Text`
  margin-top: 2px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  color: ${Colors.TextMuted};
`

const SAction = styled.Pressable`
  min-height: ${Layout.MinControl}px;
  padding: 6px 14px;
  border-radius: ${Radii.Control}px;
  justify-content: center;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.HairlineStrong};
`

const SActionText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  color: ${Colors.Seafoam};
`
