import { Colors, FontSizes } from '@/design/styles'
import { Link, Stack } from 'expo-router'
import { styled } from 'styled-components/native'


export default function NotFoundScreen() {
  return (
    <Wrapper>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SLink href='/'>Go back to Tables</SLink>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.DeepPrimary};
`

const SLink = styled(Link)`
  font-size: ${FontSizes.Large};
  color: ${Colors.White};
  text-decoration-line: underline;
`
