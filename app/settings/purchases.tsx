import Button from '@/components/Button'
import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { Colors } from '@/design/styles'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function PurchasesScreen() {
  const router = useRouter()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const [restoreInFlight, setRestoreInFlight] = useState(false)

  const restore = async () => {
    if (!subscription.configured) {
      showWarning(ErrorTitles.Input, 'Add a RevenueCat API key before restoring purchases.')
      return
    }
    setRestoreInFlight(true)
    await subscription.restorePurchase()
    setRestoreInFlight(false)
  }

  return (
    <WrapperScreen scrollable>
      <HeaderWithBtn
        headerText='Purchases'
        leftText='Back'
        leftOnClick={() => router.back()}
      />
      <SBody>
        <FreeSessionsBanner />
        <Button
          title={subscription.hasLifetimeAccess ? 'Lifetime access is active' : 'Unlock lifetime access'}
          onPress={() => router.push('/paywall')}
          disabled={subscription.hasLifetimeAccess}
        />
        <Button
          title='Restore purchase'
          onPress={() => { void restore() }}
          loading={restoreInFlight}
          defaultBGColor={Colors.GreyPrimary}
          pressedBGColor={Colors.GreyFaded}
        />
      </SBody>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  padding: 16px 20px 32px;
`
