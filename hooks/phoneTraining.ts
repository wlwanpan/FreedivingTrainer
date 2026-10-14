import { PhoneTraining } from '@/utils/watch_sync'


let phoneTraining: PhoneTraining | null = null
const listeners = new Set<() => void>()

function same(current: PhoneTraining | null, next: PhoneTraining | null): boolean {
  if (current == null || next == null) return current === next
  return current.paused === next.paused
    && current.name === next.name
    && current.phase === next.phase
    && current.startedAt === next.startedAt
}

export function publishPhoneTraining(next: PhoneTraining | null) {
  if (same(phoneTraining, next)) return
  phoneTraining = next
  listeners.forEach((listener) => listener())
}

export function readPhoneTraining(): PhoneTraining | null {
  return phoneTraining
}

export function subscribePhoneTraining(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
