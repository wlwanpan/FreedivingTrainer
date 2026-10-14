import { Colors, FontSizes } from '@/design/styles'
import useWearableStatus, { wearableLabel, wearableLive } from '@/hooks/useWearableStatus'
import { styled } from 'styled-components/native'


export default function WearableStatus() {
  const status = useWearableStatus()
  const live = wearableLive(status)

  return (
    <Wrapper>
      <SRow>
        <SDot $live={live} />
        <SLabel $live={live}>{wearableLabel(status)}</SLabel>
      </SRow>
      {status.syncLabel == null ? null : <SSync>{status.syncLabel}</SSync>}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  align-items: flex-start;
  gap: 2px;
  margin-bottom: 12px;
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
  background-color: ${(props) => props.$live ? Colors.GreenPrimary : Colors.GreyPrimary};
`

const SLabel = styled.Text<{ $live: boolean }>`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${(props) => props.$live ? Colors.GreenPrimary : Colors.GreyPrimary};
`

const SSync = styled.Text`
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.GreyPrimary};
`
