import { ENTITLEMENT_ID, FREE_SESSION_LIMIT } from '@/constants/subscription'
import { ErrorTitles } from '@/constants/errors'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import Constants from 'expo-constants'
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import Purchases, {
  CustomerInfo,
  PurchasesError,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases'


const IOS_API_KEY = (Constants.expoConfig?.extra?.revenueCatIosApiKey as string | undefined) ?? ''
const ANDROID_API_KEY = (Constants.expoConfig?.extra?.revenueCatAndroidApiKey as string | undefined) ?? ''

let purchasesConfigured = false

function configurePurchasesOnce(): boolean {
  if (purchasesConfigured) {
    return true
  }

  const apiKey = Platform.select({
    ios: IOS_API_KEY,
    android: ANDROID_API_KEY,
    default: '',
  })
  if (!apiKey) {
    console.warn(`Purchases not configured: missing API key for ${Platform.OS}`)
    return false
  }

  Purchases.configure({ apiKey })
  purchasesConfigured = true
  return true
}

export interface ISubscriptionContext {
  loading: boolean
  configured: boolean
  shouldTriggerPaywall: boolean
  hasLifetimeAccess: boolean
  freeSessionLimit: number
  sessionsUsed: number
  sessionsRemaining: number
  freeLimitReached: boolean
  offerings: PurchasesOfferings | null
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; cancelled: boolean }>
  restorePurchase: () => Promise<{ success: boolean; restored: boolean }>
}

const SubscriptionContext = createContext<ISubscriptionContext | null>(null)

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}

type Props = { children: ReactNode }

export default function SubscriptionProvider({ children }: Props) {
  const { sessions } = useSQLContext()
  const { showWarning } = useWarningModal()

  const [configured, setConfigured] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ready = configurePurchasesOnce()
    setConfigured(ready)
    if (!ready) {
      setLoading(false)
      return
    }

    const listener = (info: CustomerInfo) => setCustomerInfo(info)
    Purchases.addCustomerInfoUpdateListener(listener)

    Purchases.getCustomerInfo()
      .then(setCustomerInfo)
      .catch((e) => console.error('getCustomerInfo error:', e))
      .finally(() => setLoading(false))

    Purchases.getOfferings()
      .then(setOfferings)
      .catch((e) => console.error('getOfferings error:', e))

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener)
    }
  }, [])

  const hasLifetimeAccess = !!customerInfo?.entitlements.active[ENTITLEMENT_ID]
  const sessionsUsed = sessions.length
  const sessionsRemaining = Math.max(0, FREE_SESSION_LIMIT - sessionsUsed)
  const freeLimitReached = !hasLifetimeAccess && sessionsUsed >= FREE_SESSION_LIMIT
  const shouldTriggerPaywall = freeLimitReached

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      await Purchases.purchasePackage(pkg)
      await Purchases.invalidateCustomerInfoCache()
      const refreshedInfo = await Purchases.getCustomerInfo()
      setCustomerInfo(refreshedInfo)
      return { success: true, cancelled: false }
    } catch (e) {
      const err = e as PurchasesError
      if (err?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { success: false, cancelled: true }
      }
      showWarning(ErrorTitles.Crash, err?.message ?? 'Something went wrong. Please try again.')
      return { success: false, cancelled: false }
    }
  }, [showWarning])

  const restorePurchase = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases()
      setCustomerInfo(info)
      const restored = !!info.entitlements.active[ENTITLEMENT_ID]
      if (!restored) {
        showWarning(ErrorTitles.Input, 'No previous purchase found for this account.')
      }
      return { success: true, restored }
    } catch (e) {
      const err = e as PurchasesError
      showWarning(ErrorTitles.Crash, err?.message ?? 'Something went wrong. Please try again.')
      return { success: false, restored: false }
    }
  }, [showWarning])

  return (
    <SubscriptionContext.Provider value={{
      loading,
      configured,
      shouldTriggerPaywall,
      hasLifetimeAccess,
      freeSessionLimit: FREE_SESSION_LIMIT,
      sessionsUsed,
      sessionsRemaining,
      freeLimitReached,
      offerings,
      purchase,
      restorePurchase,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}
