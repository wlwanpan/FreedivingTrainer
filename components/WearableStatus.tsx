import { Colors, FontSizes } from '@/design/styles'
import useWearableStatus, { wearableLabel, wearableLive } from '@/hooks/useWearableStatus'
import { useI18n } from '@/providers/i18n'
import { styled } from 'styled-components/native'


export default function WearableStatus() {
  const { t } = useI18n()
  const status = useWearableStatus()
  const live = wearableLive(status)

  return (
    <Wrapper>
      <SRow>
        <SDot $live={live} />
        <SLabel $live={live}>{wearableLabel(status, t)}</SLabel>
      </SRow>
      {status.syncLabel == null ? null : <SSync>{status.syncLabel}</SSync>}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  align-items: flex-start;
  gap: 2px;
  margin-bottom: 0;
`

const SRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`

const SDot = styled.View<{ $live: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => props.$live ? Colors.Seafoam : Colors.TextMuted};
`

const SLabel = styled.Text<{ $live: boolean }>`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${(props) => props.$live ? Colors.Seafoam : Colors.TextMuted};
`

const SSync = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.TextMuted};
`
