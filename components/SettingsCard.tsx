import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ComponentProps, ReactNode } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  icon: ComponentProps<typeof Ionicons>['name']
  title: string
  children: ReactNode
}

export default function SettingsCard({ icon, title, children }: Props) {
  return (
    <Wrapper>
      <SHeader>
        <Ionicons name={icon} size={16} color={Colors.Seafoam} />
        <STitle>{title}</STitle>
      </SHeader>
      {children}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 20px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
  shadow-color: ${Colors.Shadow};
  shadow-opacity: 0.06;
  shadow-radius: 12px;
  shadow-offset: 0px 8px;
  elevation: 2;
`

const SHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-bottom: ${Space.sm}px;
`

const STitle = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`
