import { Colors, Fonts, FontSizes } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { useSubscriptionContext } from '@/providers/subscription'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function FreeSessionsBanner() {
  const { t } = useI18n()
  const subscription = useSubscriptionContext()
  const router = useRouter()

  if (subscription.loading || subscription.hasLifetimeAccess) {
    return null
  }

  return (
    <Wrapper onPress={() => router.push('/paywall')}>
      <SText>
        {t('subscription.freeLeft', {
          remaining: subscription.sessionsRemaining,
          limit: subscription.freeSessionLimit,
        })}
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
