import { Colors, FontSizes } from '@/design/styles'
import { styled } from 'styled-components/native'


type Props = {
  message: string
}

export default function EmptyListPlaceholder({ message }: Props) {
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

const SText = styled.Text`
  font-size: ${FontSizes.Medium};
  text-align: center;
  color: ${Colors.GreyPrimary};
`
