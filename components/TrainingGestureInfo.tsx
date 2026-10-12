import Button from '@/components/Button'
import { Colors, FontSizes, Layout } from '@/design/styles'
import { TrainingGestureCopy } from '@/utils/training_gestures'
import { styled } from 'styled-components/native'


type Props = {
  onClose: () => void
  onReplay: () => void
}

export default function TrainingGestureInfo({ onClose, onReplay }: Props) {
  return (
    <Wrapper onPress={onClose} accessibilityViewIsModal>
      <SCard onPress={() => {}}>
        <STitle>Gestures</STitle>
        <SRow>
          <SMark><SMarkText>1</SMarkText></SMark>
          <SCopy>
            <SRowTitle>{TrainingGestureCopy.singleTitle}</SRowTitle>
            <SRowBody>{TrainingGestureCopy.singleBody}</SRowBody>
          </SCopy>
        </SRow>
        <SRow>
          <SMark><SMarkText>2</SMarkText></SMark>
          <SCopy>
            <SRowTitle>{TrainingGestureCopy.doubleTitle}</SRowTitle>
            <SRowBody>{TrainingGestureCopy.doubleBody}</SRowBody>
          </SCopy>
        </SRow>
        <Button title='Got it' onPress={onClose} />
        <SReplay onPress={onReplay} accessibilityRole='button'>
          <SReplayText>Watch the tutorial</SReplayText>
        </SReplay>
      </SCard>
    </Wrapper>
  )
}

const Wrapper = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 7;
  justify-content: flex-end;
  background-color: rgba(6, 52, 60, 0.45);
`

const SCard = styled.Pressable`
  padding: 22px 20px 8px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background-color: ${Colors.White};
`

const STitle = styled.Text`
  margin-bottom: 14px;
  font-size: ${FontSizes.Large};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 14px;
`

const SMark = styled.View`
  width: 32px;
  height: 32px;
  margin-right: 12px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.TealBackground};
`

const SMarkText = styled.Text`
  color: ${Colors.TealPrimary};
  font-size: ${FontSizes.Medium};
  font-weight: 800;
`

const SCopy = styled.View`
  flex: 1;
`

const SRowTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SRowBody = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SReplay = styled.Pressable`
  min-height: ${Layout.MinControl}px;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
`

const SReplayText = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.TealPrimary};
`
