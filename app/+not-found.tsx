import { Colors, FontSizes } from '@/design/styles'
import { Link, Stack } from 'expo-router'
import { styled } from 'styled-components/native'


export default function NotFoundScreen() {
  return (
    <Wrapper>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SLink href='/'>Go back to Home</SLink>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.Canvas};
`

const SLink = styled(Link)`
  font-size: ${FontSizes.Large};
  color: ${Colors.Seafoam};
  text-decoration-line: underline;
`
