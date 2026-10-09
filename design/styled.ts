import { createElement, ReactNode } from 'react'
import { styled } from 'styled-components/native'
import { useBottomControlInset } from './chrome'
import { Colors } from './styles'


export const Flex = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

export const Spacer = styled.View`
  flex: 1;
`

export const TabContainer = styled.View`
  flex: 1;
  background-color: ${Colors.White};
`

type FooterProps = {
  children: ReactNode
  aboveTabs?: boolean
}

export function Footer({ children, aboveTabs = false }: FooterProps) {
  const paddingBottom = useBottomControlInset(aboveTabs)

  return createElement(SFooter, { style: { paddingBottom } }, children)
}

const SFooter = styled.View`
  flex-shrink: 0;
  padding: 12px 20px 0;
`
