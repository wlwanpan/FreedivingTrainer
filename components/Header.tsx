import { Layout } from '@/design/styles'
import { ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { styled } from 'styled-components/native'


type Props = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export default function Header({ children, style }: Props) {
  return (
    <Wrapper style={style}>
      {children}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-shrink: 0;
  min-height: ${Layout.MinControl}px;
  padding-top: 8px;
  padding-bottom: 8px;
`
