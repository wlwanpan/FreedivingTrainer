import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { SafetyNotice } from '@/utils/practice'
import { styled } from 'styled-components/native'


type Props = {
  notices: readonly SafetyNotice[]
}

export default function PracticeNotices({ notices }: Props) {
  const { t } = useI18n()
  if (notices.length === 0) return null

  return (
    <Wrapper>
      {notices.map((notice) => (
        <SNotice key={notice.key} $alert={notice.alert === true} accessibilityRole='alert'>
          <SText $alert={notice.alert === true}>{t(notice.key)}</SText>
        </SNotice>
      ))}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  gap: ${Space.sm}px;
  margin-bottom: ${Space.sm}px;
`

const SNotice = styled.View<{ $alert: boolean }>`
  padding: ${Space.sm}px ${Space.md}px;
  border-radius: ${Radii.Control}px;
  background-color: ${(props) => props.$alert ? Colors.AlertMuted : Colors.CardAlt};
  border-width: 1px;
  border-color: ${(props) => props.$alert ? Colors.Alert : Colors.Hairline};
`

const SText = styled.Text<{ $alert: boolean }>`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${(props) => props.$alert ? Colors.Alert : Colors.Text};
`
