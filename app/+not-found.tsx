import { Colors, FontSizes } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { Link, Stack } from 'expo-router'
import { styled } from 'styled-components/native'


export default function NotFoundScreen() {
  const { t } = useI18n()
  return (
    <Wrapper>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <SLink href='/'>{t('notFound.link')}</SLink>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.Canvas};
`

const SLink = styled(Link)`
  font-size: ${FontSizes.Large};
  color: ${Colors.Seafoam};
  text-decoration-line: underline;
`
