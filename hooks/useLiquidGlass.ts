import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect'
import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'


export default function useLiquidGlass(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduced)
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced)
    return () => sub.remove()
  }, [])

  return !reduced && liquidGlassSupported()
}

function liquidGlassSupported(): boolean {
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable()
  } catch {
    return false
  }
}
