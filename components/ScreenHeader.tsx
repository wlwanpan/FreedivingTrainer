import { Colors, FontSizes } from '@/design/styles'
import { ReactNode } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  title: string
  right?: ReactNode
}

export default function ScreenHeader({ title, right }: Props) {
  return (
    <Wrapper>
      <SSide />
      <STitle>{title}</STitle>
      <SSide>
        {right}
      </SSide>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px 4px;
`

const SSide = styled.View`
  width: 44px;
  align-items: flex-end;
`

const STitle = styled.Text`
  flex: 1;
  text-align: center;
  font-size: ${FontSizes.Large};
  font-style: italic;
  font-weight: 900;
  color: ${Colors.TealPrimary};
`
