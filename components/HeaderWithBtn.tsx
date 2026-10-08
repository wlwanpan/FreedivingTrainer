import { FontSizes } from '@/design/styles'
import { ReactNode } from 'react'
import { styled } from 'styled-components/native'
import BackBtn from './BackBtn'
import Header from './Header'
import HeaderTextBtn from './HeaderTextBtn'


type Props = {
  headerText?: string
  leftText?: string
  rightText?: string
  leftOnClick?: () => void
  rightOnClick?: () => void
  disabled?: boolean
  disabledRight?: boolean
  children?: ReactNode
}

export default function HeaderWithBtn({
  headerText,
  leftText,
  rightText,
  leftOnClick,
  rightOnClick,
  disabled,
  disabledRight,
  children,
}: Props) {
  const leftBtn = leftText === 'Back' ? (
    <BackBtn onPress={leftOnClick} disabled={disabled} />
  ) : leftText ? (
    <HeaderTextBtn text={leftText} onClick={leftOnClick} disabled={disabled} />
  ) : children

  return (
    <Wrapper>
      <SSide>
        {leftBtn}
      </SSide>
      <STitle>{headerText}</STitle>
      <SRight>
        {rightText ? (
          <HeaderTextBtn
            text={rightText}
            onClick={rightOnClick}
            disabled={disabled || disabledRight}
          />
        ) : null}
      </SRight>
    </Wrapper>
  )
}

const Wrapper = styled(Header)`
  flex-direction: row;
  align-items: center;
  padding-left: 8px;
  padding-right: 8px;
`

const SSide = styled.View`
  width: 80px;
  align-items: flex-start;
`

const SRight = styled(SSide)`
  align-items: flex-end;
`

const STitle = styled.Text`
  flex: 1;
  text-align: center;
  font-size: ${FontSizes.Medium};
  font-weight: bold;
`
