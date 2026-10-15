import Button from '@/components/Button'
import { Colors, Fonts, FontSizes } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { useWarningModal } from '@/providers/warning_modal'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styled } from 'styled-components/native'


export default function WarningScreen() {
  const { title, description, mode, confirmTitle } = useLocalSearchParams<{
    title: string
    description: string
    mode?: string
    confirmTitle?: string
  }>()
  const { t } = useI18n()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { confirmResolverRef, markWarningClosed } = useWarningModal()
  const isConfirmDeletion = mode === 'confirm_deletion'
  const isConfirm = mode === 'confirm'
  const hasConfirmActions = isConfirmDeletion || isConfirm
  const confirmButtonTitle = confirmTitle
    ?? (isConfirmDeletion ? t('common.delete') : t('common.confirm'))

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
              variant={isConfirmDeletion ? 'danger' : 'primary'}
            />
            <Button
              title={t('common.cancel')}
              onPress={dismiss}
              variant='muted'
            />
          </SActions>
        ) : (
          <Button title={t('common.gotIt')} onPress={dismiss} />
        )}
      </SCard>
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  background-color: ${Colors.Overlay};
`

const SCard = styled.Pressable`
  padding: 24px 20px 8px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background-color: ${Colors.Card};
`

const STitle = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Large};
  font-weight: 700;
  color: ${Colors.Text};
`

const SDescription = styled.Text`
  margin-top: 8px;
  margin-bottom: 16px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`

const SActions = styled.View`
  width: 100%;
`
