import Button from '@/components/Button'
import { Colors, FontSizes } from '@/design/styles'
import { useWarningModal } from '@/providers/warning_modal'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styled } from 'styled-components/native'


export default function WarningScreen() {
  const { title, description, mode } = useLocalSearchParams<{
    title: string
    description: string
    mode?: string
  }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { confirmResolverRef, markWarningClosed } = useWarningModal()
  const isConfirmDeletion = mode === 'confirm_deletion'
  const isConfirm = mode === 'confirm'
  const hasConfirmActions = isConfirmDeletion || isConfirm
  const confirmButtonTitle = isConfirmDeletion ? 'Delete' : 'Continue'

  useEffect(() => {
    return markWarningClosed
  }, [markWarningClosed])

  const dismiss = () => {
    const resolve = confirmResolverRef.current
    confirmResolverRef.current = null
    resolve?.(false)
    router.back()
  }

  const handleConfirm = () => {
    const resolve = confirmResolverRef.current
    confirmResolverRef.current = null
    resolve?.(true)
    router.back()
  }

  return (
    <Wrapper onPress={dismiss}>
      <SCard
        onPress={() => {}}
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <STitle>{title}</STitle>
        <SDescription>{description}</SDescription>
        {hasConfirmActions ? (
          <SActions>
            <Button
              title={confirmButtonTitle}
              onPress={handleConfirm}
              defaultBGColor={isConfirmDeletion ? Colors.RedPrimary : Colors.TealPrimary}
              pressedBGColor={isConfirmDeletion ? Colors.RedBackground : Colors.TealFaded}
            />
            <Button
              title='Cancel'
              onPress={dismiss}
              defaultBGColor={Colors.GreyPrimary}
              pressedBGColor={Colors.GreyFaded}
            />
          </SActions>
        ) : (
          <Button title='Got it' onPress={dismiss} />
        )}
      </SCard>
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.45);
`

const SCard = styled.Pressable`
  padding: 24px 20px 8px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background-color: ${Colors.White};
`

const STitle = styled.Text`
  font-size: ${FontSizes.Large};
  font-weight: 700;
  color: ${Colors.DeepPrimary};
`

const SDescription = styled.Text`
  margin-top: 8px;
  margin-bottom: 16px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.GreyPrimary};
`

const SActions = styled.View`
  width: 100%;
`
