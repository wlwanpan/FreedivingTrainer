import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


export default function DashboardQuote() {
  return (
    <Wrapper>
      <SMark>
        <Ionicons name='leaf-outline' size={18} color={Colors.Seafoam} />
      </SMark>
      <SCopy>
        <SQuote>
          Relaxation is not something you do, it is an absence of effort.
        </SQuote>
        <SCite>Umberto Pelizzari</SCite>
      </SCopy>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 14px;
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: ${Space.md}px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.CardAlt};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SMark = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SCopy = styled.View`
  flex: 1;
`

const SQuote = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  font-style: italic;
  line-height: 16px;
  color: ${Colors.Text};
`

const SCite = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`
