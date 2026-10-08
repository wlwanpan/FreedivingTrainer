import { Colors, FontSizes } from '@/design/styles'
import { useSubscriptionContext } from '@/providers/subscription'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function FreeSessionsBanner() {
  const subscription = useSubscriptionContext()
  const router = useRouter()

  if (subscription.loading || subscription.hasLifetimeAccess) {
    return null
  }

  return (
    <Wrapper onPress={() => router.push('/paywall')}>
      <SText>
        {subscription.sessionsRemaining} of {subscription.freeSessionLimit} free tables left
      </SText>
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  margin: 8px 20px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: ${Colors.TealBackground};
`

const SText = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.TealPrimary};
`
