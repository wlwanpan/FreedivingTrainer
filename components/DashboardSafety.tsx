import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import Ionicons from '@expo/vector-icons/Ionicons'
import { styled } from 'styled-components/native'


export default function DashboardSafety() {
  const { t } = useI18n()
  return (
    <Wrapper accessibilityRole='alert'>
      <SMark>
        <Ionicons name='warning' size={18} color={Colors.Alert} />
      </SMark>
      <SCopy>
        <SKicker>{t('safety.kicker')}</SKicker>
        <SHeadline>{t('safety.headline')}</SHeadline>
        <SBody>
          {t('safety.body')}
        </SBody>
      </SCopy>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 14px;
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: ${Space.md}px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.AlertMuted};
  border-width: 1px;
  border-color: ${Colors.Alert};
`

const SMark = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Alert};
`

const SCopy = styled.View`
  flex: 1;
`

const SKicker = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 700;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.Alert};
`

const SHeadline = styled.Text`
  margin-top: 2px;
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.Text};
`

const SBody = styled.Text`
  margin-top: 6px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  line-height: 16px;
  color: ${Colors.Text};
`
