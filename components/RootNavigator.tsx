import { Colors } from '@/design/styles'
import { useSubscriptionContext } from '@/providers/subscription'
import { Stack } from 'expo-router'


export default function RootNavigator() {
  const { hasLifetimeAccess, freeLimitReached } = useSubscriptionContext()
  const paywallDismissable = hasLifetimeAccess || !freeLimitReached

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.White },
    }}>
      <Stack.Screen name='(tabs)' options={{ animation: 'fade' }} />
      <Stack.Screen
        name='settings'
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name='onboarding'
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name='baseline'
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name='train'
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name='paywall'
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
          gestureEnabled: paywallDismissable,
        }}
      />
      <Stack.Screen
        name='warning'
        options={{
          animation: 'fade',
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  )
}
