import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { styled } from 'styled-components/native'


type Props = {
  onStart: () => void
  onBack: () => void
}

export default function BaselinePrep({ onStart, onBack }: Props) {
  const { t } = useI18n()
  return (
    <Wrapper>
      <HeaderWithBtn headerText={t('baseline.title')} leftBack leftOnClick={onBack} />
      <SBody showsVerticalScrollIndicator={false}>
        <STitle>{t('baseline.oneHold')}</STitle>
        <SCopy>
          {t('baseline.copy')}
        </SCopy>
        <SWarning>{t('baseline.warning')}</SWarning>
        <SCard>
          <SCardTitle>{t('baseline.firstContraction')}</SCardTitle>
          <SCardCopy>
            {t('baseline.firstCopy')}
          </SCardCopy>
        </SCard>
        <SCard>
          <SCardTitle>{t('baseline.thenHold')}</SCardTitle>
          <SCardCopy>
            {t('baseline.thenCopy')}
          </SCardCopy>
        </SCard>
      </SBody>
      <Footer>
        <Button title={t('baseline.startHold')} onPress={onStart} />
      </Footer>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
`

const SBody = styled.ScrollView`
  flex: 1;
  padding: 8px 24px 0;
`

const STitle = styled.Text`
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.Text};
`

const SCopy = styled.Text`
  margin-top: 12px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.TextMuted};
`

const SWarning = styled.Text`
  margin-top: 12px;
  margin-bottom: 20px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  font-weight: 600;
  color: ${Colors.Alert};
`

const SCard = styled.View`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 14px;
  background-color: ${Colors.SeafoamMuted};
`

const SCardTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.Text};
`

const SCardCopy = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`
