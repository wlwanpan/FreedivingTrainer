import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, Fonts, FontSizes } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { useSubscriptionContext } from '@/providers/subscription'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { PurchasesPackage } from 'react-native-purchases'
import { styled } from 'styled-components/native'


function goToDashboard(router: ReturnType<typeof useRouter>) {
  if (router.canDismiss()) {
    router.dismissAll()
  }
  router.replace('/')
}

export default function PaywallScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const subscription = useSubscriptionContext()
  const [purchaseInFlight, setPurchaseInFlight] = useState(false)
  const [restoreInFlight, setRestoreInFlight] = useState(false)

  const dismissable = subscription.hasLifetimeAccess || !subscription.freeLimitReached
  const packages = subscription.offerings?.current?.availablePackages ?? []

  useEffect(() => {
    if (!subscription.hasLifetimeAccess) return
    goToDashboard(router)
  }, [subscription.hasLifetimeAccess, router])

  const usageLine = subscription.hasLifetimeAccess
    ? t('paywall.active')
    : subscription.freeLimitReached
      ? t('paywall.usedAll', { limit: subscription.freeSessionLimit })
      : t('paywall.remaining', {
        remaining: subscription.sessionsRemaining,
        limit: subscription.freeSessionLimit,
      })
  const valueProps = [
    { title: t('paywall.unlimitedTitle'), description: t('paywall.unlimitedCopy') },
    { title: t('paywall.bothTitle'), description: t('paywall.bothCopy') },
    { title: t('paywall.deviceTitle'), description: t('paywall.deviceCopy') },
  ]

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
          headerText={t('paywall.title')}
          leftText={t('common.close')}
          leftOnClick={() => router.back()}
        />
      )}
      <SBody>
        <STitle>{t('paywall.headline')}</STitle>
        <SUsage>{usageLine}</SUsage>
        {valueProps.map((item) => (
          <SProp key={item.title}>
            <SPropTitle>{item.title}</SPropTitle>
            <SPropCopy>{item.description}</SPropCopy>
          </SProp>
        ))}
        {!subscription.configured && (
          <SNote>{t('paywall.needKey')}</SNote>
        )}
        {subscription.configured && packages.length === 0 && (
          <SNote>{t('paywall.noPackages')}</SNote>
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
          title={t('paywall.restore')}
          onPress={() => { void handleRestore() }}
          loading={restoreInFlight}
          disabled={!subscription.configured}
          variant='ghost'
        />
      </SBody>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  padding: 12px 24px 32px;
`

const STitle = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.XLarge};
  font-weight: 700;
  color: ${Colors.Text};
`

const SUsage = styled.Text`
  margin-top: 8px;
  margin-bottom: 16px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  color: ${Colors.TextMuted};
`

const SProp = styled.View`
  margin-bottom: 14px;
`

const SPropTitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SPropCopy = styled.Text`
  margin-top: 2px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SNote = styled.Text`
  margin-bottom: 12px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  color: ${Colors.Alert};
`
