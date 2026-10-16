import useGarminBridge from '@/hooks/useGarminBridge'
import useWatchBridge from '@/hooks/useWatchBridge'


export default function WatchBridge() {
  useWatchBridge()
  useGarminBridge()
  return null
}
