import { Layout } from '@/design/styles'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


function iosMajor(): number {
  const version = Platform.Version
  return typeof version === 'string' ? parseFloat(version) : version
}

/**
 * Space a pinned control needs below it.
 * On a tab screen the iOS 26 tab bar floats over the content, so the safe-area
 * inset alone leaves the control under the bar.
 */
export function useBottomControlInset(aboveTabs = false): number {
  const insets = useSafeAreaInsets()
  if (aboveTabs && Platform.OS === 'ios' && iosMajor() >= 26) {
    return Layout.TabBarHeight + Layout.ChromeGap
  }
  return insets.bottom + Layout.ChromeGap
}
