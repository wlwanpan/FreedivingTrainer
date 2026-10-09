import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, FontSizes } from '@/design/styles'
import { useSubscriptionContext } from '@/providers/subscription'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { PurchasesPackage } from 'react-native-purchases'
import { styled } from 'styled-components/native'


const VALUE_PROPS: { title: string; description: string }[] = [
  {
    title: 'Unlimited tables',
    description: 'Log every CO2 and O2 session after the free limit.',
  },
  {
    title: 'Both table types',
    description: 'Keep training CO2 tolerance and O2 holds.',
  },
  {
    title: 'On this device',
    description: 'Your sessions stay in the on-device database.',
  },
]

export default function PaywallScreen() {
  const router = useRouter()
  const subscription = useSubscriptionContext()
  const [purchaseInFlight, setPurchaseInFlight] = useState(false)
  const [restoreInFlight, setRestoreInFlight] = useState(false)

  const dismissable = subscription.hasLifetimeAccess || !subscription.freeLimitReached
  const packages = subscription.offerings?.current?.availablePackages ?? []

  useEffect(() => {
    if (subscription.hasLifetimeAccess) {
      router.dismissTo('/')
    }
  }, [subscription.hasLifetimeAccess, router])

  const usageLine = subscription.hasLifetimeAccess
    ? 'Lifetime access is active.'
    : subscription.freeLimitReached
      ? `You've used all ${subscription.freeSessionLimit} free tables.`
      : `${subscription.sessionsRemaining} of ${subscription.freeSessionLimit} free tables left.`

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchaseInFlight(true)
    await subscription.purchase(pkg)
    setPurchaseInFlight(false)
  }

  const handleRestore = async () => {
    setRestoreInFlight(true)
    await subscription.restorePurchase()
    setRestoreInFlight(false)
  }

  return (
    <WrapperScreen scrollable sheet>
      {dismissable && (
        <HeaderWithBtn
          headerText='Lifetime access'
          leftText='Close'
          leftOnClick={() => router.back()}
        />
      )}
      <SBody>
        <STitle>Train without a cap</STitle>
        <SUsage>{usageLine}</SUsage>
        {VALUE_PROPS.map((item) => (
          <SProp key={item.title}>
            <SPropTitle>{item.title}</SPropTitle>
            <SPropCopy>{item.description}</SPropCopy>
          </SProp>
        ))}
        {!subscription.configured && (
          <SNote>Add REVENUECAT_IOS_API_KEY to enable App Store purchases.</SNote>
        )}
        {subscription.configured && packages.length === 0 && (
          <SNote>No packages are available yet. Check the RevenueCat offering.</SNote>
        )}
        {packages.map((pkg) => (
          <Button
            key={pkg.identifier}
            title={`${pkg.product.title} · ${pkg.product.priceString}`}
            onPress={() => { void handlePurchase(pkg) }}
            loading={purchaseInFlight}
          />
        ))}
        <Button
          title='Restore purchase'
          onPress={() => { void handleRestore() }}
          loading={restoreInFlight}
          disabled={!subscription.configured}
          defaultBGColor={Colors.GreyPrimary}
          pressedBGColor={Colors.GreyFaded}
        />
      </SBody>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  padding: 12px 24px 32px;
`

const STitle = styled.Text`
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SUsage = styled.Text`
  margin-top: 8px;
  margin-bottom: 16px;
  font-size: ${FontSizes.Medium};
  color: ${Colors.GreyPrimary};
`

const SProp = styled.View`
  margin-bottom: 14px;
`

const SPropTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.DeepPrimary};
`

const SPropCopy = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SNote = styled.Text`
  margin-bottom: 12px;
  font-size: ${FontSizes.Small};
  color: ${Colors.CoralPrimary};
`
