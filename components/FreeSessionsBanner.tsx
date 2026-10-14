import { Colors, Fonts, FontSizes } from '@/design/styles'
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
  margin-top: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: ${Colors.SeafoamMuted};
`

const SText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Seafoam};
`
