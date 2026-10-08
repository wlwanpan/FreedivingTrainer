import { useRouter } from 'expo-router'
import { createContext, ReactNode, useCallback, useContext, useRef } from 'react'
import { Keyboard } from 'react-native'


interface IWarningModal {
  showWarning: (title: string, description: string) => void
  showConfirmation: (title: string, description: string) => Promise<boolean>
  showConfirmDeletion: (title: string, description: string) => Promise<boolean>
  confirmResolverRef: React.RefObject<((confirmed: boolean) => void) | null>
  markWarningClosed: () => void
}

export const WarningModalContext = createContext<IWarningModal | null>(null)

export const useWarningModal = () => {
  const context = useContext(WarningModalContext)
  if (!context) {
    throw new Error('useWarningModal must be used within a WarningModalProvider')
  }
  return context
}

type Props = {
  children: ReactNode
}

export default function WarningModalProvider({ children }: Props) {
  const router = useRouter()
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null)
  const isWarningVisibleRef = useRef(false)

  const markWarningClosed = useCallback(() => {
    isWarningVisibleRef.current = false
  }, [])

  const showWarning = useCallback((title: string, description: string) => {
    if (isWarningVisibleRef.current) return
    Keyboard.dismiss()
    isWarningVisibleRef.current = true
    router.push({
      pathname: '/warning',
      params: { title, description },
    })
  }, [router])

  const showConfirmModal = useCallback(async (
    title: string,
    description: string,
    mode: 'confirm' | 'confirm_deletion',
  ): Promise<boolean> => {
    if (isWarningVisibleRef.current) return false
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      Keyboard.dismiss()
      isWarningVisibleRef.current = true
      router.push({
        pathname: '/warning',
        params: { title, description, mode },
      })
    })
  }, [router])

  const showConfirmation = useCallback(
    (title: string, description: string) => showConfirmModal(title, description, 'confirm'),
    [showConfirmModal],
  )

  const showConfirmDeletion = useCallback(
    (title: string, description: string) => showConfirmModal(title, description, 'confirm_deletion'),
    [showConfirmModal],
  )

  return (
    <WarningModalContext.Provider value={{
      showWarning,
      showConfirmation,
      showConfirmDeletion,
      confirmResolverRef,
      markWarningClosed,
    }}>
      {children}
    </WarningModalContext.Provider>
  )
}
