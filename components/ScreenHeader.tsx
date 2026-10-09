import { Colors, FontSizes, Layout } from '@/design/styles'
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
  flex-shrink: 0;
  align-items: center;
  min-height: ${Layout.MinControl}px;
  padding: 8px 12px 4px;
`

const SSide = styled.View`
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  align-items: flex-end;
  justify-content: center;
`

const STitle = styled.Text`
  flex: 1;
  text-align: center;
  font-size: ${FontSizes.Large};
  font-style: italic;
  font-weight: 900;
  color: ${Colors.TealPrimary};
`
