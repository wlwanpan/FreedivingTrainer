import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


// Height of the bar itself. The home-indicator inset is added from the device,
// so this does not change between phones.
const TabBarHeight = 49
const AndroidNativeTabBarHeight = 80
const ChromeGap = 8

/**
 * Space under a pinned control.
 * On a tab screen the bar floats over the content, so the safe-area inset
 * alone leaves the control under the bar.
 */
export function useBottomControlInset(aboveTabs = false): number {
  const insets = useSafeAreaInsets()
  if (!aboveTabs) {
    return insets.bottom + ChromeGap
  }
  const barHeight = Platform.OS === 'android' ? AndroidNativeTabBarHeight : TabBarHeight
  return insets.bottom + barHeight + ChromeGap
}
