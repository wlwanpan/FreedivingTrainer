import Loader from '@/components/Loader'
import { Colors } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import Ionicons from '@expo/vector-icons/Ionicons'
import { usePathname, useRouter } from 'expo-router'
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs'
import { useEffect } from 'react'
import WrapperScreen from '@/components/WrapperScreen'


export default function TabLayout() {
  const sql = useSQLContext()
  const { t } = useI18n()
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
      backgroundColor={Colors.Chrome}
      tintColor={Colors.Seafoam}
      iconColor={{ default: Colors.TextMuted, selected: Colors.Seafoam }}
      labelStyle={{
        default: { color: Colors.TextMuted },
        selected: { color: Colors.Seafoam },
      }}
      blurEffect='systemMaterialLight'
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name='index'>
        <Label>{t('tabs.home')}</Label>
        <Icon
          sf={{ default: 'drop', selected: 'drop.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name='water-outline' />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='table'>
        <Label>{t('tabs.tables')}</Label>
        <Icon
          sf={{ default: 'timer', selected: 'timer' }}
          androidSrc={<VectorIcon family={Ionicons} name='timer-outline' />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='settings'>
        <Label>{t('tabs.settings')}</Label>
        <Icon
          sf={{ default: 'slider.horizontal.3', selected: 'slider.horizontal.3' }}
          androidSrc={<VectorIcon family={Ionicons} name='options-outline' />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
