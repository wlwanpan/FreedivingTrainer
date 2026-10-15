import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { styled } from 'styled-components/native'


type Props = {
  message: string
  card?: boolean
}

export default function EmptyListPlaceholder({ message, card = false }: Props) {
  if (card) {
    return (
      <SCard>
        <SText>{message}</SText>
      </SCard>
    )
  }

  return (
    <Wrapper>
      <SText>{message}</SText>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  padding: 48px 24px;
  align-items: center;
`

const SCard = styled.View`
  margin: 0 ${Space.screen}px;
  padding: ${Space.lg}px ${Space.md}px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: 1;
  align-items: center;
`

const SText = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  text-align: center;
  color: ${Colors.TextMuted};
`
