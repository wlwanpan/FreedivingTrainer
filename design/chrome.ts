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

/**
 * Space above a top control.
 * A full-screen route sits under the status bar, so it uses the device inset.
 * A sheet already starts below the status bar, so the device inset would
 * leave an empty band above the header.
 */
export function useTopControlInset(inSheet = false): number {
  const insets = useSafeAreaInsets()
  if (inSheet) {
    return ChromeGap
  }
  return insets.top
}
