import { Colors } from '@/design/styles'
import { Stack } from 'expo-router'


export default function WearableLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.Canvas },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='add' />
    </Stack>
  )
}
