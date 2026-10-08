import Loader from '@/components/Loader'
import { Colors } from '@/design/styles'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import Ionicons from '@expo/vector-icons/Ionicons'
import { usePathname, useRouter } from 'expo-router'
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs'
import { useEffect } from 'react'
import WrapperScreen from '@/components/WrapperScreen'


export default function TabLayout() {
  const sql = useSQLContext()
  const subscription = useSubscriptionContext()
  const router = useRouter()
  const pathname = usePathname()
  const onboardedAt = sql.settings.createdAt?.getTime() ?? null

  useEffect(() => {
    if (sql.updatedAt === undefined) return

    if (onboardedAt === null) {
      const finishingOnboarding = pathname === '/onboarding'
        || pathname === '/baseline'
        || pathname === '/warning'
      if (!finishingOnboarding) {
        router.replace('/onboarding')
      }
      return
    }

    if (
      !subscription.loading
      && subscription.shouldTriggerPaywall
      && pathname !== '/paywall'
      && pathname !== '/baseline'
    ) {
      router.replace('/paywall')
    }
  }, [
    sql.updatedAt,
    onboardedAt,
    subscription.loading,
    subscription.shouldTriggerPaywall,
    pathname,
    router,
  ])

  if (sql.updatedAt === undefined) {
    return (
      <WrapperScreen>
        <Loader isLoading>{null}</Loader>
      </WrapperScreen>
    )
  }

  return (
    <NativeTabs
      backgroundColor={Colors.White}
      tintColor={Colors.TealPrimary}
      labelStyle={{ color: Colors.TealPrimary }}
    >
      <NativeTabs.Trigger name='index'>
        <Label>Tables</Label>
        <Icon
          sf={{ default: 'timer', selected: 'timer' }}
          androidSrc={<VectorIcon family={Ionicons} name='timer-outline' />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='sessions'>
        <Label>Sessions</Label>
        <Icon
          sf={{ default: 'list.bullet', selected: 'list.bullet' }}
          androidSrc={<VectorIcon family={Ionicons} name='list-outline' />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
