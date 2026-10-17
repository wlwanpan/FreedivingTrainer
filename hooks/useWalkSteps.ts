import { useEffect, useState } from 'react'


export default function useWalkSteps(active: boolean): number | null {
  const [steps, setSteps] = useState<number | null>(null)

  useEffect(() => {
    if (!active) return
    let remove = () => {}
    let cancelled = false
    void (async () => {
      try {
        const { Pedometer } = await import('expo-sensors')
        const available = await Pedometer.isAvailableAsync()
        if (!available || cancelled) return
        const subscription = Pedometer.watchStepCount((result) => {
          setSteps(result.steps)
        })
        remove = () => subscription.remove()
      } catch {
        if (!cancelled) setSteps(null)
      }
    })()
    return () => {
      cancelled = true
      remove()
    }
  }, [active])

  return steps
}
