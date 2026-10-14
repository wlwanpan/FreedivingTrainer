import { Colors, Fonts, FontSizes, Layout, Space } from '@/design/styles'
import { ReactNode } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  title: string
  right?: ReactNode
}

export default function ScreenHeader({ title, right }: Props) {
  return (
    <Wrapper>
      <SLead>
        <SDot />
        <STitle>{title}</STitle>
      </SLead>
      <SRight>
        {right}
      </SRight>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  min-height: ${Layout.MinControl}px;
  padding: ${Space.sm}px ${Space.screen}px ${Space.xs}px;
`

const SLead = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: ${Space.sm}px;
`

const SDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${Colors.Seafoam};
  shadow-color: ${Colors.Seafoam};
  shadow-opacity: 0.7;
  shadow-radius: 6px;
  shadow-offset: 0px 0px;
`

const STitle = styled.Text`
  flex-shrink: 1;
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Large};
  font-weight: 600;
  letter-spacing: -0.4px;
  color: ${Colors.Text};
`

const SRight = styled.View`
  min-width: ${Layout.MinControl}px;
  min-height: ${Layout.MinControl}px;
  flex-shrink: 0;
  align-items: flex-end;
  justify-content: center;
`
